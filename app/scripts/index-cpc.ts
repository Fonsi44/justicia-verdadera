import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "../lib/db";
import { legalDocuments } from "../database/schema";
import { eq, sql } from "drizzle-orm";
import { chunkWithMetadata } from "../lib/ai/chunking";
import { generateEmbedding } from "../lib/ai/embeddings";
import fs from "fs";

async function main() {
  const file = "C:\\Users\\Admin\\AppData\\Local\\Temp\\codigo_procesal_civil_completo.txt";
  if (!fs.existsSync(file)) { console.log("Archivo no encontrado"); return; }
  
  const text = fs.readFileSync(file, "utf8");
  console.log(`📄 Codigo Procesal Civil: ${text.length.toLocaleString()} caracteres`);

  await db.delete(legalDocuments).where(eq(legalDocuments.source, "codigo_procesal_civil"));
  
  const chunks = chunkWithMetadata("codigo_procesal_civil", "Código Procesal Civil de Honduras", text);
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
      console.error(`✗ Error: ${error}`);
      break;
    }
  }
  console.log(`✅ ${stored} chunks indexados`);

  const stats = await db
    .select({ source: legalDocuments.source, count: sql<number>`count(*)::int` })
    .from(legalDocuments)
    .groupBy(legalDocuments.source)
    .orderBy(sql`count(*)::int DESC`);

  console.log("\n📊 CORPUS LEGAL — COMPLETO");
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
