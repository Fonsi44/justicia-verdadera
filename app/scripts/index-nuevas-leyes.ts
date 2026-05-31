import { config } from "dotenv";
config({ path: ".env.local" });
import { db } from "../lib/db";
import { legalDocuments } from "../database/schema";
import { eq, sql } from "drizzle-orm";
import { chunkWithMetadata } from "../lib/ai/chunking";
import { generateEmbedding } from "../lib/ai/embeddings";
import fs from "fs";

const NEW = [
  { src: "ley_isr", title: "Ley de Impuesto Sobre la Renta de Honduras (Texto Consolidado)", file: "ley_isr_completo.txt" },
  { src: "ley_amparo", title: "Ley de Amparo de Honduras", file: "ley_amparo_completo.txt" },
];

async function main() {
  for (const n of NEW) {
    const p = "C:\\Users\\Admin\\AppData\\Local\\Temp\\" + n.file;
    if (!fs.existsSync(p)) { console.log(`⚠️ ${n.src}: no encontrado`); continue; }
    const text = fs.readFileSync(p, "utf8");
    console.log(`${n.src}: ${text.length.toLocaleString()} chars`);
    await db.delete(legalDocuments).where(eq(legalDocuments.source, n.src));
    const chunks = chunkWithMetadata(n.src, n.title, text);
    let stored = 0;
    for (const c of chunks) {
      try {
        const e = await generateEmbedding(c.content);
        await db.insert(legalDocuments).values({ source: c.source, title: c.title, content: c.content, chunkIndex: c.chunkIndex, embedding: e });
        stored++;
      } catch(e) { break; }
    }
    console.log(`  → ${stored} chunks`);
  }
  const stats = await db.select({ source: legalDocuments.source, count: sql<number>`count(*)::int` }).from(legalDocuments).groupBy(legalDocuments.source).orderBy(sql`count(*)::int DESC`);
  console.log("\n📊 CORPUS");
  let t = 0;
  for (const s of stats) { console.log(`   ${s.source}: ${s.count} chunks`); t += s.count; }
  console.log(`   TOTAL: ${t} chunks`);
}
main().catch(console.error);
