import { inngest } from "@/lib/inngest/client";
import { db } from "@/lib/db";
import { documents } from "@/database/schema";
import { eq } from "drizzle-orm";

export const processDocumentOcr = inngest.createFunction(
  {
    id: "process-document-ocr",
    triggers: [{ event: "document/ocr.process" }],
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
        const { extractTextFromPdf } = await import("@/lib/ocr");
        try {
          const result = await extractTextFromPdf(fileUrl);
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
          .set({ processingStatus: "ocr_skipped" })
          .where(eq(documents.id, documentId));
      });
      return { status: "skipped" };
    }

    await step.run("update-status-complete", async () => {
      await db
        .update(documents)
        .set({
          ocrText: ocrText.substring(0, 50000),
          processingStatus: "ocr_complete",
        })
        .where(eq(documents.id, documentId));
    });

    return { status: "complete", textLength: ocrText.length, confidence };
  }
);
