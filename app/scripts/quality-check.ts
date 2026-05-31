import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  // 1. Calidad del texto: cuantos chunks tienen contenido real?
  const [total] = await sql`SELECT count(*)::int as cnt FROM legal_documents`;
  const [conTexto] = await sql`SELECT count(*)::int as cnt FROM legal_documents WHERE length(trim(content)) > 100`;
  const [vacios] = await sql`SELECT count(*)::int as cnt FROM legal_documents WHERE length(trim(content)) <= 100`;
  
  console.log("=".repeat(55));
  console.log("📊 CALIDAD DEL CORPUS");
  console.log("=".repeat(55));
  console.log(`Total chunks:      ${total.cnt}`);
  console.log(`Con texto util:    ${conTexto.cnt} (${(conTexto.cnt/total.cnt*100).toFixed(1)}%)`);
  console.log(`Vacios/sin texto:  ${vacios.cnt} (${(vacios.cnt/total.cnt*100).toFixed(1)}%)`);
  
  // 2. Fuentes con mas vacios
  const vaciosPorFuente = await sql`
    SELECT source, count(*)::int as cnt 
    FROM legal_documents 
    WHERE length(trim(content)) <= 100 
    GROUP BY source 
    ORDER BY cnt DESC LIMIT 10
  `;
  console.log(`\n❌ Fuentes con mas chunks vacios:`);
  for (const r of vaciosPorFuente) {
    console.log(`  ${(r.source as string).substring(0, 50)}: ${r.cnt}`);
  }
  
  // 3. Fuentes que aportan mas texto real
  const mejores = await sql`
    SELECT source, count(*)::int as cnt, 
           SUM(length(content))::bigint as chars 
    FROM legal_documents 
    WHERE length(trim(content)) > 100 
    GROUP BY source 
    ORDER BY chars DESC LIMIT 15
  `;
  console.log(`\n✅ Fuentes con mas contenido util:`);
  for (const r of mejores) {
    const palabras = Math.round(Number(r.chars) / 5);
    console.log(`  ${(r.source as string).substring(0, 50)}: ${r.cnt} chunks, ~${palabras.toLocaleString()} palabras`);
  }
  
  // 4. Resumen
  const totalPalabras = await sql`
    SELECT SUM(length(content))::bigint as chars 
    FROM legal_documents WHERE length(trim(content)) > 100
  `;
  const palabrasUtiles = Math.round(Number(totalPalabras[0].chars) / 5);
  console.log(`\n📈 RESUMEN:`);
  console.log(`  Palabras totales:  3,781,887`);
  console.log(`  Palabras utiles:   ${palabrasUtiles.toLocaleString()}`);
  console.log(`  Calidad neta:      ${(palabrasUtiles / 3781887 * 100).toFixed(1)}%`);
}

main().catch(console.error);
