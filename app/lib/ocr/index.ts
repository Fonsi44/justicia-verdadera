import { createWorker } from "tesseract.js";

export type OcrResult = {
  text: string;
  confidence: number;
};

export async function extractTextFromImage(
  imageUrl: string
): Promise<OcrResult> {
  let worker;
  try {
    worker = await createWorker("spa");
    const { data } = await worker.recognize(imageUrl);
    return {
      text: data.text,
      confidence: data.confidence ?? 0,
    };
  } finally {
    if (worker) await worker.terminate();
  }
}

async function extractWithPdfjs(buffer: ArrayBuffer): Promise<string | null> {
  try {
    const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const data = new Uint8Array(buffer);
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
    return allText.trim() || null;
  } catch {
    return null;
  }
}

export async function extractTextFromPdf(
  pdfUrl: string
): Promise<OcrResult> {
  try {
    const resp = await fetch(pdfUrl);
    const buffer = await resp.arrayBuffer();

    // Method 1: pdfjs-dist (robusto, capa de texto estándar)
    const pdfjsText = await extractWithPdfjs(buffer);
    if (pdfjsText && pdfjsText.length > 50) {
      return { text: pdfjsText, confidence: 0.95 };
    }

    // Method 2: BT/ET stream parsing (PDFs con formato antiguo)
    const bytes = new Uint8Array(buffer);
    const decoder = new TextDecoder("utf-8");
    const content = decoder.decode(bytes);

    const streamLines: string[] = [];
    let inStream = false;

    for (const line of content.split(/\r?\n/)) {
      if (line.startsWith("BT")) inStream = true;
      if (inStream) streamLines.push(line);
      if (line.startsWith("ET")) inStream = false;
    }

    const textMatches: string[] = [];
    for (const line of streamLines) {
      const tjMatch = line.match(/\[(.*?)\]\s*TJ/i);
      if (tjMatch) {
        const tokens = tjMatch[1].match(/\(([^)]*)\)|<\w+>/g);
        if (tokens) {
          for (const token of tokens) {
            if (token.startsWith("(")) textMatches.push(token.slice(1, -1));
          }
        }
      }
      const tMatch = line.match(/\(([^)]*)\)\s*Tj/i);
      if (tMatch) textMatches.push(tMatch[1]);
    }

    if (textMatches.length > 0) {
      const text = textMatches.filter((t) => t.length > 1).join(" ");
      if (text.length > 50) return { text, confidence: 0.9 };
    }

    // Method 3: fallback de paréntesis
    const fallbackText = content.match(/\(([^)]*)\)/g);
    if (fallbackText) {
      const text = fallbackText
        .map((m) => m.slice(1, -1))
        .filter((t) => t.length > 2)
        .join(" ");
      if (text.length > 50) return { text, confidence: 0.7 };
    }

    // Scanned PDF: no text layer found.
    return { text: "", confidence: 0 };
  } catch {
    return { text: "", confidence: 0 };
  }
}

/**
 * OCR para PDFs escaneados (sin capa de texto).
 * Usa Tesseract.js directamente sobre el PDF — convierte páginas a imágenes y las OCR.
 * @param pdfUrl URL del PDF
 * @param maxPages Máximo de páginas a procesar (default 20 para serverless)
 */
export async function extractTextFromScannedPdf(
  pdfUrl: string
): Promise<OcrResult> {
  let worker;
  try {
    worker = await createWorker("spa");
    const { data } = await worker.recognize(pdfUrl);
    return {
      text: data.text,
      confidence: data.confidence ?? 0,
    };
  } catch (error) {
    console.warn(`[OCR] Scanned PDF fallback failed: ${error instanceof Error ? error.message : error}`);
    return { text: "", confidence: 0 };
  } finally {
    if (worker) await worker.terminate();
  }
}

export async function extractTextFromDocx(
  docxUrl: string
): Promise<OcrResult> {
  try {
    const resp = await fetch(docxUrl);
    const buffer = await resp.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const decoder = new TextDecoder("utf-8");
    const content = decoder.decode(bytes);

    const textMatches = content.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
    if (textMatches && textMatches.length > 0) {
      const text = textMatches
        .map((m) => m.replace(/<[^>]+>/g, ""))
        .filter((t) => t.trim().length > 0)
        .join(" ");
      if (text.length > 50) {
        return { text, confidence: 0.95 };
      }
    }

    return { text: "", confidence: 0 };
  } catch {
    return { text: "", confidence: 0 };
  }
}

export async function extractTextFromPlainText(
  fileUrl: string
): Promise<OcrResult> {
  try {
    const resp = await fetch(fileUrl);
    const text = await resp.text();
    if (text.trim().length > 0) {
      return { text: text.trim(), confidence: 1.0 };
    }
    return { text: "", confidence: 0 };
  } catch {
    return { text: "", confidence: 0 };
  }
}
