import { db } from "@/lib/db";
import { contacts, caseParties, invoices } from "@/database/schema";
import { eq, and, or, ilike, count, desc, inArray, isNull, type SQL } from "drizzle-orm";
import { NotFoundError, ConflictError } from "@/lib/errors";

export interface ContactFilters {
  search?: string;
  type?: string;
  page?: number;
  limit?: number;
}

const VALID_TYPES = ["persona_natural", "persona_juridica", "institucion"] as const;

export async function listContacts(firmId: string, filters: ContactFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
  const offset = (page - 1) * limit;

  const conditions: (SQL<unknown> | undefined)[] = [eq(contacts.firmId, firmId), isNull(contacts.deletedAt)];

  if (filters.type && VALID_TYPES.includes(filters.type as typeof VALID_TYPES[number])) {
    conditions.push(eq(contacts.type, filters.type as typeof contacts.type._.data));
  }
  if (filters.search) {
    conditions.push(
      or(
        ilike(contacts.firstName, `%${filters.search}%`),
        ilike(contacts.lastName, `%${filters.search}%`),
        ilike(contacts.companyName, `%${filters.search}%`),
        ilike(contacts.email, `%${filters.search}%`),
        ilike(contacts.identityNumber, `%${filters.search}%`),
      ),
    );
  }

  const where = and(...conditions);

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(contacts)
    .where(where);

  const items = await db
    .select()
    .from(contacts)
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(contacts.createdAt));

  const contactIds = items.map((c) => c.id);
  const counts =
    contactIds.length > 0
      ? await db
          .select({ contactId: caseParties.contactId, value: count() })
          .from(caseParties)
          .where(inArray(caseParties.contactId, contactIds))
          .groupBy(caseParties.contactId)
      : [];

  const countMap = new Map(counts.map((c) => [c.contactId, c.value]));

  const data = items.map((c) => ({
    ...c,
    caseCount: countMap.get(c.id) ?? 0,
  }));

  return { data, total, page, limit };
}

export interface CreateContactInput {
  type: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  identityNumber?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export async function createContact(firmId: string, input: CreateContactInput) {
  const [contact] = await db
    .insert(contacts)
    .values({
      firmId: firmId as string,
      type: input.type,
      firstName: input.firstName ?? null,
      lastName: input.lastName ?? null,
      companyName: input.companyName ?? null,
      identityNumber: input.identityNumber ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      address: input.address ?? null,
      notes: input.notes ?? null,
    } as typeof contacts.$inferInsert)
    .returning();

  return { ...contact, caseCount: 0 };
}

export async function getContactById(firmId: string, id: string) {
  const [contact] = await db
    .select()
    .from(contacts)
    .where(and(eq(contacts.id, id), eq(contacts.firmId, firmId), isNull(contacts.deletedAt)))
    .limit(1);

  if (!contact) throw new NotFoundError("Contacto");

  const [{ value: caseCount }] = await db
    .select({ value: count() })
    .from(caseParties)
    .where(eq(caseParties.contactId, id));

  return { ...contact, caseCount };
}

export interface UpdateContactInput {
  type?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  identityNumber?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export async function updateContact(firmId: string, id: string, input: UpdateContactInput) {
  const [existing] = await db
    .select({ id: contacts.id })
    .from(contacts)
    .where(and(eq(contacts.id, id), eq(contacts.firmId, firmId), isNull(contacts.deletedAt)))
    .limit(1);

  if (!existing) throw new NotFoundError("Contacto");

  const allowedFields = [
    "type", "firstName", "lastName", "companyName",
    "identityNumber", "email", "phone", "address", "notes",
  ];

  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in input) updates[field] = (input as Record<string, unknown>)[field] ?? null;
  }

  const [updated] = await db
    .update(contacts)
    .set(updates)
    .where(eq(contacts.id, id))
    .returning();

  return updated;
}

export async function softDeleteContact(
  firmId: string,
  id: string,
  opts?: { checkInvoices?: boolean }
) {
  const [existing] = await db
    .select({ id: contacts.id })
    .from(contacts)
    .where(and(eq(contacts.id, id), eq(contacts.firmId, firmId), isNull(contacts.deletedAt)))
    .limit(1);

  if (!existing) throw new NotFoundError("Contacto");

  if (opts?.checkInvoices) {
    const [linked] = await db
      .select({ id: invoices.id })
      .from(invoices)
      .where(and(eq(invoices.clientId, id), eq(invoices.firmId, firmId)))
      .limit(1);

    if (linked) {
      throw new ConflictError(
        "No se puede eliminar el contacto porque tiene facturas vinculadas"
      );
    }
  }

  await db.delete(caseParties).where(eq(caseParties.contactId, id));
  await db
    .update(contacts)
    .set({ deletedAt: new Date() })
    .where(eq(contacts.id, id));

  return true;
}
