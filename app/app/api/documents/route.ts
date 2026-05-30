import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents, documentVersions, cases } from "@/database/schema";
import { getFirmId } from "@/lib/auth/require-auth";
import { eq, and, like, desc, count, or, sql } from "drizzle-orm";
import { checkRateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";
import { inngest } from "@/lib/inngest/client";

export async function GET(req: NextRequest) {
  try {
    const firmId = await getFirmId();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const type = searchParams.get("type");
    const caseId = searchParams.get("caseId");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));

    const conditions = [eq(documents.firmId, firmId)];
    if (search) {
      conditions.push(
        or(
          like(documents.name, `%${search}%`),
          sql`to_tsvector('spanish', COALESCE(${documents.ocrText}, '')) @@ plainto_tsquery('spanish', ${search})`,
        )!,
      );
    }
    if (type) conditions.push(eq(documents.type, type as typeof documents.type._.data));
    if (caseId) conditions.push(eq(documents.caseId, caseId));

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
        case: {
          id: cases.id,
          number: cases.number,
          title: cases.title,
        },
      })
      .from(documents)
      .leftJoin(cases, eq(documents.caseId, cases.id))
      .where(where)
      .orderBy(desc(documents.updatedAt))
      .limit(limit)
      .offset((page - 1) * limit);

    return NextResponse.json({
      data: rows,
      total: total.count,
      page,
      limit,
      totalPages: Math.ceil(total.count / limit),
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json({ error: "Error al obtener documentos" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const firmId = await getFirmId();

    const rateCheck = await checkRateLimit("upload", firmId);
    if (rateCheck instanceof NextResponse) return rateCheck;

    const body = await req.json();
    const { caseId, name, type, mimeType, fileUrl, fileKey, fileSize } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Nombre del documento es requerido" },
        { status: 400 }
      );
    }

    const [doc] = await db
      .insert(documents)
      .values({
        firmId,
        caseId: caseId ?? null,
        name,
        type: type ?? "otro",
        processingStatus: fileUrl ? "uploaded" : "pending",
      })
      .returning();

    if (fileUrl) {
      await db.insert(documentVersions).values({
        documentId: doc.id,
        version: 1,
        fileUrl,
        fileKey: fileKey ?? null,
        fileSize: fileSize ?? null,
        mimeType: mimeType ?? null,
        changes: "Versión inicial",
      });

      await inngest.send({
        name: "document/ocr.process",
        data: {
          documentId: doc.id,
          fileUrl,
          mimeType: mimeType ?? null,
        },
      });
    }

    await writeAuditLog({
      firmId,
      action: "create",
      entityType: "document",
      entityId: doc.id,
      changes: { name, type, fileUrl: fileUrl ?? null },
    });

    return NextResponse.json({ data: doc }, { status: 201 });
  } catch (error) {
    console.error("Error creating document:", error);
    return NextResponse.json({ error: "Error al crear documento" }, { status: 500 });
  }
}
