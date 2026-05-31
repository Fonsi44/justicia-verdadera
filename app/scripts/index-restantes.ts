import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "../lib/db";
import { legalDocuments } from "../database/schema";
import { eq, sql } from "drizzle-orm";
import { chunkWithMetadata } from "../lib/ai/chunking";
import { generateEmbedding } from "../lib/ai/embeddings";
import fs from "fs";

async function indexSource(sourceId: string, title: string, file: string) {
  const path = "C:\\Users\\Admin\\AppData\\Local\\Temp\\" + file;
  if (!fs.existsSync(path)) { console.log(`⚠️ ${sourceId}: no encontrado`); return; }
  
  const text = fs.readFileSync(path, "utf8");
  console.log(`📄 ${title}: ${text.length.toLocaleString()} caracteres`);

  await db.delete(legalDocuments).where(eq(legalDocuments.source, sourceId));
  const chunks = chunkWithMetadata(sourceId, title, text);
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
      console.error(`  ✗ Error: ${error}`);
      break;
    }
  }
  console.log(`  ✅ ${stored} chunks`);
}

async function main() {
  await indexSource("codigo_trabajo", "Código de Trabajo de Honduras", "codigo_trabajo_completo.txt");
  await indexSource("codigo_familia", "Código de Familia de Honduras", "codigo_familia_completo.txt");
  await indexSource("codigo_procesal_civil", "Código Procesal Civil de Honduras", ""); // no file yet

  const stats = await db
    .select({ source: legalDocuments.source, count: sql<number>`count(*)::int` })
    .from(legalDocuments)
    .groupBy(legalDocuments.source)
    .orderBy(sql`count(*)::int DESC`);

  console.log("\n" + "=".repeat(60));
  console.log("📊 CORPUS LEGAL FINAL");
  console.log("=".repeat(60));
  let total = 0;
  for (const s of stats) {
    console.log(`   ${s.source}: ${s.count} chunks`);
    total += s.count;
  }
  console.log("=".repeat(60));
  console.log(`   TOTAL: ${total} chunks`);
}

main().catch(console.error);
