import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  // Obtener todas las fuentes hash del TSC/ONCAE
  const fuentes = await sql`
    SELECT source, count(*)::int as cnt,
           MIN(title) as sample_title,
           MIN(substring(content, 1, 300)) as preview
    FROM legal_documents
    WHERE source ~ '^[a-z]+-gob-hn_'
    GROUP BY source
    ORDER BY cnt DESC
  `;

  console.log("=".repeat(70));
  console.log("🔍 IDENTIFICANDO FUENTES HASH");
  console.log("=".repeat(70));
  console.log(`\nTotal fuentes hash: ${fuentes.length}`);
  
  // Analizar cada fuente por su contenido
  for (const f of fuentes) {
    const src = f.source as string;
    const title = (f.sample_title || "") as string;
    const preview = (f.preview || "") as string;
    const combined = (src + " " + title + " " + preview).toLowerCase();
    
    // Detectar tipo de documento
    let categoria = "Otro";
    let nombre = "Documento no identificado";
    
    if (/\bdecreto\b/i.test(combined)) {
      categoria = "Decreto";
      const match = preview.match(/decreto\s+(n[oº]\.?\s*)?(\d[-\d]*)/i);
      nombre = match ? `Decreto ${match[2]}` : "Decreto sin numero";
    }
    else if (/\bacuerdo\b/i.test(combined)) {
      categoria = "Acuerdo";
      const match = preview.match(/acuerdo\s+(n[oº]\.?\s*)?([\d-]+)/i);
      nombre = match ? `Acuerdo ${match[2]}` : "Acuerdo sin numero";
    }
    else if (/\breglamento\b/i.test(combined)) {
      categoria = "Reglamento";
      nombre = title.substring(0, 80) || "Reglamento";
    }
    else if (/\bc[oó]digo\b/i.test(combined)) {
      categoria = "Codigo";
      const match = preview.match(/(c[oó]digo\s+(de\s+)?\w+)/i);
      nombre = match ? match[1] : "Codigo";
    }
    else if (/\bley\b/i.test(combined)) {
      categoria = "Ley";
      const match = preview.match(/(ley\s+(de\s+)?\w[\w\s]+?)(?:\.|$)/i);
      nombre = match ? match[1].trim().substring(0, 80) : "Ley";
    }
    else if (/\bconstitucion\b|\bconstitución\b/i.test(combined)) {
      categoria = "Constitucion";
      nombre = "Constitucion";
    }
    else if (/\bpresupuesto\b/i.test(combined)) {
      categoria = "Presupuesto";
      nombre = "Presupuesto";
    }
    else if (/\bsentencia\b|\bjurisprudencia\b/i.test(combined)) {
      categoria = "Jurisprudencia";
      nombre = title.substring(0, 80) || "Sentencia";
    }
    else if (/\bpcm\b|\bpresidencia\b.*\bconsejo\b/i.test(combined)) {
      categoria = "PCM";
      const match = src.match(/pcm[_-]?(\d+)/i) || preview.match(/pcm[_-]?(\d+)/i);
      nombre = match ? `PCM-${match[1]}` : "PCM";
    }
    
    console.log(`\n${categoria}: ${nombre}`);
    console.log(`  Fuente: ${src.substring(0, 60)} (${f.cnt} chunks)`);
    console.log(`  Preview: ${preview.substring(0, 120)}`);
  }
}

main().catch(console.error);
