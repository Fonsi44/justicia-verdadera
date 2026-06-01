import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log("=".repeat(65));
  console.log("📊 COBERTURA DEL CORPUS — 9 RAMAS PRINCIPALES");
  console.log("=".repeat(65));

  // Get all content for analysis
  const all = await sql`SELECT source, length(content) as l FROM legal_documents`;
  
  const totalChunks = all.length;
  const totalChars = all.reduce((s: number, r: any) => s + Number(r.l), 0);
  
  const ramas: [string, string[], string][] = [
    ["CIVIL", ["civil","contrato","obligaciones","arrendamiento","hipoteca","sucesiones"], "Contratos, propiedades, sucesiones"],
    ["PENAL", ["penal","delito","homicidio","hurto","robo","estafa"], "Delitos y penas"],
    ["LABORAL", ["trabajo","laboral","salario","despido","prestaciones","ihss"], "Relaciones laborales y SS"],
    ["FAMILIA", ["familia","matrimonio","divorcio","alimentos","adopción"], "Familia, matrimonio, divorcio"],
    ["MERCANTIL", ["comercio","mercantil","sociedades","quiebra","titulos"], "Sociedades y comercio"],
    ["PROCESAL", ["procesal","procedimiento","recurso","casación","apelación"], "Procesos y recursos"],
    ["TRIBUTARIO", ["tributario","isr","isv","impuesto","renta","fiscal"], "Impuestos y obligaciones fiscales"],
    ["ADMTIVO", ["contratación","licitación","municipal","transparencia"], "Contratación pública"],
    ["CONST.", ["constitución","constitucional","amparo","garantías"], "Constitución y garantías"],
  ];

  // Get sources that map to each branch
  const sources = await sql`SELECT source, count(*)::int as cnt FROM legal_documents GROUP BY source ORDER BY cnt DESC`;

  for (const [nombre, keywords, desc] of ramas) {
    // Count chunks whose source name contains any keyword
    let cnt = 0;
    for (const row of sources) {
      const src = (row.source as string).toLowerCase();
      if (keywords.some(k => src.includes(k))) {
        cnt += row.cnt;
      }
    }
    
    const estado = cnt > 1000 ? "✅" : cnt > 300 ? "⚠️" : "❌";
    const barra = "█".repeat(Math.min(Math.floor(cnt / 50), 30)) + "░".repeat(Math.max(0, 30 - Math.min(Math.floor(cnt / 50), 30)));
    console.log(`  ${estado} ${nombre.padEnd(12)} ${barra} ${cnt.toString().padStart(5)} ch — ${desc}`);
  }

  console.log(`\n📊 TOTAL: ${totalChunks} chunks | ${Math.round(totalChars/5).toLocaleString()} palabras`);
}

main().catch(console.error);
