import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  // 1. Buscar contenido sobre divorcio
  const divorcio = await sql`
    SELECT source, title, substring(content, 1, 200) as preview 
    FROM legal_documents 
    WHERE content ILIKE '%divorcio%' 
    LIMIT 10
  `;
  console.log(`\n🔍 Chunks sobre "divorcio": ${divorcio.length}`);
  for (const row of divorcio) {
    console.log(`  ${(row.source as string).substring(0, 50)} | ${(row.title as string).substring(0, 60)}`);
    console.log(`  → ${(row.preview as string).substring(0, 120)}`);
    console.log();
  }

  // 2. Fuentes principales
  const sources = await sql`
    SELECT source, count(*)::int as cnt 
    FROM legal_documents 
    GROUP BY source 
    ORDER BY cnt DESC 
    LIMIT 20
  `;
  console.log(`\n📊 Fuentes principales (${sources.length}):`);
  let total = 0;
  for (const row of sources) {
    total += row.cnt;
    console.log(`  ${row.cnt} ${row.source}`);
  }
  console.log(`   Total: ${total}`);
}

main().catch(console.error);
