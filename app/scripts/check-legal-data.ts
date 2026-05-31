import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

async function checkData() {
  const sql = neon(process.env.DATABASE_URL!);

  const docs = await sql`SELECT id, source, title, chunk_index, length(content) as content_len, verified_at FROM legal_documents ORDER BY source, chunk_index LIMIT 20`;
  
  console.log("Documentos legales en BD:");
  console.log("=".repeat(80));
  for (const d of docs) {
    console.log(`📄 [${d.source}] ${d.title}`);
    console.log(`   Chunk: ${d.chunk_index} | Tamaño: ${d.content_len} chars | ${d.verified_at ? "✅ Verificado" : "⏳ Sin verificar"}`);
    console.log();
  }

  const srcCount = await sql`SELECT source, count(*)::int as cnt FROM legal_documents GROUP BY source ORDER BY cnt DESC`;
  console.log("\nResumen por fuente:");
  for (const s of srcCount) {
    console.log(`   ${s.source}: ${s.cnt} chunks`);
  }
}

checkData();
