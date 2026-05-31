import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  // 1. Primeros chunks del Código de Familia
  const familia = await sql`
    SELECT chunk_index, substring(content, 1, 200) as preview 
    FROM legal_documents 
    WHERE source = 'codigo_familia' 
    ORDER BY chunk_index LIMIT 15
  `;
  console.log("=== CODIGO DE FAMILIA (primeros 15 chunks) ===\n");
  for (const r of familia) {
    console.log(`[${r.chunk_index}] ${(r.preview as string).substring(0, 150)}`);
    console.log();
  }

  // 2. Total de chunks del Codigo de Familia
  const [totalFamilia] = await sql`
    SELECT count(*)::int as cnt FROM legal_documents WHERE source = 'codigo_familia'
  `;
  console.log(`\nTotal chunks Código de Familia: ${totalFamilia.cnt}`);

  // 3. Chunks con "divorcio" EN el contenido
  const divChunks = await sql`
    SELECT source, chunk_index, substring(content, 1, 250) as preview 
    FROM legal_documents 
    WHERE content ILIKE '%divorcio%' 
    ORDER BY source, chunk_index LIMIT 15
  `;
  console.log(`\n=== CHUNKS QUE MENCIONAN "divorcio" (${divChunks.length}) ===\n`);
  for (const r of divChunks) {
    const src = (r.source as string).substring(0, 40);
    console.log(`[${src}] chunk ${r.chunk_index}: ${(r.preview as string).substring(0, 200)}`);
    console.log();
  }

  // 4. Verificar si el artículo 20 del Codigo de Familia (divorcio) existe
  const art20 = await sql`
    SELECT source, chunk_index, content 
    FROM legal_documents 
    WHERE source = 'codigo_familia' AND content ILIKE '%Artículo 20%'
    LIMIT 5
  `;
  console.log(`\n=== Artículo 20 del Código de Familia: ${art20.length} resultados ===`);
  for (const r of art20) {
    console.log(`[chunk ${r.chunk_index}] ${(r.content as string).substring(0, 300)}`);
  }
}

main().catch(console.error);
