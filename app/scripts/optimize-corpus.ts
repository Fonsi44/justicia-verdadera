import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
import * as crypto from "crypto";

const sql = neon(process.env.DATABASE_URL!);

// ─── MAPA DE NORMALIZACION ─────────────────────────────
interface SourceGroup {
  keep: string;        // canonical source name
  remove: string[];    // hash sources to merge into it
}

function detectCanonical(source: string, title: string): string | null {
  const s = (source + " " + title).toLowerCase();
  const rules: [RegExp, string][] = [
    [/codigo.*civil|civil.*codigo/i, "codigo_civil"],
    [/codigo.*penal|penal.*codigo/i, "codigo_penal"],
    [/codigo.*trabajo|trabajo.*codigo|codigo.*laboral/i, "codigo_trabajo"],
    [/codigo.*comercio|comercio.*codigo|mercantil/i, "codigo_comercio"],
    [/codigo.*familia|familia.*codigo/i, "codigo_familia"],
    [/procesal.*penal/i, "codigo_procesal_penal"],
    [/procesal.*civil/i, "codigo_procesal_civil"],
    [/codigo.*tributario|tributario.*codigo/i, "codigo_tributario"],
    [/constitucion/i, "constitucion"],
    [/contratacion|contratación|compras eficientes/i, "ley_contratacion_estado"],
    [/notariado|notarial/i, "ley_notariado"],
    [/propiedad/i, "ley_propiedad"],
    [/amparo/i, "ley_amparo"],
    [/justicia constitucional/i, "ley_justicia_constitucional"],
    [/isr|impuesto sobre la renta/i, "ley_isr"],
    [/isv|impuesto sobre ventas/i, "ley_isv"],
    [/reglamento.*facturacion|reglamento.*sar/i, "reglamento_sar"],
    [/cafta/i, "tratados_cafta"],
    [/presupuesto|disposiciones generales/i, "presupuesto"],
  ];
  for (const [regex, name] of rules) {
    if (regex.test(s)) return name;
  }
  return null;
}

async function main() {
  console.log("=".repeat(60));
  console.log("🧹 OPTIMIZACION DEL CORPUS LEGAL");
  console.log("=".repeat(60));

  // 1. Get all chunks
  const rows = await sql`SELECT source, count(*)::int as cnt 
    FROM legal_documents GROUP BY source ORDER BY cnt DESC`;
  console.log(`\n📊 ${rows.length} fuentes diferentes, ${rows.reduce((s: number, r: any) => s + r.cnt, 0)} chunks totales`);

  // 2. Find hash-based sources that can be normalized
  const hashSources = rows.filter((r: any) => /^[a-z]+-gob-hn_/.test(r.source));
  console.log(`\n🔍 ${hashSources.length} fuentes con hash (TSC/ONCAE/etc) candidatas a normalizar`);

  // 3. For each hash source, get a sample title to detect what it is
  const groups: SourceGroup[] = [];
  const matched = new Set<string>();

  for (const hs of hashSources) {
    const [sample] = await sql`
      SELECT title, substring(content, 1, 200) as preview 
      FROM legal_documents WHERE source = ${hs.source} LIMIT 1`;
    
    if (!sample) continue;
    const canonical = detectCanonical(hs.source, sample.title);
    if (!canonical) continue;

    // Find existing group or create new
    let group = groups.find(g => g.keep === canonical);
    if (!group) {
      group = { keep: canonical, remove: [] };
      groups.push(group);
    }
    group.remove.push(hs.source);
    matched.add(hs.source);
  }

  // 4. Print merge plan
  console.log(`\n📋 PLAN DE NORMALIZACION:`);
  let totalToMerge = 0;
  for (const g of groups) {
    const count = g.remove.reduce((s: number, src: string) => {
      const found = rows.find((r: any) => r.source === src);
      return s + (found ? found.cnt : 0);
    }, 0);
    console.log(`   ${g.keep}: ${g.remove.length} fuentes → ${count} chunks`);
    totalToMerge += count;
  }
  console.log(`\n   Total a normalizar: ${totalToMerge} chunks de ${matched.size} fuentes`);

  // 5. Execute merge
  if (totalToMerge > 0) {
    console.log(`\n⚡ EJECUTANDO NORMALIZACION...`);
    for (const g of groups) {
      const totalFrom = g.remove.reduce((s: number, src: string) => {
        const found = rows.find((r: any) => r.source === src);
        return s + (found ? found.cnt : 0);
      }, 0);
      
      if (totalFrom === 0) continue;

      // Update source names
      for (const oldSource of g.remove) {
        await sql`UPDATE legal_documents SET source = ${g.keep} WHERE source = ${oldSource}`;
      }
      
      // Delete exact duplicates within the merged set
      await sql`
        DELETE FROM legal_documents a USING legal_documents b 
        WHERE a.id < b.id AND a.source = ${g.keep} AND b.source = ${g.keep} 
        AND a.content = b.content`;
      
      console.log(`   ✅ ${g.keep}: ${totalFrom} chunks normalizados`);
    }
  }

  // 6. Final stats
  const [stats] = await sql`
    SELECT count(*)::int as chunks, 
           COALESCE(SUM(LENGTH(content)),0)::bigint as chars 
    FROM legal_documents`;
  const palabras = Math.round(Number(stats.chars) / 5);
  
  const finalSources = await sql`
    SELECT source, count(*)::int as cnt 
    FROM legal_documents GROUP BY source ORDER BY cnt DESC LIMIT 15`;
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 CORPUS OPTIMIZADO`);
  console.log(`${'='.repeat(60)}`);
  console.log(`   ${stats.chunks} chunks | ${palabras.toLocaleString()} palabras`);
  console.log(`\n   Fuentes principales:`);
  for (const s of finalSources) {
    console.log(`   ${(s.source as string).padEnd(45)} ${s.cnt} chunks`);
  }
}

main().catch(e => console.error("Error:", e.message));
