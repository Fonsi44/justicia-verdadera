import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  // Find all sources with 'test' or 'cli' in name
  const r = await sql`SELECT DISTINCT source FROM legal_documents WHERE source ILIKE '%test%'`;
  console.log("Fuentes test encontradas:", r.length);
  for (const row of r) {
    console.log("  -", row.source);
  }
  // Delete them
  await sql`DELETE FROM legal_documents WHERE source ILIKE '%test%'`;
  const [cnt] = await sql`SELECT count(*)::int as c FROM legal_documents`;
  console.log("Corpus final:", cnt.c, "chunks");
}
main();
