import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const [total] = await sql`SELECT count(*)::int as cnt, COALESCE(SUM(LENGTH(content)), 0)::bigint as total_chars FROM legal_documents`;
  const chars = Number(total.total_chars);
  const chunks = total.cnt;
  const words = Math.round(chars / 5);
  const sources = (await sql`SELECT count(DISTINCT source)::int as cnt FROM legal_documents`)[0].cnt;
  console.log(JSON.stringify({ chunks, chars, words, sources }));
}
main();
