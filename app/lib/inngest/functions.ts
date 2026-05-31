import { inngest } from "@/lib/inngest/client";
import { db } from "@/lib/db";
import { documents } from "@/database/schema";
import { eq } from "drizzle-orm";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const configured = !!process.env.INNGEST_EVENT_KEY;

export {
  processNotification,
  scheduledEventReminder,
  scheduledInvoiceCheck,
} from "@/lib/inngest/notifications";

export const processDocumentOcr = configured
  ? inngest.createFunction(
      {
        id: "process-document-ocr",
        triggers: [{ event: "document/ocr.process" }],
        retries: 2,
      },
      async ({ event, step }) => {
        const { documentId, fileUrl, mimeType } = event.data;

        await step.run("update-status-processing", async () => {
          await db
            .update(documents)
            .set({ processingStatus: "ocr_processing" })
            .where(eq(documents.id, documentId));
        });

        let ocrText = "";
        let confidence = 0;

        if (mimeType?.startsWith("image/")) {
          await step.run("ocr-image", async () => {
            const { extractTextFromImage } = await import("@/lib/ocr");
            const result = await extractTextFromImage(fileUrl);
            ocrText = result.text;
            confidence = result.confidence;
          });
        } else if (mimeType === "application/pdf") {
          await step.run("ocr-pdf", async () => {
            const { extractTextFromPdf, extractTextFromScannedPdf } = await import("@/lib/ocr");
            try {
              const result = await extractTextFromPdf(fileUrl);
              if (result.text.length > 50) {
                ocrText = result.text;
                confidence = result.confidence;
              } else {
                // Scanned PDF: try Tesseract OCR directly on the PDF
                console.log("[OCR] PDF sin capa de texto, intentando OCR por imágenes...");
                const scannedResult = await extractTextFromScannedPdf(fileUrl);
                if (scannedResult.text.trim().length > 0) {
                  ocrText = scannedResult.text;
                  confidence = scannedResult.confidence;
                }
              }
            } catch {
              ocrText = "";
              confidence = 0;
            }
          });
        } else if (mimeType === DOCX_MIME) {
          await step.run("ocr-docx", async () => {
            const { extractTextFromDocx } = await import("@/lib/ocr");
            try {
              const result = await extractTextFromDocx(fileUrl);
              ocrText = result.text;
              confidence = result.confidence;
            } catch {
              ocrText = "";
              confidence = 0;
            }
          });
        } else if (mimeType === "text/plain") {
          await step.run("ocr-text", async () => {
            const { extractTextFromPlainText } = await import("@/lib/ocr");
            try {
              const result = await extractTextFromPlainText(fileUrl);
              ocrText = result.text;
              confidence = result.confidence;
            } catch {
              ocrText = "";
              confidence = 0;
            }
          });
        }

        if (!ocrText.trim()) {
          await step.run("update-status-skipped", async () => {
            await db
              .update(documents)
              .set({
                processingStatus: "manual_review",
                ocrText: "[PDF escaneado — sin capa de texto. El OCR requiere procesamiento local con mas recursos.]",
              })
              .where(eq(documents.id, documentId));
          });
          return { status: "manual_review" };
        }

        await step.run("update-status-complete", async () => {
          await db
            .update(documents)
            .set({
              ocrText: ocrText.substring(0, 50000),
              ocrConfidence: Math.round(confidence * 100),
              processingStatus: "ocr_complete",
            })
            .where(eq(documents.id, documentId));
        });

        return { status: "complete", textLength: ocrText.length, confidence };
      }
    )
  : undefined;
