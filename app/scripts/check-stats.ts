import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const [r] = await sql`SELECT count(*)::int as cnt FROM legal_documents WHERE source = 'codigo_tributario_sar'`;
  console.log("Chunks codigo_tributario_sar:", r.cnt);
  const total = await sql`SELECT count(*)::int as cnt FROM legal_documents`;
  console.log("Total corpus:", total[0].cnt);
}
main();
