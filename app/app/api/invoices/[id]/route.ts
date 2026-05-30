import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices, contacts, invoiceItems } from "@/database/schema";
import { getFirmId } from "@/lib/auth/require-auth";
import { eq, and } from "drizzle-orm";
import { checkRateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const firmId = await getFirmId();
    const { id } = await params;

    const [inv] = await db
      .select({
        id: invoices.id,
        firmId: invoices.firmId,
        caseId: invoices.caseId,
        clientId: invoices.clientId,
        number: invoices.number,
        status: invoices.status,
        subtotal: invoices.subtotal,
        tax: invoices.tax,
        total: invoices.total,
        currency: invoices.currency,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        paidAt: invoices.paidAt,
        notes: invoices.notes,
        createdAt: invoices.createdAt,
        client: {
          id: contacts.id,
          firstName: contacts.firstName,
          lastName: contacts.lastName,
          companyName: contacts.companyName,
        },
      })
      .from(invoices)
      .leftJoin(contacts, eq(invoices.clientId, contacts.id))
      .where(and(eq(invoices.id, id), eq(invoices.firmId, firmId)))
      .limit(1);

    if (!inv) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
    }

    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, id));

    return NextResponse.json({ data: { ...inv, items } });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json({ error: "Error al obtener factura" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const firmId = await getFirmId();
    const { id } = await params;

    const rateCheck = await checkRateLimit("api", firmId);
    if (rateCheck instanceof NextResponse) return rateCheck;

    const body = await req.json();

    const allowedFields = [
      "issueDate", "dueDate", "paidAt", "notes", "caseId", "clientId", "number",
    ];
    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    if (body.status !== undefined) {
      const validTransitions: Record<string, string[]> = {
        borrador: ["emitida", "anulada"],
        emitida: ["pagada", "anulada", "vencida"],
        vencida: ["pagada", "anulada"],
        pagada: [],
        anulada: [],
      };

      const [current] = await db
        .select({ status: invoices.status })
        .from(invoices)
        .where(and(eq(invoices.id, id), eq(invoices.firmId, firmId)))
        .limit(1);

      if (!current) {
        return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
      }

      const allowed = validTransitions[current.status] ?? [];
      if (!allowed.includes(body.status as string)) {
        return NextResponse.json(
          { error: `No se puede cambiar de "${current.status}" a "${body.status}"` },
          { status: 422 }
        );
      }

      updates.status = body.status;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No hay campos para actualizar" }, { status: 400 });
    }

    const [inv] = await db
      .update(invoices)
      .set(updates)
      .where(and(eq(invoices.id, id), eq(invoices.firmId, firmId)))
      .returning();

    if (!inv) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
    }

    await writeAuditLog({
      firmId,
      action: "update",
      entityType: "invoice",
      entityId: id,
      changes: updates,
    });

    return NextResponse.json({ data: inv });
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json({ error: "Error al actualizar factura" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const firmId = await getFirmId();
    const { id } = await params;

    const rateCheck = await checkRateLimit("api", firmId);
    if (rateCheck instanceof NextResponse) return rateCheck;

    const [inv] = await db
      .delete(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.firmId, firmId)))
      .returning();

    if (!inv) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
    }

    await writeAuditLog({
      firmId,
      action: "delete",
      entityType: "invoice",
      entityId: id,
      changes: { deletedId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json({ error: "Error al eliminar factura" }, { status: 500 });
  }
}
