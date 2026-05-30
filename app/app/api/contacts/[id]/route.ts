import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { caseParties, cases } from "@/database/schema";
import { getFirmId, handleUnauthorized } from "@/lib/auth/require-auth";
import { eq, and, desc } from "drizzle-orm";
import { checkRateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { getContactById, updateContact, softDeleteContact } from "@/lib/services/contacts.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const firmId = await getFirmId();
    const contact = await getContactById(firmId, id);

    const relatedCases = await db
      .select({
        caseId: cases.id,
        caseNumber: cases.number,
        caseTitle: cases.title,
        matter: cases.matter,
        status: cases.status,
        role: caseParties.role,
        isMain: caseParties.isMain,
      })
      .from(caseParties)
      .innerJoin(cases, eq(caseParties.caseId, cases.id))
      .where(and(eq(caseParties.contactId, id), eq(cases.firmId, firmId)))
      .orderBy(desc(cases.createdAt));

    return NextResponse.json({ data: contact, relatedCases });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error fetching contact:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al obtener contacto" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const firmId = await getFirmId();

    const rateCheck = await checkRateLimit("api", firmId);
    if (rateCheck instanceof NextResponse) return rateCheck;

    const body = await request.json();

    const updates: Record<string, unknown> = {};
    const allowedFields = [
      "type", "firstName", "lastName", "companyName",
      "identityNumber", "email", "phone", "address", "notes",
    ];
    for (const field of allowedFields) {
      if (field in body) updates[field] = body[field] ?? null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No hay campos para actualizar" }, { status: 400 });
    }

    const updated = await updateContact(firmId, id, updates);

    await writeAuditLog({
      firmId,
      action: "update",
      entityType: "contact",
      entityId: id,
      changes: updates,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error updating contact:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al actualizar contacto" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const firmId = await getFirmId();

    const rateCheck = await checkRateLimit("api", firmId);
    if (rateCheck instanceof NextResponse) return rateCheck;

    await softDeleteContact(firmId, id, { checkInvoices: true });

    await writeAuditLog({
      firmId,
      action: "delete",
      entityType: "contact",
      entityId: id,
      changes: { deletedId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error deleting contact:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al eliminar contacto" }, { status: 500 });
  }
}
