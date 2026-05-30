import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents, cases } from "@/database/schema";
import { getFirmId } from "@/lib/auth/require-auth";
import { eq, and } from "drizzle-orm";
import { checkRateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const firmId = await getFirmId();
    const { id } = await params;

    const [doc] = await db
      .select({
        id: documents.id,
        firmId: documents.firmId,
        caseId: documents.caseId,
        name: documents.name,
        type: documents.type,
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
      .where(and(eq(documents.id, id), eq(documents.firmId, firmId)))
      .limit(1);

    if (!doc) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ data: doc });
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json({ error: "Error al obtener documento" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const firmId = await getFirmId();
    const { id } = await params;

    const rateCheck = await checkRateLimit("api", firmId);
    if (rateCheck instanceof NextResponse) return rateCheck;

    const body = await req.json();

    const allowedFields = ["name", "type", "status", "caseId", "currentVersion"];
    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No hay campos para actualizar" }, { status: 400 });
    }

    const [doc] = await db
      .update(documents)
      .set(updates)
      .where(and(eq(documents.id, id), eq(documents.firmId, firmId)))
      .returning();

    if (!doc) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
    }

    await writeAuditLog({
      firmId,
      action: "update",
      entityType: "document",
      entityId: id,
      changes: updates,
    });

    return NextResponse.json({ data: doc });
  } catch (error) {
    console.error("Error updating document:", error);
    return NextResponse.json({ error: "Error al actualizar documento" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const firmId = await getFirmId();
    const { id } = await params;

    const rateCheck = await checkRateLimit("api", firmId);
    if (rateCheck instanceof NextResponse) return rateCheck;

    const [doc] = await db
      .delete(documents)
      .where(and(eq(documents.id, id), eq(documents.firmId, firmId)))
      .returning();

    if (!doc) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
    }

    await writeAuditLog({
      firmId,
      action: "delete",
      entityType: "document",
      entityId: id,
      changes: { deletedId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json({ error: "Error al eliminar documento" }, { status: 500 });
  }
}
