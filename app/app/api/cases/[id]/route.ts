import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { caseParties, contacts } from "@/database/schema";
import { getSession, handleUnauthorized } from "@/lib/auth/require-auth";
import { eq } from "drizzle-orm";
import { checkRateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { getCaseById, updateCase, softDeleteCase } from "@/lib/services/cases.service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSession();
    const caseData = await getCaseById(session.user.firmId, id);

    const parties = await db
      .select()
      .from(caseParties)
      .leftJoin(contacts, eq(caseParties.contactId, contacts.id))
      .where(eq(caseParties.caseId, id));

    return Response.json({ ...caseData, parties });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error fetching case:", error instanceof Error ? error.message : error);
    return Response.json({ error: "Error al obtener caso" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSession();
    const firmId = session.user.firmId;

    const rateCheck = await checkRateLimit("api", firmId);
    if (rateCheck instanceof NextResponse) return rateCheck;

    const body = await request.json();

    const allowedFields = [
      "number", "courtNumber", "title", "description", "matter",
      "status", "priority", "assignedLawyerId", "startDate", "endDate",
      "estimatedValue", "metadata",
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) updates[field] = body[field];
    }

    if (Object.keys(updates).length === 0) {
      return Response.json({ error: "No hay campos para actualizar" }, { status: 400 });
    }

    const updated = await updateCase(firmId, id, updates);

    await writeAuditLog({
      firmId,
      action: "update",
      entityType: "case",
      entityId: id,
      changes: updates,
    });

    return Response.json(updated);
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error updating case:", error instanceof Error ? error.message : error);
    return Response.json({ error: "Error al actualizar caso" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSession();
    const firmId = session.user.firmId;

    const rateCheck = await checkRateLimit("api", firmId);
    if (rateCheck instanceof NextResponse) return rateCheck;

    if (!["owner", "admin"].includes(session.user.role)) {
      return Response.json(
        { error: "Solo administradores pueden eliminar casos" },
        { status: 403 },
      );
    }

    await softDeleteCase(firmId, id);

    await writeAuditLog({
      firmId,
      action: "delete",
      entityType: "case",
      entityId: id,
      changes: { deletedId: id },
    });

    return Response.json({ success: true });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error deleting case:", error instanceof Error ? error.message : error);
    return Response.json({ error: "Error al eliminar caso" }, { status: 500 });
  }
}
