import { db } from "@/lib/db";
import { documents, documentVersions, cases } from "@/database/schema";
import { eq, and, like, desc, count, or, sql, isNull } from "drizzle-orm";
import { NotFoundError } from "@/lib/errors";
import { inngest, isInngestConfigured } from "@/lib/inngest/client";

export interface DocumentFilters {
  search?: string;
  type?: string;
  caseId?: string;
  page?: number;
  limit?: number;
}

export async function listDocuments(firmId: string, filters: DocumentFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));

  const conditions = [eq(documents.firmId, firmId), isNull(documents.deletedAt)];

  if (filters.search) {
    conditions.push(
      or(
        like(documents.name, `%${filters.search}%`),
        sql`to_tsvector('spanish', COALESCE(${documents.ocrText}, '')) @@ plainto_tsquery('spanish', ${filters.search})`,
      )!,
    );
  }
  if (filters.type) conditions.push(eq(documents.type, filters.type as typeof documents.type._.data));
  if (filters.caseId) conditions.push(eq(documents.caseId, filters.caseId));

  const where = and(...conditions);

  const [total] = await db.select({ count: count() }).from(documents).where(where);

  const rows = await db
    .select({
      id: documents.id,
      firmId: documents.firmId,
      caseId: documents.caseId,
      name: documents.name,
      type: documents.type,
      processingStatus: documents.processingStatus,
      ocrText: documents.ocrText,
      currentVersion: documents.currentVersion,
      status: documents.status,
      createdBy: documents.createdBy,
      createdAt: documents.createdAt,
      updatedAt: documents.updatedAt,
      case: { id: cases.id, number: cases.number, title: cases.title },
    })
    .from(documents)
    .leftJoin(cases, eq(documents.caseId, cases.id))
    .where(where)
    .orderBy(desc(documents.updatedAt))
    .limit(limit)
    .offset((page - 1) * limit);

  return {
    data: rows,
    total: total.count,
    page,
    limit,
    totalPages: Math.ceil(total.count / limit),
  };
}

export interface CreateDocumentInput {
  caseId?: string;
  name: string;
  type?: string;
  mimeType?: string;
  fileUrl?: string;
  fileKey?: string;
  fileSize?: number;
}

export async function createDocument(firmId: string, input: CreateDocumentInput) {
  const [doc] = await db
    .insert(documents)
    .values({
      firmId: firmId as string,
      caseId: input.caseId ?? null,
      name: input.name,
      type: input.type ?? "otro",
      processingStatus: input.fileUrl ? "uploaded" : "pending",
    } as typeof documents.$inferInsert)
    .returning();

  if (input.fileUrl) {
    await db.insert(documentVersions).values({
      documentId: doc.id,
      version: 1,
      fileUrl: input.fileUrl,
      fileKey: input.fileKey ?? "",
      fileSize: input.fileSize ?? 0,
      mimeType: input.mimeType ?? "application/octet-stream",
      changes: "Versión inicial",
    } as typeof documentVersions.$inferInsert);

    if (isInngestConfigured()) {
      await inngest.send({
        name: "document/ocr.process",
        data: {
          documentId: doc.id,
          fileUrl: input.fileUrl,
          mimeType: input.mimeType ?? null,
        },
      });
    } else {
      await runSyncOcr(doc.id, input.fileUrl, input.mimeType ?? null);
    }
  }

  return doc;
}

export async function getDocumentById(firmId: string, id: string) {
  const [doc] = await db
    .select({
      id: documents.id,
      firmId: documents.firmId,
      caseId: documents.caseId,
      name: documents.name,
      type: documents.type,
      currentVersion: documents.currentVersion,
      status: documents.status,
      ocrText: documents.ocrText,
      processingStatus: documents.processingStatus,
      createdBy: documents.createdBy,
      createdAt: documents.createdAt,
      updatedAt: documents.updatedAt,
      case: { id: cases.id, number: cases.number, title: cases.title },
    })
    .from(documents)
    .leftJoin(cases, eq(documents.caseId, cases.id))
    .where(and(eq(documents.id, id), eq(documents.firmId, firmId), isNull(documents.deletedAt)))
    .limit(1);

  if (!doc) throw new NotFoundError("Documento");

  return doc;
}

export interface UpdateDocumentInput {
  name?: string;
  type?: string;
  status?: string;
  caseId?: string;
  currentVersion?: number;
}

export async function updateDocument(firmId: string, id: string, input: UpdateDocumentInput) {
  const allowedFields = ["name", "type", "status", "caseId", "currentVersion"];
  const updates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if ((input as Record<string, unknown>)[key] !== undefined) {
      updates[key] = (input as Record<string, unknown>)[key];
    }
  }

  if (Object.keys(updates).length === 0) return null;

  const [doc] = await db
    .update(documents)
    .set(updates)
    .where(and(eq(documents.id, id), eq(documents.firmId, firmId), isNull(documents.deletedAt)))
    .returning();

  if (!doc) throw new NotFoundError("Documento");

  return doc;
}

export async function softDeleteDocument(firmId: string, id: string) {
  const [doc] = await db
    .update(documents)
    .set({ deletedAt: new Date() })
    .where(and(eq(documents.id, id), eq(documents.firmId, firmId), isNull(documents.deletedAt)))
    .returning();

  if (!doc) throw new NotFoundError("Documento");

  return true;
}

async function runSyncOcr(documentId: string, fileUrl: string, mimeType: string | null) {
  try {
    await db
      .update(documents)
      .set({ processingStatus: "ocr_processing" })
      .where(eq(documents.id, documentId));

    let ocrText = "";
    let confidence = 0;

    const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    if (mimeType?.startsWith("image/")) {
      const { extractTextFromImage } = await import("@/lib/ocr");
      const result = await extractTextFromImage(fileUrl);
      ocrText = result.text;
      confidence = result.confidence;
    } else if (mimeType === "application/pdf") {
      const { extractTextFromPdf } = await import("@/lib/ocr");
      const result = await extractTextFromPdf(fileUrl);
      ocrText = result.text;
      confidence = result.confidence;
    } else if (mimeType === DOCX_MIME) {
      const { extractTextFromDocx } = await import("@/lib/ocr");
      const result = await extractTextFromDocx(fileUrl);
      ocrText = result.text;
      confidence = result.confidence;
    } else if (mimeType === "text/plain") {
      const { extractTextFromPlainText } = await import("@/lib/ocr");
      const result = await extractTextFromPlainText(fileUrl);
      ocrText = result.text;
      confidence = result.confidence;
    }

    if (!ocrText.trim()) {
      await db
        .update(documents)
        .set({ processingStatus: "ocr_skipped", ocrConfidence: Math.round(confidence * 100) })
        .where(eq(documents.id, documentId));
      return;
    }

    await db
      .update(documents)
      .set({
        ocrText: ocrText.substring(0, 50000),
        ocrConfidence: Math.round(confidence * 100),
        processingStatus: "ocr_complete",
      })
      .where(eq(documents.id, documentId));
  } catch {
    await db
      .update(documents)
      .set({ processingStatus: "error" })
      .where(eq(documents.id, documentId));
  }
}
