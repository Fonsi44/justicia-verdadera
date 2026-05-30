import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices, contacts, invoiceItems } from "@/database/schema";
import { getFirmId } from "@/lib/auth/require-auth";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { checkRateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const firmId = await getFirmId();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");
    const caseId = searchParams.get("caseId");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));

    const conditions = [eq(invoices.firmId, firmId)];
    if (status) conditions.push(eq(invoices.status, status as typeof invoices.status._.data));
    if (clientId) conditions.push(eq(invoices.clientId, clientId));
    if (caseId) conditions.push(eq(invoices.caseId, caseId));

    const where = and(...conditions);

    const [total] = await db.select({ count: count() }).from(invoices).where(where);
    const rows = await db
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
      .where(where)
      .orderBy(desc(invoices.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    const pendingResult = await db
      .select({
        total: sql<string>`COALESCE(SUM(${invoices.total}), '0')`,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.firmId, firmId),
          sql`${invoices.status} IN ('emitida', 'vencida')`
        )
      );

    return NextResponse.json({
      data: rows,
      total: total.count,
      page,
      limit,
      totalPages: Math.ceil(total.count / limit),
      pendingAmount: pendingResult[0]?.total ?? "0",
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json({ error: "Error al obtener facturas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const firmId = await getFirmId();

    const rateCheck = await checkRateLimit("api", firmId);
    if (rateCheck instanceof NextResponse) return rateCheck;

    const body = await req.json();
    const { caseId, clientId, number, issueDate, dueDate, notes, items } = body;

    if (!clientId || !number || !issueDate || !dueDate) {
      return NextResponse.json(
        { error: "clientId, number, issueDate y dueDate son requeridos" },
        { status: 400 }
      );
    }

    const itemsData = items ?? [];
    const subtotal = itemsData.reduce(
      (acc: number, item: { quantity: number; unitPrice: number }) =>
        acc + (item.quantity ?? 1) * (item.unitPrice ?? 0),
      0
    );
    const tax = subtotal * 0.15;
    const total = subtotal + tax;

    const [inv] = await db
      .insert(invoices)
      .values({
        firmId,
        caseId: caseId ?? null,
        clientId,
        number,
        subtotal: subtotal.toString(),
        tax: tax.toString(),
        total: total.toString(),
        issueDate,
        dueDate,
        notes: notes ?? null,
      })
      .returning();

    if (itemsData.length > 0) {
      await db.insert(invoiceItems).values(
        itemsData.map((item: { description: string; quantity?: string; unitPrice?: string }) => ({
          invoiceId: inv.id,
          description: item.description,
          quantity: item.quantity ?? "1",
          unitPrice: item.unitPrice ?? "0",
          total: (
            (parseFloat(item.quantity ?? "1") * parseFloat(item.unitPrice ?? "0"))
          ).toString(),
        }))
      );
    }

    await writeAuditLog({
      firmId,
      action: "create",
      entityType: "invoice",
      entityId: inv.id,
      changes: { clientId, number, subtotal, tax, total },
    });

    return NextResponse.json({ data: inv }, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json({ error: "Error al crear factura" }, { status: 500 });
  }
}
