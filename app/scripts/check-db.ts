import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

async function checkDb() {
  const sql = neon(process.env.DATABASE_URL!);

  const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
  console.log("Tablas en Neon DB:");
  for (const t of tables) console.log(" -", t.table_name);

  try {
    const count = await sql`SELECT count(*)::int as cnt FROM legal_documents`;
    console.log("\nFilas en legal_documents:", count[0].cnt);
  } catch {
    console.log("\n⚠️  legal_documents no existe o da error");
  }
}

checkDb();
