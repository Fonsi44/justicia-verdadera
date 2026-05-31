import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

function detectName(source: string, title: string, preview: string): string | null {
  const all = (source + " " + title + " " + preview).toLowerCase();
  
  // PCM (Presidencia Consejo de Ministros)
  const pcm = preview.match(/PCM[_-]0*(\d+)/i) || preview.match(/pcm[_-]0*(\d+)/i);
  if (pcm && /presidente|consejo de ministros|ejecutivo/i.test(all)) {
    return `decreto_pcm_${pcm[1]}`;
  }
  
  // Decretos del Congreso
  const decNum = preview.match(/[Dd]ecreto\s+(?:n[o°º]?\.?\s*)?(?:legislativo\s+)?(?:numero\s+)?(\d+[-\/]?\d*)/i);
  if (decNum) {
    const num = decNum[1].replace(/[\/\-]/g, "_");
    return `decreto_${num}`;
  }
  
  // Acuerdos
  const acNum = preview.match(/[Aa]cuerdo\s+(?:n[o°º]?\.?\s*)?(?:ejecutivo\s+)?(?:numero\s+)?(\d+[-\/]?\d*)/i);
  if (acNum) {
    const num = acNum[1].replace(/[\/\-]/g, "_");
    return `acuerdo_${num}`;
  }
  
  // Reglamentos
  if (/\breglamento\b/i.test(preview)) {
    const regName = preview.match(/[Rr]eglamento\s+(?:del?\s+)?(?:de\s+)?(?:la\s+)?(?:del?\s+)?(?:de\s+)?([a-záéíóúñü\s]+?)(?:\.|,|$)/i);
    if (regName) {
      return `reglamento_${regName[1].trim().substring(0, 40).replace(/\s+/g, "_").toLowerCase().replace(/[^a-záéíóúñü_]/g, "")}`;
    }
    return `reglamento_general`;
  }
  
  // Leyes
  if (/\bley\b/i.test(preview)) {
    const leyName = preview.match(/[Ll]ey\s+(?:de\s+)?(?:la\s+)?(?:del?\s+)?([a-záéíóúñü\s]{3,60}?)(?:\.|,|$)/i);
    if (leyName) {
      return `ley_${leyName[1].trim().substring(0, 40).replace(/\s+/g, "_").toLowerCase().replace(/[^a-záéíóúñü_]/g, "")}`;
    }
    return `ley_general`;
  }
  
  // Constitucion
  if (/\bconstituci[oó]n\b/i.test(preview) || /\bconstitucion\b/i.test(source)) {
    return "constitucion";
  }
  
  // Presupuesto
  if (/\bpresupuesto\b/i.test(preview) || /\bdisposiciones generales\b/i.test(preview)) {
    const year = preview.match(/\b(20\d{2})\b/);
    return year ? `presupuesto_${year[1]}` : "presupuesto";
  }
  
  return null;
}

async function main() {
  console.log("=".repeat(60));
  console.log("🏷️ NORMALIZANDO FUENTES HASH");
  console.log("=".repeat(60));
  
  // Obtener fuentes hash
  const fuentes = await sql`
    SELECT source, count(*)::int as cnt,
           MIN(title) as sample_title,
           MIN(substring(content, 1, 500)) as preview
    FROM legal_documents
    WHERE source ~ '^[a-z]+-gob-hn_'
    GROUP BY source
    ORDER BY cnt DESC
  `;
  
  console.log(`\n📊 ${fuentes.length} fuentes hash a normalizar\n`);
  
  let totalRenamed = 0;
  let totalChunks = 0;
  
  for (const f of fuentes) {
    const oldName = f.source as string;
    const title = (f.sample_title || "") as string;
    const preview = (f.preview || "") as string;
    
    const newName = detectName(oldName, title, preview);
    if (!newName) {
      console.log(`  ❌ ${oldName.substring(0, 50)}... ${f.cnt} chunks → NO IDENTIFICADO`);
      continue;
    }
    
    // Actualizar en DB
    await sql`UPDATE legal_documents SET source = ${newName} WHERE source = ${oldName}`;
    
    // Mostrar resultado
    const oldShort = oldName.substring(0, 40);
    console.log(`  ✅ ${oldShort}... (${f.cnt} ch) → ${newName}`);
    
    totalRenamed++;
    totalChunks += f.cnt;
  }
  
  // Estadisticas finales
  const stats = await sql`
    SELECT source, count(*)::int as cnt 
    FROM legal_documents 
    GROUP BY source 
    ORDER BY cnt DESC 
    LIMIT 20
  `;
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 CORPUS NORMALIZADO`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Fuentes renombradas: ${totalRenamed} (${totalChunks} chunks)`);
  console.log(`\nTop 20 fuentes:`);
  for (const s of stats) {
    console.log(`  ${(s.source as string).padEnd(50)} ${s.cnt} chunks`);
  }
}

main().catch(console.error);
