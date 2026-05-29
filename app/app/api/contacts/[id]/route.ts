import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contacts, caseParties, cases, invoices } from "@/database/schema";
import { getFirmId } from "@/lib/auth/require-auth";
import { eq, and, count, desc } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const firmId = await getFirmId();

  const [contact] = await db
    .select()
    .from(contacts)
    .where(and(eq(contacts.id, id), eq(contacts.firmId, firmId)))
    .limit(1);

  if (!contact) {
    return NextResponse.json({ error: "Contacto no encontrado" }, { status: 404 });
  }

  const [{ value: caseCount }] = await db
    .select({ value: count() })
    .from(caseParties)
    .where(eq(caseParties.contactId, id));

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

  return NextResponse.json({
    data: { ...contact, caseCount },
    relatedCases,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const firmId = await getFirmId();
  const body = await request.json();

  const [existing] = await db
    .select({ id: contacts.id })
    .from(contacts)
    .where(and(eq(contacts.id, id), eq(contacts.firmId, firmId)))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Contacto no encontrado" }, { status: 404 });
  }

  const allowedFields = [
    "type", "firstName", "lastName", "companyName",
    "identityNumber", "email", "phone", "address", "notes",
  ];

  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field] ?? null;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No hay campos para actualizar" }, { status: 400 });
  }

  const [updated] = await db
    .update(contacts)
    .set(updates)
    .where(eq(contacts.id, id))
    .returning();

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const firmId = await getFirmId();

  const [existing] = await db
    .select({ id: contacts.id })
    .from(contacts)
    .where(and(eq(contacts.id, id), eq(contacts.firmId, firmId)))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Contacto no encontrado" }, { status: 404 });
  }

  const [linkedInvoice] = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(and(eq(invoices.clientId, id), eq(invoices.firmId, firmId)))
    .limit(1);

  if (linkedInvoice) {
    return NextResponse.json(
      { error: "No se puede eliminar el contacto porque tiene facturas vinculadas" },
      { status: 409 }
    );
  }

  await db.delete(caseParties).where(eq(caseParties.contactId, id));
  await db.delete(contacts).where(eq(contacts.id, id));

  return NextResponse.json({ success: true });
}
