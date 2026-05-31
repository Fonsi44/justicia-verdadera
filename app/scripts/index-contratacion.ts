import { config } from "dotenv";
config({ path: ".env.local" });
import { db } from "../lib/db";
import { legalDocuments } from "../database/schema";
import { eq, sql } from "drizzle-orm";
import { chunkWithMetadata } from "../lib/ai/chunking";
import { generateEmbedding } from "../lib/ai/embeddings";
import fs from "fs";

async function main() {
  const p = "C:\\Users\\Admin\\AppData\\Local\\Temp\\ley_contratacion_completa.txt";
  if (!fs.existsSync(p)) { console.log("No encontrado"); return; }
  const text = fs.readFileSync(p, "utf8");
  console.log(`📄 Ley Contratacion: ${text.length.toLocaleString()} caracteres`);

  await db.delete(legalDocuments).where(eq(legalDocuments.source, "ley_contratacion_estado"));
  const chunks = chunkWithMetadata("ley_contratacion_estado", "Ley de Contratación del Estado de Honduras", text);
  let stored = 0;
  for (const c of chunks) {
    try {
      const e = await generateEmbedding(c.content);
      await db.insert(legalDocuments).values({ source: c.source, title: c.title, content: c.content, chunkIndex: c.chunkIndex, embedding: e });
      stored++;
    } catch (e) { break; }
  }
  console.log(`   → ${stored} chunks`);

  const stats = await db.select({ source: legalDocuments.source, count: sql<number>`count(*)::int` }).from(legalDocuments).groupBy(legalDocuments.source).orderBy(sql`count(*)::int DESC`);
  let t = 0;
  console.log("\n📊 CORPUS");
  for (const s of stats) { console.log(`   ${s.source}: ${s.count} chunks`); t += s.count; }
  console.log(`   TOTAL: ${t} chunks`);
}
main().catch(console.error);
