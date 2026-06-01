import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const adm = await sql`
    SELECT source, count(*)::int as cnt, MIN(title) as t 
    FROM legal_documents 
    WHERE source ~ 'contratacion|presupuesto|municipal|administrativo|procedimiento' 
    GROUP BY source ORDER BY cnt DESC LIMIT 10`;
  console.log("=== ADMINISTRATIVO ===");
  for (const r of adm) console.log(r.cnt, r.source, "-", (r.t || "").substring(0, 60));
  
  const cons = await sql`
    SELECT source, count(*)::int as cnt, MIN(title) as t 
    FROM legal_documents 
    WHERE source ~ 'constitucion|amparo|constitucional' 
    GROUP BY source ORDER BY cnt DESC LIMIT 10`;
  console.log("\n=== CONSTITUCIONAL ===");
  for (const r of cons) console.log(r.cnt, r.source, "-", (r.t || "").substring(0, 60));

  const fam = await sql`
    SELECT source, count(*)::int as cnt 
    FROM legal_documents WHERE source ILIKE '%familia%' 
    GROUP BY source ORDER BY cnt DESC`;
  console.log("\n=== FAMILIA ===");
  for (const r of fam) console.log(r.cnt, r.source);
}

main().catch(console.error);
