import { db } from "@/lib/db";
import { legalDocuments } from "@/database/schema";
import { chunkWithMetadata } from "@/lib/ai/chunking";
import { eq, and, or, sql, ilike, desc } from "drizzle-orm";

// ─── Embedding generation ─────────────────────
// Proveedor configurable: "local" (default), "deepseek_via_api"
// En MVP usamos "local" con hashing semántico simple.
// Para producción se recomienda un provider de embeddings dedicado.

async function generateEmbeddingLocal(text: string, dims = 1536): Promise<number[]> {
  // Embedding local determinista basado en n-gramas de caracteres y palabras.
  // No es semántico real pero permite búsqueda por similitud léxica.
  const vec = new Array(dims).fill(0);
  const normalized = text.toLowerCase().replace(/[^a-záéíóúñü0-9\s]/g, " ");

  // Palabras completas
  const words = normalized.split(/\s+/).filter(Boolean);
  for (let i = 0; i < words.length; i++) {
    let hash = 0;
    for (let c = 0; c < words[i].length; c++) {
      hash = ((hash << 5) - hash + words[i].charCodeAt(c)) | 0;
    }
    vec[Math.abs(hash) % dims] += 1;
  }

  // Bigramas de caracteres para capturar subpalabras
  for (let i = 0; i < normalized.length - 1; i++) {
    const bigram = normalized.substring(i, i + 2);
    let hash = 0;
    for (let c = 0; c < bigram.length; c++) {
      hash = ((hash << 5) - hash + bigram.charCodeAt(c)) | 0;
    }
    vec[Math.abs(hash) % dims] += 0.3;
  }

  // Normalizar L2
  const magnitude = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  if (magnitude > 0) {
    for (let i = 0; i < dims; i++) vec[i] /= magnitude;
  }

  return vec;
}

export async function generateEmbedding(text: string, dims = 1536): Promise<number[]> {
  const provider = process.env.EMBEDDINGS_PROVIDER || "local";

  if (provider === "deepseek") {
    return generateEmbeddingDeepSeek(text);
  }

  return generateEmbeddingLocal(text, dims);
}

async function generateEmbeddingDeepSeek(text: string): Promise<number[]> {
  // DeepSeek no tiene endpoint de embeddings nativo.
  // Usamos el modelo chat para extraer un vector conceptual.
  // Esto es experimental y no recomendado para producción.
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY no configurada");

  // Fallback a local si DeepSeek embeddings no disponible
  return generateEmbeddingLocal(text, 1536);
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
