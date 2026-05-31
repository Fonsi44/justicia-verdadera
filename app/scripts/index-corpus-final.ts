import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "../lib/db";
import { legalDocuments } from "../database/schema";
import { eq, sql } from "drizzle-orm";
import { chunkWithMetadata } from "../lib/ai/chunking";
import { generateEmbedding } from "../lib/ai/embeddings";
import fs from "fs";

const CORPUS: { sourceId: string; title: string; file: string }[] = [
  { sourceId: "codigo_civil", title: "Código Civil de Honduras", file: "codigo_civil_completo.txt" },
  { sourceId: "codigo_comercio", title: "Código de Comercio de Honduras", file: "codigo_comercio_completo.txt" },
  { sourceId: "codigo_penal", title: "Código Penal de Honduras", file: "codigo_penal_completo.txt" },
  { sourceId: "codigo_procesal_penal", title: "Código Procesal Penal de Honduras", file: "codigo_procesal_penal_completo.txt" },
];

async function main() {
  const baseDir = "C:\\Users\\Admin\\AppData\\Local\\Temp\\";
  
  for (const entry of CORPUS) {
    const txtPath = baseDir + entry.file;
    if (!fs.existsSync(txtPath)) {
      console.log(`⚠️  ${entry.sourceId}: archivo no encontrado`);
      continue;
    }
    
    const text = fs.readFileSync(txtPath, "utf8");
    console.log(`\n📄 ${entry.title}: ${text.length.toLocaleString()} caracteres`);

    // Clean old seed data for this source
    await db.delete(legalDocuments).where(eq(legalDocuments.source, entry.sourceId));

    // Chunk and store
    const chunks = chunkWithMetadata(entry.sourceId, entry.title, text);
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
    console.log(`  ✅ ${stored} chunks indexados`);
  }

  // Stats
  const stats = await db
    .select({ source: legalDocuments.source, count: sql<number>`count(*)::int` })
    .from(legalDocuments)
    .groupBy(legalDocuments.source)
    .orderBy(sql`count(*)::int DESC`);

  console.log("\n" + "=".repeat(60));
  console.log("📊 CORPUS LEGAL — ESTADO FINAL");
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
