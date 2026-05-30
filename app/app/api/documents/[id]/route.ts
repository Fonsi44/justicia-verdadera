import { NextRequest, NextResponse } from "next/server";
import { getFirmId, handleUnauthorized } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { getDocumentById, updateDocument, softDeleteDocument } from "@/lib/services/documents.service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const firmId = await getFirmId();
    const { id } = await params;
    const doc = await getDocumentById(firmId, id);
    return NextResponse.json({ data: doc });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error fetching document:", error instanceof Error ? error.message : error);
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

    const updates: Record<string, unknown> = {};
    const allowedFields = ["name", "type", "status", "caseId", "currentVersion"];
    for (const key of allowedFields) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No hay campos para actualizar" }, { status: 400 });
    }

    const doc = await updateDocument(firmId, id, updates);

    await writeAuditLog({
      firmId,
      action: "update",
      entityType: "document",
      entityId: id,
      changes: updates,
    });

    return NextResponse.json({ data: doc });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error updating document:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al actualizar documento" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const firmId = await getFirmId();
    const { id } = await params;

    const rateCheck = await checkRateLimit("api", firmId);
    if (rateCheck instanceof NextResponse) return rateCheck;

    await softDeleteDocument(firmId, id);

    await writeAuditLog({
      firmId,
      action: "delete",
      entityType: "document",
      entityId: id,
      changes: { deletedId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error deleting document:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al eliminar documento" }, { status: 500 });
  }
}
