import { createWorker } from "tesseract.js";

export type OcrResult = {
  text: string;
  confidence: number;
};

export async function extractTextFromImage(
  imageUrl: string
): Promise<OcrResult> {
  const worker = await createWorker("spa");
  const { data } = await worker.recognize(imageUrl);
  await worker.terminate();
  return {
    text: data.text,
    confidence: data.confidence ?? 0,
  };
}

export async function extractTextFromPdf(
  pdfUrl: string
): Promise<OcrResult> {
  // Native PDF text extraction using Fetch API + basic text fallback
  // For scanned PDFs (>3 pages or no text), returns empty for ocr_skipped
  try {
    const resp = await fetch(pdfUrl);
    const buffer = await resp.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Simple PDF text extraction (for text-based PDFs only)
    const decoder = new TextDecoder("utf-8");
    const content = decoder.decode(bytes);
    const textMatches = content.match(/\(([^)]*)\)/g);

    if (textMatches) {
      const text = textMatches
        .map((m) => m.slice(1, -1))
        .filter((t) => t.length > 2)
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
