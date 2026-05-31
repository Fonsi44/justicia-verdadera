import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "../lib/db";
import { legalDocuments, documents, documentVersions } from "../database/schema";
import { eq, sql } from "drizzle-orm";
import { chunkWithMetadata } from "../lib/ai/chunking";
import { generateEmbedding } from "../lib/ai/embeddings";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import fs from "fs";
import path from "path";
import os from "os";

// Documentos a descargar del SAR: slug -> { title, sourceId, type }
const SAR_DOWNLOADS: Record<string, { title: string; sourceId: string; docType: string }> = {
  "constitucion-de-la-republica": {
    title: "Constitución de la República de Honduras",
    sourceId: "constitucion_sar",
    docType: "constitucion",
  },
  "texto-consolidado-codigo-tributario-decreto-170-2016": {
    title: "Código Tributario de Honduras (Texto Consolidado)",
    sourceId: "codigo_tributario_sar",
    docType: "codigo_tributario",
  },
  "consolidado-ley-impuesto-sobre-la-renta-25-junio-2018": {
    title: "Ley de Impuesto Sobre la Renta (Consolidado)",
    sourceId: "ley_isr_sar",
    docType: "ley_isr",
  },
  "consolidad-de-la-ley-de-impuesto-sobre-ventas-de-sefin-27-de-agosto-2018": {
    title: "Ley de Impuesto Sobre Ventas (Consolidado)",
    sourceId: "ley_isv_sar",
    docType: "ley_isv",
  },
};

// Intentaremos encontrar los wpdmdl IDs automáticamente
async function findWpdmId(slug: string): Promise<string | null> {
  try {
    const resp = await fetch(`https://www.sar.gob.hn/download/${slug}/`, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const html = await resp.text();
    const match = html.match(/wpdmdl=(\d+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

async function downloadPdf(url: string, destPath: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);
    const resp = await fetch(url, { signal: controller.signal, redirect: "follow" });
    clearTimeout(timeout);
    if (!resp.ok) return false;
    const buf = Buffer.from(await resp.arrayBuffer());
    fs.writeFileSync(destPath, buf);
    console.log(`   ✅ ${(buf.length / 1024).toFixed(0)} KB`);
    return true;
  } catch (error) {
    console.log(`   ❌ Error: ${error instanceof Error ? error.message : "timeout"}`);
    return false;
  }
}

async function extractPdfText(pdfPath: string): Promise<string> {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await getDocument({ data }).promise;
  let allText = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    allText += content.items
      .map((item: unknown) => (item as { str?: string }).str ?? "")
      .filter(Boolean)
      .join(" ") + "\n";
  }
  return allText.trim();
}

async function main() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sar-pdf-"));
  let totalChunks = 0;

  console.log("=".repeat(60));
  console.log("📥 DESCARGA MASIVA DE PDFs DEL SAR HONDURAS");
  console.log("=".repeat(60));

  for (const [slug, info] of Object.entries(SAR_DOWNLOADS)) {
    console.log(`\n📄 ${info.title}`);
    
    // Find wpdm ID
    console.log(`   🔍 Buscando ID de descarga...`);
    const wpdmId = await findWpdmId(slug);
    if (!wpdmId) {
      console.log(`   ⚠️  No se encontró ID para este documento`);
      continue;
    }
    console.log(`   ID encontrado: ${wpdmId}`);

    // Download PDF
    const pdfPath = path.join(tmpDir, `${info.sourceId}.pdf`);
    const url = `https://www.sar.gob.hn/download/${slug}/?wpdmdl=${wpdmId}`;
    const downloaded = await downloadPdf(url, pdfPath);
    if (!downloaded) continue;

    // Extract text with pdfjs-dist
    console.log(`   📖 Extrayendo texto...`);
    let text: string;
    try {
      text = await extractPdfText(pdfPath);
    } catch {
      console.log(`   ⚠️  pdfjs-dist falló, intentando OCR pipeline...`);
      const { extractTextFromPdf } = await import("../lib/ocr");
      const result = await extractTextFromPdf(url);
      text = result.text;
    }

    if (!text || text.length < 50) {
      console.log(`   ⚠️  Sin texto extraíble (PDF escaneado)`);
      continue;
    }

    console.log(`   ✅ ${text.length.toLocaleString()} caracteres`);

    // Chunk and store
    console.log(`   💾 Almacenando en corpus...`);
    await db.delete(legalDocuments).where(eq(legalDocuments.source, info.sourceId));

    const sections = splitIntoSections(text, info.title);
    let docChunks = 0;

    for (const section of sections) {
      const chunks = chunkWithMetadata(info.sourceId, section.title, section.content);
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
          docChunks++;
          totalChunks++;
        } catch (e) {
          console.error(`   ✗ Error: ${e}`);
        }
      }
    }
    console.log(`   → ${docChunks} chunks indexados`);

    // Also create document in dashboard
    try {
      const [firm] = await db.select({ id: documents.firmId }).from(documents).limit(1);
      // Create document record
      const [doc] = await db.insert(documents).values({
        firmId: "00000000-0000-0000-0000-000000000000", // placeholder
        name: info.title,
        type: info.docType as any,
        status: "final",
        ocrText: text.substring(0, 50000),
        ocrConfidence: 95,
        processingStatus: "ocr_complete",
      } as any).returning();
      console.log(`   📋 Documento creado: ${doc.id}`);
    } catch {
      // Document creation optional
    }
  }

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });

  // Stats
  const stats = await db
    .select({
      source: legalDocuments.source,
      count: sql<number>`count(*)::int`,
    })
    .from(legalDocuments)
    .groupBy(legalDocuments.source)
    .orderBy(sql`count(*)::int DESC`);

  console.log("\n" + "=".repeat(60));
  console.log("📊 CORPUS LEGAL FINAL");
  console.log("=".repeat(60));
  let total = 0;
  for (const s of stats) {
    console.log(`   ${s.source}: ${s.count} chunks`);
    total += s.count;
  }
  console.log("=".repeat(60));
  console.log(`   TOTAL: ${total} chunks`);
}

function splitIntoSections(text: string, title: string): { title: string; content: string }[] {
  const lines = text.split("\n").filter((l) => l.trim());
  const breaks: number[] = [0];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toUpperCase().trim();
    if (/^(TÍTULO|CAPÍTULO|LIBRO|PARTE|SECCIÓN)\s+(I{1,3}|IV|V|VI{0,3}|X{0,2}|PRIMER|SEGUND)/.test(line)) {
      if (i > breaks[breaks.length - 1] + 2) breaks.push(i);
    }
  }
  breaks.push(lines.length);
  const sections: { title: string; content: string }[] = [];
  for (let i = 0; i < breaks.length - 1; i++) {
    const slice = lines.slice(breaks[i], breaks[i + 1]);
    const content = slice.join("\n").trim();
    if (content.length < 100) continue;
    sections.push({ title: slice[0]?.trim() || `Sección ${i + 1}`, content });
  }
  return sections.length > 0 ? sections : [{ title, content: text }];
}

main().catch(console.error);
