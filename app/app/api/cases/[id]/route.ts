import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionAPI, handleUnauthorized } from "@/lib/auth/require-auth";
import { cases, caseParties, users, contacts } from "@/database/schema";
import { eq, and } from "drizzle-orm";
import { checkRateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let session;
  try {
    session = await getSessionAPI();
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    throw error;
  }

  const [caseData] = await db
    .select({
      id: cases.id,
      firmId: cases.firmId,
      number: cases.number,
      courtNumber: cases.courtNumber,
      title: cases.title,
      description: cases.description,
      matter: cases.matter,
      status: cases.status,
      priority: cases.priority,
      assignedLawyerId: cases.assignedLawyerId,
      assignedLawyer: { id: users.id, name: users.name },
      startDate: cases.startDate,
      endDate: cases.endDate,
      estimatedValue: cases.estimatedValue,
      metadata: cases.metadata,
      createdAt: cases.createdAt,
      updatedAt: cases.updatedAt,
    })
    .from(cases)
    .leftJoin(users, eq(cases.assignedLawyerId, users.id))
    .where(and(eq(cases.id, id), eq(cases.firmId, session.user.firmId)))
    .limit(1);

  if (!caseData) {
    return Response.json({ error: "Caso no encontrado" }, { status: 404 });
  }

  const parties = await db
    .select()
    .from(caseParties)
    .leftJoin(contacts, eq(caseParties.contactId, contacts.id))
    .where(eq(caseParties.caseId, id));

  return Response.json({ ...caseData, parties });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let session;
  try {
    session = await getSessionAPI();
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    throw error;
  }
  const firmId = session.user.firmId;

  const rateCheck = await checkRateLimit("api", firmId);
  if (rateCheck instanceof NextResponse) return rateCheck;

  const body = await request.json();

  const [existing] = await db
    .select({ id: cases.id, firmId: cases.firmId })
    .from(cases)
    .where(and(eq(cases.id, id), eq(cases.firmId, firmId)))
    .limit(1);

  if (!existing) {
    return Response.json({ error: "Caso no encontrado" }, { status: 404 });
  }

  const allowedFields = [
    "number",
    "courtNumber",
    "title",
    "description",
    "matter",
    "status",
    "priority",
    "assignedLawyerId",
    "startDate",
    "endDate",
    "estimatedValue",
    "metadata",
  ];

  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) updates[field] = body[field];
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No hay campos para actualizar" }, { status: 400 });
  }

  const [updated] = await db
    .update(cases)
    .set(updates)
    .where(eq(cases.id, id))
    .returning();

  await writeAuditLog({
    firmId,
    action: "update",
    entityType: "case",
    entityId: id,
    changes: updates,
  });

  return Response.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let session;
  try {
    session = await getSessionAPI();
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    throw error;
  }
  const firmId = session.user.firmId;

  const rateCheck = await checkRateLimit("api", firmId);
  if (rateCheck instanceof NextResponse) return rateCheck;

  const [existing] = await db
    .select({ id: cases.id, firmId: cases.firmId })
    .from(cases)
    .where(and(eq(cases.id, id), eq(cases.firmId, firmId)))
    .limit(1);

  if (!existing) {
    return Response.json({ error: "Caso no encontrado" }, { status: 404 });
  }

  if (!["owner", "admin"].includes(session.user.role)) {
    return Response.json(
      { error: "Solo administradores pueden eliminar casos" },
      { status: 403 },
    );
  }

  await db.delete(cases).where(eq(cases.id, id));

  await writeAuditLog({
    firmId,
    action: "delete",
    entityType: "case",
    entityId: id,
    changes: { deletedId: id },
  });

  return Response.json({ success: true });
}
