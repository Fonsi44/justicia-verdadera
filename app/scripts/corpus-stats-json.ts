import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const [t] = await sql`SELECT count(*)::int as chunks, COALESCE(SUM(LENGTH(content)),0)::bigint as chars FROM legal_documents`;
  const src = await sql`SELECT source, count(*)::int as cnt FROM legal_documents GROUP BY source ORDER BY cnt DESC LIMIT 10`;
  const palabras = Math.round(Number(t.chars) / 5);
  console.log(JSON.stringify({ 
    chunks: t.chunks, 
    chars: Number(t.chars), 
    palabras,
    fuentes: src.map(s => ({ nombre: s.source, count: s.cnt })) 
  }));
}
main();
