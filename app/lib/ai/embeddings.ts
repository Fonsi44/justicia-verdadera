import { db } from "@/lib/db";
import { legalDocuments } from "@/database/schema";
import { chunkWithMetadata } from "@/lib/ai/chunking";
import { eq, and, sql } from "drizzle-orm";

export async function generateEmbedding(text: string): Promise<number[]> {
  if (process.env.EMBEDDINGS_PROVIDER === "local") {
    return generateEmbeddingLocal();
  }
  return generateEmbeddingOpenAI(text);
}

async function generateEmbeddingOpenAI(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY no configurada. Usa EMBEDDINGS_PROVIDER=local como alternativa.");

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "text-embedding-3-small", input: text }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`OpenAI embeddings error (${res.status}): ${error}`);
  }

  const json = await res.json();
  return json.data[0].embedding as number[];
}

async function generateEmbeddingLocal(): Promise<number[]> {
  // Placeholder para modelo local (Xenova transformers)
  // Retorna vector dummy de 384 dimensiones
  return new Array(384).fill(0).map(() => Math.random() * 2 - 1);
}

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

export async function searchSimilarDocuments(
  query: string,
  limit = 5,
  sourceFilter?: string,
): Promise<Array<{ title: string; content: string; source: string; similarity: number }>> {
  const queryEmbedding = await generateEmbedding(query);
  const embeddingStr = `[${queryEmbedding.join(",")}]`;

  const conditions = [sql`1 - (embedding <=> ${embeddingStr}::vector) > 0.7`];
  if (sourceFilter) conditions.push(eq(legalDocuments.source, sourceFilter));

  const results = await db
    .select({
      title: legalDocuments.title,
      content: legalDocuments.content,
      source: legalDocuments.source,
      similarity: sql<number>`1 - (embedding <=> ${embeddingStr}::vector)`,
    })
    .from(legalDocuments)
    .where(and(...conditions))
    .orderBy(sql`embedding <=> ${embeddingStr}::vector`)
    .limit(limit);

  return results;
}
