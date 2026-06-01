import { db } from "@/lib/db";
import { legalDocuments } from "@/database/schema";
import { chunkWithMetadata } from "@/lib/ai/chunking";
import { eq, and, or, sql, ilike, desc } from "drizzle-orm";

// Dimension del vector en BD: 384 (all-MiniLM-L6-v2 nativo)
const EMBEDDING_DIMS = 384;

// ─── Embedding semántico local con transformers.js ────
// Usa @xenova/transformers para embeddings BERT reales (384 dims).
// Sin padding artificial: el vector se almacena con las dimensiones reales del modelo.
const MODEL = "Xenova/all-MiniLM-L6-v2";

async function generateEmbeddingSemantic(text: string): Promise<number[]> {
  try {
    const { pipeline: pipe } = await import("@xenova/transformers");
    const extractor = await pipe("feature-extraction", MODEL);
    const result = await extractor(text, { pooling: "mean", normalize: true });
    return Array.from(result.data as Float32Array).slice(0, EMBEDDING_DIMS);
  } catch (error) {
    console.warn("[Embeddings] Transformers falló, usando fallback hash:", error);
    return generateEmbeddingLocal(text);
  }
}

// ─── Fallback hash-based optimizado ──

async function generateEmbeddingLocal(text: string, dims = EMBEDDING_DIMS): Promise<number[]> {
  const vec = new Float64Array(dims);
  const len = text.length;
  let i = 0;
  let wordHash = 0;
  let wordLen = 0;

  while (i < len) {
    const code = text.charCodeAt(i);
    const isLower = code >= 97 && code <= 122;
    const isDigit = code >= 48 && code <= 57;
    const isAccent = (code >= 224 && code <= 252) && code !== 240 && code !== 248;
    const isSpace = code === 32;
    const isValid = isLower || isDigit || isAccent;

    if (isValid) {
      wordHash = ((wordHash << 5) - wordHash + code) | 0;
      wordLen++;
      if (i > 0) {
        const prev = text.charCodeAt(i - 1);
        if (prev !== 32) {
          vec[Math.abs(((0 << 5) - 0 + prev | 0) << 5 ^ code) % dims] += 0.3;
        }
      }
    } else if (isSpace && wordLen > 0) {
      vec[Math.abs(wordHash) % dims] += 1;
      wordHash = 0;
      wordLen = 0;
    }
    i++;
  }
  if (wordLen > 0) vec[Math.abs(wordHash) % dims] += 1;

  let mag = 0;
  for (let j = 0; j < dims; j++) mag += vec[j] * vec[j];
  mag = Math.sqrt(mag);
  if (mag > 0) for (let j = 0; j < dims; j++) vec[j] /= mag;

  return Array.from(vec);
}

export async function generateEmbedding(text: string, dims = EMBEDDING_DIMS): Promise<number[]> {
  const provider = process.env.EMBEDDINGS_PROVIDER || "semantic";
  
  if (provider === "deepseek") {
    return generateEmbeddingDeepSeek(text);
  }
  if (provider === "semantic") {
    return generateEmbeddingSemantic(text);
  }
  
  return generateEmbeddingLocal(text, dims);
}

