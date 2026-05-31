import { config } from "dotenv";
config({ path: ".env.local" });

import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { db } from "../lib/db";
import { legalDocuments, documents } from "../database/schema";
import { eq, sql } from "drizzle-orm";
import { chunkWithMetadata } from "../lib/ai/chunking";
import { generateEmbedding } from "../lib/ai/embeddings";
import fs from "fs";

const PDF_PATH = "C:\\Users\\Admin\\AppData\\Local\\Temp\\constitucion_honduras.pdf";
const EXTRACTED_TXT = "C:\\Users\\Admin\\AppData\\Local\\Temp\\constitucion_completa.txt";

async function main() {
  console.log("=".repeat(60));
  console.log("🧑‍⚖️ INDEXANDO CONSTITUCIÓN EN EL CORPUS LEGAL");
  console.log("=".repeat(60));

  // 1. Extraer texto completo del PDF si no existe ya
  let text: string;
  if (fs.existsSync(EXTRACTED_TXT)) {
    text = fs.readFileSync(EXTRACTED_TXT, "utf8");
    console.log(`\n📄 Texto pre-extraído: ${text.length.toLocaleString()} caracteres`);
  } else {
    console.log("\n📄 Extrayendo texto del PDF (263 páginas)...");
    const data = new Uint8Array(fs.readFileSync(PDF_PATH));
    const doc = await getDocument({ data }).promise;

    let allText = "";
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      allText += content.items.map((item: any) => item.str).join(" ") + "\n";
      if (i % 50 === 0) process.stdout.write(`   ${i}/${doc.numPages} páginas\n`);
    }

    fs.writeFileSync(EXTRACTED_TXT, allText, "utf8");
    text = allText;
    console.log(`   ✅ ${text.length.toLocaleString()} caracteres extraídos`);
  }

  // 2. Dividir en secciones por TÍTULOS/CAPÍTULOS
  console.log("\n📚 Dividiendo en secciones...");
  const lines = text.split("\n").filter((l) => l.trim());
  const sectionBreaks: number[] = [0];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toUpperCase();
    if (/^(TÍTULO|CAPÍTULO|LIBRO|PARTE)\s+(I{1,3}|IV|V|VI{0,3}|X{0,2}|PRIMER[OA]|SEGUND[OA]|TERCER[OA]|ÚNICO)/.test(line)) {
      if (i > sectionBreaks[sectionBreaks.length - 1] + 2) sectionBreaks.push(i);
    }
  }
  sectionBreaks.push(lines.length);

  const sections: { title: string; content: string }[] = [];
  for (let i = 0; i < sectionBreaks.length - 1; i++) {
    const slice = lines.slice(sectionBreaks[i], sectionBreaks[i + 1]);
    const content = slice.join("\n").trim();
    if (content.length < 100) continue;
    sections.push({
      title: slice[0]?.trim() || `Sección ${i + 1}`,
      content,
    });
  }

  console.log(`   ${sections.length} secciones detectadas`);

  // 3. Limpiar datos anteriores de la Constitución
  console.log("\n🗑️ Limpiando datos previos...");
  await db.delete(legalDocuments).where(eq(legalDocuments.source, "constitucion"));

  // 4. Chunkear, embedder y almacenar
  console.log("\n💾 Almacenando chunks con embeddings...");
  let totalChunks = 0;

  for (const section of sections) {
    const chunks = chunkWithMetadata("constitucion", section.title, section.content);
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
        totalChunks++;
      } catch (error) {
        console.error(`   ✗ Error: ${error}`);
      }
    }
    if (stored > 0) console.log(`   → "${section.title.substring(0, 60)}" — ${stored} chunks`);
  }

  console.log(`\n✅ Total: ${totalChunks} chunks indexados`);

  // 5. Actualizar documento en dashboard
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
          ocrText: text.substring(0, 50000),
          ocrConfidence: 95,
          processingStatus: "ocr_complete",
        })
        .where(eq(documents.id, doc.id));
      console.log(`\n📄 Documento actualizado:`);
      console.log(`   https://justicia-verdadera.vercel.app/documentos/${doc.id}`);
    }
  } catch (e) {
    console.log(`\n⚠️ No se pudo actualizar el documento: ${e}`);
  }

  // 6. Estadísticas
  const stats = await db
    .select({ source: legalDocuments.source, count: sql<number>`count(*)::int` })
    .from(legalDocuments)
    .groupBy(legalDocuments.source)
    .orderBy(legalDocuments.source);

  console.log("\n" + "=".repeat(60));
  console.log("📊 CORPUS LEGAL ACTUALIZADO");
  console.log("=".repeat(60));
  for (const s of stats) {
    console.log(`   ${s.source}: ${s.count} chunks`);
  }

  // 7. Actualizar master.md
  const total = stats.reduce((s, r) => s + r.count, 0);
  console.log(`\n🎉 Total del corpus: ${total} chunks`);
}

main().catch((error) => {
  console.error("Error:", error instanceof Error ? error.message : error);
  process.exit(1);
});
