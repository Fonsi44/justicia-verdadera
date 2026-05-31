import { config } from "dotenv";
config({ path: ".env.local" });

import { extractTextFromScannedPdf } from "../lib/ocr";
import { db } from "../lib/db";
import { legalDocuments } from "../database/schema";
import { documents, documentVersions } from "../database/schema";
import { eq, sql } from "drizzle-orm";
import { chunkWithMetadata } from "../lib/ai/chunking";
import { generateEmbedding } from "../lib/ai/embeddings";
import fs from "fs";

const PDF_PATH = "C:\\Users\\Admin\\AppData\\Local\\Temp\\constitucion_honduras.pdf";
const PDF_URL = "https://www.poderjudicial.gob.hn/Documentos%20compartidos/ConstituciondelaRep%C3%BAblica07.pdf";
const OUTPUT_TXT = "C:\\Users\\Admin\\AppData\\Local\\Temp\\constitucion_completa.txt";

async function main() {
  console.log("=".repeat(60));
  console.log("🧑‍⚖️ OCR LOCAL — CONSTITUCIÓN DE HONDURAS (263 páginas)");
  console.log("=".repeat(60));

  // 1. Descargar PDF si no existe
  if (!fs.existsSync(PDF_PATH)) {
    console.log("\n📥 Descargando PDF...");
    const resp = await fetch(PDF_URL);
    const buf = Buffer.from(await resp.arrayBuffer());
    fs.writeFileSync(PDF_PATH, buf);
    console.log(`   ✅ ${(buf.length / 1024).toFixed(0)} KB`);
  }

  // 2. Ejecutar OCR con Tesseract (puede tomar varios minutos)
  console.log("\n🔍 Ejecutando Tesseract OCR sobre 263 páginas...");
  console.log("   ⏱️  Estimado: 5-15 minutos dependiendo del CPU\n");
  const startTime = Date.now();

  let result;
  try {
    result = await extractTextFromScannedPdf(PDF_PATH);
  } catch (error) {
    console.error(`\n❌ Error OCR: ${error}`);
    console.log("\n📌 Posibles causas:");
    console.log("   - Tesseract no encuentra el motor OCR nativo");
    console.log("   - Memoria insuficiente para 263 páginas");
    console.log("\n💡 Solución alternativa: Abre el PDF en Google Drive");
    console.log("   1. Sube el PDF a drive.google.com");
    console.log("   2. Ábrelo con 'Google Docs'");
    console.log("   3. Google extrae el texto automáticamente");
    console.log("   4. Copia el texto y guárdalo como .txt");
    return;
  }

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n⏱️  Tiempo total: ${elapsed} minutos`);

  if (!result || !result.text || result.text.length < 100) {
    console.log(`\n⚠️ Resultado insuficiente: ${result?.text?.length || 0} caracteres`);
    console.log("   La Constitución puede ser demasiado grande para Tesseract.js en este entorno.");
    console.log("\n💡 Prueba con Google Drive → Google Docs como alternativa.");
    return;
  }

  // 3. Guardar texto extraído
  fs.writeFileSync(OUTPUT_TXT, result.text, "utf8");
  console.log(`\n✅ Texto extraído: ${result.text.length} caracteres`);
  console.log(`   Guardado en: ${OUTPUT_TXT}`);
  console.log(`   Confianza OCR: ${(result.confidence * 100).toFixed(0)}%`);

  // 4. Chunkear e indexar en el corpus legal
  console.log("\n📚 Indexando en el corpus legal...");
  await db.delete(legalDocuments).where(eq(legalDocuments.source, "constitucion"));

  const chunks = chunkWithMetadata("constitucion", "Constitución de la República de Honduras", result.text);
  let stored = 0;

  for (const chunk of chunks) {
    try {
      const embedding = await generateEmbedding(chunk.content);
      await db.insert(legalDocuments).values({
        source: chunk.source,
        title: chunk.title,
        content: chunk.content,
        chunkIndex: chunk.chunkIndex,
        embedding: embedding,
      } as typeof legalDocuments.$inferInsert);
      stored++;
    } catch (error) {
      console.error(`   ✗ Error chunk ${chunk.chunkIndex}: ${error}`);
    }
  }

  console.log(`   ✅ ${stored} chunks almacenados (de ${chunks.length} generados)`);

  // 5. Actualizar el documento en el dashboard si existe
  try {
    const [doc] = await db
      .select({ id: documents.id })
      .from(documents)
      .where(eq(documents.name, "Constitución de la República de Honduras"))
      .limit(1);

    if (doc) {
      await db
        .update(documents)
        .set({
          ocrText: result.text.substring(0, 50000),
          ocrConfidence: Math.round(result.confidence * 100),
          processingStatus: "ocr_complete",
        })
        .where(eq(documents.id, doc.id));
      console.log(`\n📄 Documento actualizado en el dashboard: ${doc.id}`);
    }
  } catch {
    console.log("\n⚠️ No se pudo actualizar el documento en dashboard");
  }

  // 6. Estadísticas finales
  const stats = await db
    .select({ source: legalDocuments.source, count: sql<number>`count(*)::int` })
    .from(legalDocuments)
    .groupBy(legalDocuments.source)
    .orderBy(legalDocuments.source);

  console.log("\n" + "=".repeat(60));
  console.log("📊 ESTADO DEL CORPUS LEGAL");
  console.log("=".repeat(60));
  for (const s of stats) {
    console.log(`   ${s.source}: ${s.count} chunks`);
  }
  console.log("\n🎉 Constitución procesada e indexada exitosamente.");
}

main().catch((error) => {
  console.error("\n❌ Error fatal:", error instanceof Error ? error.message : error);
  process.exit(1);
});
