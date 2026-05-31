import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const stats = await sql`
    SELECT source, count(*)::int as cnt 
    FROM legal_documents 
    GROUP BY source 
    ORDER BY cnt DESC
  `;
  console.log("📊 CORPUS LEGAL COMPLETO");
  console.log("=".repeat(50));
  let total = 0;
  for (const s of stats) {
    console.log(`   ${s.source}: ${s.cnt} chunks`);
    total += s.cnt;
  }
  console.log("=".repeat(50));
  console.log(`   TOTAL: ${total} chunks`);
}
main();
