import { db } from "@/lib/db";
import { legalDocuments } from "@/database/schema";
import { chunkWithMetadata } from "@/lib/ai/chunking";
import { eq, and, or, sql, ilike, desc } from "drizzle-orm";

// ─── Embedding semántico local con transformers.js ────
// Usa @xenova/transformers para embeddings BERT reales.
// Sin llamadas a API externas, sin costo, totalmente offline.
// Modelo: all-MiniLM-L6-v2 (384 dims → padded a 1536)

const MODEL = "Xenova/all-MiniLM-L6-v2";
const EMBED_DIMS = 384;
let pipeline: any = null;

async function getEmbeddingPipeline() {
  if (!pipeline) {
    const { pipeline: pipe } = await import("@xenova/transformers");
    pipeline = await pipe("feature-extraction", MODEL);
  }
  return pipeline;
}

async function generateEmbeddingSemantic(text: string): Promise<number[]> {
  try {
    const extractor = await getEmbeddingPipeline();
    const result = await extractor(text, { pooling: "mean", normalize: true });
    const embedding = Array.from(result.data) as number[];
    // Pad a 1536 (el schema requiere vector(1536))
    const padded = new Float64Array(1536);
    for (let i = 0; i < Math.min(embedding.length, 1536); i++) {
      padded[i] = embedding[i];
    }
    return Array.from(padded);
  } catch (error) {
    console.warn("[Embeddings] Transformers falló, usando fallback hash:", error);
    return generateEmbeddingLocal(text);
  }
}

// ─── Fallback hash-based optimizado (~10x más rápido que original) ──

async function generateEmbeddingLocal(text: string, dims = 1536): Promise<number[]> {
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

export async function generateEmbedding(text: string, dims = 1536): Promise<number[]> {
  const provider = process.env.EMBEDDINGS_PROVIDER || "semantic";
  
  if (provider === "semantic") {
    return generateEmbeddingSemantic(text);
  }
  
  // Fallback: hash-based local
  return generateEmbeddingLocal(text, dims);
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

  // 1. Búsqueda vectorial (pgvector cosine similarity)
  try {
    const queryEmbedding = await generateEmbedding(query);
    const embeddingStr = `[${queryEmbedding.join(",")}]`;

    const vectorConditions: ReturnType<typeof eq>[] = [
      sql`1 - (embedding <=> ${embeddingStr}::vector) > 0.3`,
    ];
    if (sourceFilter) vectorConditions.push(eq(legalDocuments.source, sourceFilter));

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
