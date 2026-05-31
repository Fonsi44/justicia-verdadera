import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "../lib/db";
import { legalDocuments } from "../database/schema";
import { chunkWithMetadata } from "../lib/ai/chunking";
import { generateEmbedding } from "../lib/ai/embeddings";
import { eq, sql } from "drizzle-orm";
import { extractTextFromPdf } from "../lib/ocr";
import fs from "fs";
import path from "path";
import os from "os";

const PDF_SOURCES: Record<string, { url: string; localFallback?: string }> = {
  constitucion: {
    url: "https://www.poderjudicial.gob.hn/Documentos%20compartidos/ConstituciondelaRep%C3%BAblica07.pdf",
    localFallback: "C:\\Users\\Admin\\AppData\\Local\\Temp\\constitucion_honduras.pdf",
  },
};

async function downloadPdf(url: string, destPath: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "JusticiaVerdadera/1.0" },
      redirect: "follow",
    });
    if (!response.ok) {
      console.error(`   ❌ HTTP ${response.status}: ${response.statusText}`);
      return false;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(destPath, buffer);
    console.log(`   ✅ Descargado: ${(buffer.length / 1024).toFixed(0)} KB (${buffer.length} bytes)`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

async function extractText(pdfPath: string, sourceUrl: string): Promise<string> {
  // Method 1: Use existing OCR pipeline (works for PDFs with text layer)
  console.log(`   🔍 Intentando extracción vía OCR pipeline...`);
  try {
    const result = await extractTextFromPdf(sourceUrl);
    if (result.text && result.text.length > 100) {
      console.log(`   ✅ OCR pipeline: ${result.text.length} chars, confianza: ${(result.confidence * 100).toFixed(0)}%`);
      return result.text;
    }
    console.log(`   ⚠️ OCR pipeline: texto insuficiente (${result.text?.length || 0} chars)`);
  } catch (error) {
    console.log(`   ⚠️ OCR pipeline falló: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Method 2: Direct text extraction from PDF content
  console.log(`   🔍 Intentando extracción directa de texto del PDF...`);
  try {
    const buf = fs.readFileSync(pdfPath);
    const content = buf.toString("latin1");

    const textParts: string[] = [];
    const streamRegex = /stream\s*([\s\S]*?)\s*endstream/g;
    let match;
    while ((match = streamRegex.exec(content)) !== null) {
      const streamData = match[1];
      if (/^[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(streamData.trim())) continue;

      const textRegex = /\(([^)]{3,})\)\s*Tj/g;
      let tMatch;
      while ((tMatch = textRegex.exec(streamData)) !== null) {
        let txt = tMatch[1]
          .replace(/\\n/g, "\n")
          .replace(/\\([0-7]{3})/g, (_m: string, oct: string) => String.fromCharCode(parseInt(oct, 8)))
          .replace(/\\(.)/g, "$1");
        textParts.push(txt);
      }
    }

    if (textParts.length > 0) {
      const text = textParts.join(" ");
      if (text.length > 100) {
        console.log(`   ✅ Extracción directa: ${text.length} chars`);
        return text;
      }
    }
  } catch (error) {
    console.log(`   ⚠️ Extracción directa falló: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Method 3: Try extracting text from PDF using raw object parsing
  console.log(`   🔍 Intentando extracción de objetos PDF...`);
  try {
    const buf = fs.readFileSync(pdfPath);
    const content = buf.toString("latin1");
    const textParts: string[] = [];

    // Extract all text between parentheses (PDF string literals)
    const litRegex = /\(([^)]{10,})\)/g;
    let litMatch;
    while ((litMatch = litRegex.exec(content)) !== null) {
      let txt = litMatch[1]
        .replace(/\\n/g, "\n")
        .replace(/\\([0-7]{3})/g, (_m: string, oct: string) => String.fromCharCode(parseInt(oct, 8)))
        .replace(/\\(.)/g, "$1");
      // Filter out binary/encoded content
      if (/^[\x20-\x7EÁÉÍÓÚÑÜáéíóúñü\s]+$/.test(txt.substring(0, 10))) {
        textParts.push(txt);
      }
    }

    if (textParts.length > 10) {
      const text = textParts.join(" ");
      console.log(`   ✅ Extracción de objetos: ${text.length} chars`);
      return text;
    }
  } catch (error) {
    console.log(`   ⚠️ Extracción de objetos falló: ${error instanceof Error ? error.message : String(error)}`);
  }

  return "";
}

function splitIntoSections(text: string, sourceId: string): { title: string; content: string }[] {
  const lines = text.split("\n").filter((l) => l.trim());

  const sectionBreaks: number[] = [0];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^(TÍTULO|LIBRO|CAPÍTULO|PARTE|SECCIÓN|CAPÍTULO)\s+(I|II|III|IV|V|VI|VII|VIII|IX|X|PRIMER|SEGUND|TERCER|PRIMERA|SEGUNDA|TERCERA|ÚNICO)/i.test(line)) {
      if (i > sectionBreaks[sectionBreaks.length - 1] + 1) sectionBreaks.push(i);
    }
  }
  sectionBreaks.push(lines.length);

  const sections: { title: string; content: string }[] = [];
  for (let i = 0; i < sectionBreaks.length - 1; i++) {
    const start = sectionBreaks[i];
    const end = sectionBreaks[i + 1];
    const sectionLines = lines.slice(start, end);
    if (sectionLines.length < 2) continue;
    const content = sectionLines.join("\n");
    if (content.length < 100) continue;
    sections.push({ title: sectionLines[0]?.trim() || `${sourceId} — Sección ${i + 1}`, content });
  }

  return sections.length > 0 ? sections : [{ title: sourceId, content: text }];
}

async function main() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "legal-pdf-"));
  let totalChunks = 0;

  console.log("=".repeat(60));
  console.log("🧑‍⚖️ DESCARGA E INGESTA DE PDFs OFICIALES");
  console.log("=".repeat(60));

  for (const [sourceId, source] of Object.entries(PDF_SOURCES)) {
    console.log(`\n📄 Fuente: ${sourceId}`);

    await db.delete(legalDocuments).where(eq(legalDocuments.source, sourceId));
    console.log(`   🗑️ Datos previos limpiados`);

    const pdfPath = path.join(tmpDir, `${sourceId}.pdf`);
    const downloaded = await downloadPdf(source.url, pdfPath);

    // Try local fallback if download failed
    if (!downloaded && source.localFallback && fs.existsSync(source.localFallback)) {
      console.log(`   📂 Usando copia local: ${source.localFallback}`);
      fs.copyFileSync(source.localFallback, pdfPath);
    } else if (!downloaded) {
      console.log(`   ❌ No se pudo descargar y no hay copia local`);
      continue;
    }

    const text = await extractText(pdfPath, source.url);

    if (!text || text.length < 50) {
      console.log(`   ⚠️ No se pudo extraer texto del PDF. El PDF puede ser escaneado (imagen).`);
      console.log(`   💡 Para PDFs escaneados, se necesita OCR. El proyecto tiene tesseract.js instalado.`);
      continue;
    }

    console.log(`   📝 Dividiendo en secciones...`);
    const sections = splitIntoSections(text, sourceId);
    console.log(`   📚 Secciones detectadas: ${sections.length}`);

    for (const section of sections) {
      const chunks = chunkWithMetadata(sourceId, section.title, section.content);
      let sectionChunks = 0;

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
          sectionChunks++;
          totalChunks++;
        } catch (error) {
          console.error(`   ✗ Error almacenando chunk: ${error}`);
        }
      }
      console.log(`   → "${section.title.substring(0, 60)}..." — ${sectionChunks} chunks`);
    }
  }

  fs.rmSync(tmpDir, { recursive: true, force: true });

  const stats = await db
    .select({
      source: legalDocuments.source,
      count: sql<number>`count(*)::int`,
    })
    .from(legalDocuments)
    .groupBy(legalDocuments.source)
    .orderBy(legalDocuments.source);

  console.log("\n" + "=".repeat(60));
  console.log("📊 ESTADO DEL CORPUS LEGAL");
  console.log("=".repeat(60));
  console.log(`Total chunks nuevos: ${totalChunks}`);
  console.log(`\nFuentes:`);
  for (const s of stats) {
    console.log(`   ${s.source}: ${s.count} chunks`);
  }
}

main().catch((error) => {
  console.error("Error:", error instanceof Error ? error.message : error);
  process.exit(1);
});
