import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "../lib/db";
import { legalDocuments, documents } from "../database/schema";
import { eq, sql } from "drizzle-orm";
import { chunkWithMetadata } from "../lib/ai/chunking";
import { generateEmbedding } from "../lib/ai/embeddings";
import fs from "fs";

async function main() {
  const txtPath = "C:\\Users\\Admin\\AppData\\Local\\Temp\\codigo_tributario_completo.txt";
  const text = fs.readFileSync(txtPath, "utf8");
  
  console.log(`📄 Código Tributario: ${text.length.toLocaleString()} caracteres`);

  // Clean old data
  await db.delete(legalDocuments).where(eq(legalDocuments.source, "codigo_tributario_sar"));

  // Chunk and store
  const chunks = chunkWithMetadata("codigo_tributario_sar", "Código Tributario de Honduras (Decreto 170-2016)", text);
  let stored = 0;

  for (const chunk of chunks) {
    try {
      const embedding = await generateEmbedding(chunk.content);
      await db.insert(legalDocuments).values({
        source: chunk.source,
        title: chunk.title,
        content: chunk.content,
        chunkIndex: chunk.chunkIndex,
        embedding: embedding,
      } as typeof legalDocuments.$inferInsert);
      stored++;
    } catch (error) {
      console.error(`✗ ${error}`);
    }
  }
  
  console.log(`✅ ${stored} chunks indexados`);

  // Stats
  const stats = await db
    .select({ source: legalDocuments.source, count: sql<number>`count(*)::int` })
    .from(legalDocuments)
    .groupBy(legalDocuments.source)
    .orderBy(sql`count(*)::int DESC`);

  console.log("\n📊 CORPUS LEGAL");
  console.log("=".repeat(50));
  let total = 0;
  for (const s of stats) {
    console.log(`   ${s.source}: ${s.count} chunks`);
    total += s.count;
  }
  console.log("=".repeat(50));
  console.log(`   TOTAL: ${total} chunks`);
}

main().catch(console.error);
