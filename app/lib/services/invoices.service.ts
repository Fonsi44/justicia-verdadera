import { db } from "@/lib/db";
import { invoices, contacts, firms, invoiceItems } from "@/database/schema";
import { eq, and, desc, count, sql, isNull } from "drizzle-orm";
import { NotFoundError, ValidationError } from "@/lib/errors";

const DEFAULT_ISV_RATE = 15;

async function getFirmIsvRate(firmId: string): Promise<number> {
  const [firm] = await db
    .select({ isvRate: firms.isvRate })
    .from(firms)
    .where(eq(firms.id, firmId))
    .limit(1);

  return Number(firm?.isvRate ?? DEFAULT_ISV_RATE);
}

export interface InvoiceFilters {
  status?: string;
  clientId?: string;
  caseId?: string;
  page?: number;
  limit?: number;
}

export async function listInvoices(firmId: string, filters: InvoiceFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));

  const conditions = [eq(invoices.firmId, firmId), isNull(invoices.deletedAt)];

  if (filters.status) conditions.push(eq(invoices.status, filters.status as typeof invoices.status._.data));
  if (filters.clientId) conditions.push(eq(invoices.clientId, filters.clientId));
  if (filters.caseId) conditions.push(eq(invoices.caseId, filters.caseId));

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
      client: { id: contacts.id, firstName: contacts.firstName, lastName: contacts.lastName, companyName: contacts.companyName },
    })
    .from(invoices)
    .leftJoin(contacts, eq(invoices.clientId, contacts.id))
    .where(where)
    .orderBy(desc(invoices.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  const pendingResult = await db
    .select({ total: sql<string>`COALESCE(SUM(${invoices.total}), '0')` })
    .from(invoices)
    .where(and(eq(invoices.firmId, firmId), sql`${invoices.status} IN ('emitida', 'vencida')`, isNull(invoices.deletedAt)));

  return {
    data: rows,
    total: total.count,
    page,
    limit,
    totalPages: Math.ceil(total.count / limit),
    pendingAmount: pendingResult[0]?.total ?? "0",
  };
}

export interface CreateInvoiceItem {
  description: string;
  quantity?: string;
  unitPrice?: string;
}

export interface CreateInvoiceInput {
  caseId?: string;
  clientId: string;
  number: string;
  issueDate: string;
  dueDate: string;
  notes?: string;
  items?: CreateInvoiceItem[];
}

export async function createInvoice(firmId: string, input: CreateInvoiceInput) {
  const itemsData = input.items ?? [];
  const subtotal = itemsData.reduce(
    (acc, item) => acc + (Number(item.quantity ?? 1)) * (Number(item.unitPrice ?? 0)),
    0
  );

  const isvRate = await getFirmIsvRate(firmId);
  const tax = subtotal * (isvRate / 100);

  // ISR retention 12.5% for legal entities (persona_juridica)
  const [client] = await db
    .select({ type: contacts.type, identityNumber: contacts.identityNumber })
    .from(contacts)
    .where(eq(contacts.id, input.clientId))
    .limit(1);

  const isLegalEntity = client?.type === "persona_juridica" || client?.type === "institucion";
  const retencionIsr = isLegalEntity ? subtotal * 0.125 : 0;
  const total = subtotal + tax - retencionIsr;

  const [inv] = await db
    .insert(invoices)
    .values({
      firmId: firmId as string,
      caseId: input.caseId ?? null,
      clientId: input.clientId,
      number: input.number,
      subtotal: subtotal.toString(),
      tax: tax.toString(),
      total: total.toString(),
      retencionIsr: retencionIsr > 0 ? retencionIsr.toString() : null,
      rtnReceptor: client?.identityNumber ?? null,
      issueDate: input.issueDate,
      dueDate: input.dueDate,
      notes: input.notes ?? null,
    } as typeof invoices.$inferInsert)
    .returning();

  if (itemsData.length > 0) {
    await db.insert(invoiceItems).values(
      itemsData.map((item) => ({
        invoiceId: inv.id,
        description: item.description,
        quantity: item.quantity ?? "1",
        unitPrice: item.unitPrice ?? "0",
        total: (Number(item.quantity ?? "1") * Number(item.unitPrice ?? "0")).toString(),
      })) as typeof invoiceItems.$inferInsert[],
    );
  }

  return { inv, subtotal, tax, total, isvRate, retencionIsr };
}

export async function getInvoiceById(firmId: string, id: string) {
  const [inv] = await db
    .select({
      id: invoices.id, firmId: invoices.firmId, caseId: invoices.caseId,
      clientId: invoices.clientId, number: invoices.number, status: invoices.status,
      subtotal: invoices.subtotal, tax: invoices.tax, total: invoices.total,
      currency: invoices.currency, issueDate: invoices.issueDate, dueDate: invoices.dueDate,
      paidAt: invoices.paidAt, notes: invoices.notes, createdAt: invoices.createdAt,
      client: { id: contacts.id, firstName: contacts.firstName, lastName: contacts.lastName, companyName: contacts.companyName },
    })
    .from(invoices)
    .leftJoin(contacts, eq(invoices.clientId, contacts.id))
    .where(and(eq(invoices.id, id), eq(invoices.firmId, firmId), isNull(invoices.deletedAt)))
    .limit(1);

  if (!inv) throw new NotFoundError("Factura");

  const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id));

  return { ...inv, items };
}

export interface UpdateInvoiceInput {
  issueDate?: string;
  dueDate?: string;
  paidAt?: string;
  notes?: string;
  caseId?: string;
  clientId?: string;
  number?: string;
  status?: string;
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  borrador: ["emitida", "anulada"],
  emitida: ["pagada", "anulada", "vencida"],
  vencida: ["pagada", "anulada"],
  pagada: [],
  anulada: [],
};

export async function updateInvoice(firmId: string, id: string, input: UpdateInvoiceInput) {
  const allowedFields = ["issueDate", "dueDate", "paidAt", "notes", "caseId", "clientId", "number"];
  const updates: Record<string, unknown> = {};

  for (const key of allowedFields) {
    if ((input as Record<string, unknown>)[key] !== undefined) {
      updates[key] = (input as Record<string, unknown>)[key];
    }
  }

  if (input.status !== undefined) {
    const [current] = await db
      .select({ status: invoices.status })
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.firmId, firmId), isNull(invoices.deletedAt)))
      .limit(1);

    if (!current) throw new NotFoundError("Factura");

    const allowed = VALID_TRANSITIONS[current.status] ?? [];
    if (!allowed.includes(input.status)) {
      throw new ValidationError(
        `No se puede cambiar de "${current.status}" a "${input.status}"`
      );
    }

    updates.status = input.status;
  }

  const [inv] = await db
    .update(invoices)
    .set(updates)
    .where(and(eq(invoices.id, id), eq(invoices.firmId, firmId), isNull(invoices.deletedAt)))
    .returning();

  if (!inv) throw new NotFoundError("Factura");

  return inv;
}

export async function softDeleteInvoice(firmId: string, id: string) {
  const [inv] = await db
    .update(invoices)
    .set({ deletedAt: new Date() })
    .where(and(eq(invoices.id, id), eq(invoices.firmId, firmId), isNull(invoices.deletedAt)))
    .returning();

  if (!inv) throw new NotFoundError("Factura");

  return true;
}
