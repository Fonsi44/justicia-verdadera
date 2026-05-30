import { db } from "@/lib/db";
import { portalTokens, cases, caseParties, contacts, documents, firms } from "@/database/schema";
import { eq, and, isNull, desc, inArray, gt } from "drizzle-orm";

export async function generateAccessToken(contactId: string, firmId: string): Promise<string> {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(portalTokens).values({
    contactId,
    firmId,
    token,
    expiresAt,
    isActive: true,
  });

  return token;
}

export async function validateAccessToken(token: string) {
  const [record] = await db
    .select()
    .from(portalTokens)
    .where(and(eq(portalTokens.token, token), eq(portalTokens.isActive, true), gt(portalTokens.expiresAt, new Date())))
    .limit(1);

  if (!record) return null;

  return record;
}

export async function markTokenUsed(id: string) {
  await db
    .update(portalTokens)
    .set({ lastLoginAt: new Date() })
    .where(eq(portalTokens.id, id));
}

export async function getClientCases(contactId: string, firmId: string) {
  const partyRows = await db
    .select({ caseId: caseParties.caseId })
    .from(caseParties)
    .where(and(eq(caseParties.contactId, contactId), eq(caseParties.role, "cliente")));

  if (partyRows.length === 0) return [];

  const caseIds = partyRows.map((r) => r.caseId);

  const rows = await db
    .select({
      id: cases.id,
      number: cases.number,
      title: cases.title,
      matter: cases.matter,
      status: cases.status,
      updatedAt: cases.updatedAt,
    })
    .from(cases)
    .where(and(inArray(cases.id, caseIds), eq(cases.firmId, firmId), isNull(cases.deletedAt)))
    .orderBy(desc(cases.updatedAt));

  return rows;
}

export async function getClientDocuments(contactId: string, firmId: string) {
  const partyRows = await db
    .select({ caseId: caseParties.caseId })
    .from(caseParties)
    .where(and(eq(caseParties.contactId, contactId), eq(caseParties.role, "cliente")));

  if (partyRows.length === 0) return [];

  const caseIds = partyRows.map((r) => r.caseId);

  const rows = await db
    .select({
      id: documents.id,
      name: documents.name,
      type: documents.type,
      status: documents.status,
      createdAt: documents.createdAt,
      caseId: documents.caseId,
      case: { number: cases.number, title: cases.title },
    })
    .from(documents)
    .leftJoin(cases, eq(documents.caseId, cases.id))
    .where(
      and(
        inArray(documents.caseId, caseIds),
        eq(documents.firmId, firmId),
        eq(documents.sharedWithClient, true),
        isNull(documents.deletedAt),
      ),
    )
    .orderBy(desc(documents.createdAt));

  return rows;
}

export async function findContactByEmail(email: string) {
  const [contact] = await db
    .select({
      id: contacts.id,
      firmId: contacts.firmId,
      firstName: contacts.firstName,
      lastName: contacts.lastName,
      email: contacts.email,
      firm: { name: firms.name },
    })
    .from(contacts)
    .leftJoin(firms, eq(contacts.firmId, firms.id))
    .where(and(eq(contacts.email, email), isNull(contacts.deletedAt)))
    .limit(1);

  return contact ?? null;
}