// ─── DeepSeek Embeddings API ─────────────────────
async function generateEmbeddingDeepSeek(text: string): Promise<number[]> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY no configurada");

  const res = await fetch("https://api.deepseek.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-embedding",
      input: text,
      encoding_format: "float",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepSeek embeddings error (${res.status}): ${err}`);
  }

  const json = await res.json();
  const rawEmbedding = json.data?.[0]?.embedding as number[] | undefined;
  if (!rawEmbedding) {
    throw new Error("No se recibio embedding de DeepSeek");
  }

  // DeepSeek devuelve 2048 dims, truncar a 384
  const truncated = new Float64Array(EMBEDDING_DIMS);
  for (let i = 0; i < Math.min(rawEmbedding.length, EMBEDDING_DIMS); i++) {
    truncated[i] = rawEmbedding[i];
  }

  return Array.from(truncated);
}

// ─── Store & index ────────────────────────────

export async function embedAndStore(
  source: string,
  title: string,
  content: string,
): Promise<number> {
  const chunks = chunkWithMetadata(source, title, content);

  for (const chunk of chunks) {
    const embedding = await generateEmbedding(chunk.content);
    await db.insert(legalDocuments).values({
      source: chunk.source,
      title: chunk.title,
      content: chunk.content,
      chunkIndex: chunk.chunkIndex,
      embedding: embedding,
    } as typeof legalDocuments.$inferInsert);
  }

  return chunks.length;
}

export async function deleteBySource(source: string): Promise<number> {
  const result = await db.delete(legalDocuments).where(eq(legalDocuments.source, source));
  return result.rowCount ?? 0;
}

// ─── Hybrid retrieval: vector + keyword ────────

export async function searchSimilarDocuments(
  query: string,
  limit = 5,
  sourceFilter?: string,
): Promise<Array<{ title: string; content: string; source: string; similarity: number }>> {
  const results: Array<{ title: string; content: string; source: string; similarity: number }> = [];

  // Excluir fuentes no legales (presupuestos, etc.)
  const excludeSources = sql`${legalDocuments.source} NOT IN ('presupuesto')`;

  // 1. Búsqueda vectorial (pgvector cosine similarity)
  try {
    const queryEmbedding = await generateEmbedding(query);
    const embeddingStr = `[${queryEmbedding.join(",")}]`;

    const vectorConditions: ReturnType<typeof sql>[] = [
      excludeSources,
      sql`1 - (embedding <=> ${embeddingStr}::vector) > 0.3`,
    ];
    if (sourceFilter) vectorConditions.push(sql`${legalDocuments.source} = ${sourceFilter}`);

    const vectorResults = await db
      .select({
        title: legalDocuments.title,
        content: legalDocuments.content,
        source: legalDocuments.source,
        similarity: sql<number>`1 - (embedding <=> ${embeddingStr}::vector)`,
      })
      .from(legalDocuments)
      .where(and(...vectorConditions))
      .orderBy(sql`embedding <=> ${embeddingStr}::vector`)
      .limit(limit * 2);

    for (const r of vectorResults) {
      if (r.similarity > 0.3) results.push(r);
    }
  } catch {
    // pgvector no disponible, continuar solo con keyword
  }

  // 2. Búsqueda por keyword (tsvector + ILIKE)
  const tsquery = query
    .split(/\s+/)
    .filter((w) => w.length > 1)
    .map((w) => `${w}:*`)
    .join(" & ");

  if (tsquery) {
    const kwConditions: ReturnType<typeof sql>[] = [
      excludeSources,
      sql`to_tsvector('spanish', coalesce(${legalDocuments.content}, '')) @@ to_tsquery('spanish', ${tsquery})`,
    ];
    if (sourceFilter) kwConditions.push(sql`${legalDocuments.source} = ${sourceFilter}`);

    const kwResults = await db
      .select({
        title: legalDocuments.title,
        content: legalDocuments.content,
        source: legalDocuments.source,
        similarity: sql<number>`ts_rank(to_tsvector('spanish', coalesce(${legalDocuments.content}, '')), to_tsquery('spanish', ${tsquery}))`,
      })
      .from(legalDocuments)
      .where(and(...kwConditions))
      .orderBy(desc(sql`ts_rank(to_tsvector('spanish', coalesce(${legalDocuments.content}, '')), to_tsquery('spanish', ${tsquery}))`))
      .limit(limit * 2);

    for (const r of kwResults) {
      // No duplicar si ya viene de vector search
      if (!results.some((v) => v.title === r.title && v.content === r.content)) {
        results.push(r);
      }
    }
  }

  // 3. Fallback: ILIKE simple si no hay resultados
  if (results.length === 0) {
    const ilikeConditions = query
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .map((w) => ilike(legalDocuments.content, `%${w}%`));

    if (ilikeConditions.length > 0) {
      const ilikeResults = await db
        .select({
          title: legalDocuments.title,
          content: legalDocuments.content,
          source: legalDocuments.source,
          similarity: sql<number>`1.0`,
        })
        .from(legalDocuments)
        .where(or(...ilikeConditions))
        .limit(limit);
      results.push(...ilikeResults);
    }
  }

  // Ordenar por similitud descendente y limitar
  return results.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
}

// ─── Index stats ───────────────────────────────

export async function getIndexStats(): Promise<{
  totalDocuments: number;
  totalChunks: number;
  sources: string[];
}> {
  const [countResult, sourcesResult] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(legalDocuments),
    db.selectDistinct({ source: legalDocuments.source }).from(legalDocuments),
  ]);

  return {
    totalDocuments: countResult[0]?.count ?? 0,
    totalChunks: countResult[0]?.count ?? 0,
    sources: sourcesResult.map((s) => s.source),
  };
}
