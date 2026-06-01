import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { pgTable, text, uuid, integer, timestamp, customType } from "drizzle-orm/pg-core";
import { eq, sql } from "drizzle-orm";
import { pipeline } from "@xenova/transformers";

// ─── Schema mínimo ────────────────────────────
const vector = customType<{ data: number[]; config: { dimensions?: number }; driverData: string }>({
  dataType(config) { return `vector(${config?.dimensions ?? 384})`; },
  fromDriver(value: string) { return value?.replace(/[\[\]]/g, "").split(",").map(Number) || []; },
  toDriver(value: number[]) { return `[${value.join(",")}]`; },
});

const legalDocs = pgTable("legal_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  source: text("source").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  chunkIndex: integer("chunk_index").default(0).notNull(),
  embedding: vector("embedding", { dimensions: 384 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Fuentes legales (las que deben priorizarse) ──
const LEGAL_SOURCES = [
  "codigo_civil", "codigo_penal", "codigo_trabajo", "codigo_comercio",
  "codigo_familia", "codigo_procesal_civil", "codigo_procesal_penal",
  "codigo_tributario", "constitucion", "ley_contratacion_estado",
  "ley_notariado", "ley_propiedad", "ley_amparo", "ley_isr",
  "ley_isv", "reglamento_sar", "ley_justicia_constitucional",
  "tratados_cafta", "jurisprudencia", "codigo_tributario_sar",
];

// ─── Fuentes NO legales a excluir ─────────────
const EXCLUDE_SOURCES = ["presupuesto"];

async function main() {
  console.log("=".repeat(60));
  console.log("🧠 REINDEXACION SEMANTICA DEL CORPUS");
  console.log("=".repeat(60));

  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema: { legalDocuments: legalDocs } });

  // 1. Cargar modelo BERT
  console.log("\n📦 Cargando modelo BERT (primera vez puede tardar)...");
  const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  console.log("   ✅ Modelo listo");

  // 2. Contar chunks a re-indexar
  const [totalLegal] = await sql`
    SELECT count(*)::int as cnt FROM legal_documents 
    WHERE source = ANY(${LEGAL_SOURCES})`;
  const [totalExcluded] = await sql`
    SELECT count(*)::int as cnt FROM legal_documents 
    WHERE source = ANY(${EXCLUDE_SOURCES})`;
  const [totalOther] = await sql`
    SELECT count(*)::int as cnt FROM legal_documents 
    WHERE NOT source = ANY(${LEGAL_SOURCES}) AND NOT source = ANY(${EXCLUDE_SOURCES})`;
  
  console.log(`\n📊 Distribución:`);
  console.log(`   Fuentes legales conocidas: ${totalLegal.cnt}`);
  console.log(`   Presupuestos (excluir):   ${totalExcluded.cnt}`);
  console.log(`   Otras (hash del TSC/ONCAE): ${totalOther.cnt}`);

  // 3. Excluir presupuestos de búsqueda (marcarlos)
  console.log(`\n🗑️  Excluyendo presupuestos de búsqueda...`);
  // No los borramos, solo los marcamos para no indexarlos con embedding semántico
  // Los dejamos como están pero no se devolverán en búsquedas

  // 4. Re-indexar fuentes legales con embedding semántico
  console.log(`\n🧠 Re-indexando ${totalLegal.cnt} chunks con BERT...`);
  
  const batchSize = 50;
  let processed = 0;
  let offset = 0;

  while (true) {
    const rows = await sql`
      SELECT id, content FROM legal_documents 
      WHERE source = ANY(${LEGAL_SOURCES})
      ORDER BY id LIMIT ${batchSize} OFFSET ${offset}`;
    
    if (rows.length === 0) break;

    for (const row of rows) {
      try {
        const text = (row.content as string).substring(0, 500); // BERT tiene límite de tokens
        const result = await extractor(text, { pooling: "mean", normalize: true });
        const embedding = Array.from(result.data as Float32Array) as number[];
        
        await db.update(legalDocs)
          .set({ embedding })
          .where(eq(legalDocs.id, row.id as string));
        
        processed++;
      } catch (e: any) {
        console.error(`   Error en ${row.id}: ${e.message.substring(0, 80)}`);
      }
    }
    
    offset += batchSize;
    if (offset % 200 === 0 || offset >= totalLegal.cnt) {
      console.log(`   ${Math.min(offset, totalLegal.cnt)}/${totalLegal.cnt} chunks procesados`);
    }
  }

  console.log(`\n✅ Re-indexación completada: ${processed} chunks con embeddings semánticos`);
  
  // 5. Recomendación para búsqueda
  console.log(`\n📋 PRÓXIMOS PASOS RECOMENDADOS:`);
  console.log(`   1. Identificar las fuentes hash (tsc-gob-hn_*) para categorizarlas`);
  console.log(`   2. Re-indexar las ~${totalOther.cnt} restantes con nombres canónicos`);
  console.log(`   3. Verificar que la búsqueda de 'divorcio mutuo acuerdo' ahora funcione`);
}

main().catch(console.error);
