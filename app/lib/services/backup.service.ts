import { db } from "@/lib/db";
import {
  firms,
  users,
  cases,
  contacts,
  caseParties,
  caseEvents,
  documents,
  documentVersions,
  timeEntries,
  invoices,
  invoiceItems,
  aiUsage,
} from "@/database/schema";
import { eq, inArray, and, isNull } from "drizzle-orm";

export interface FirmExport {
  firm: typeof firms.$inferSelect | null;
  users: (typeof users.$inferSelect)[];
  cases: (typeof cases.$inferSelect)[];
  contacts: (typeof contacts.$inferSelect)[];
  caseParties: (typeof caseParties.$inferSelect)[];
  caseEvents: (typeof caseEvents.$inferSelect)[];
  documents: (typeof documents.$inferSelect)[];
  documentVersions: (typeof documentVersions.$inferSelect)[];
  timeEntries: (typeof timeEntries.$inferSelect)[];
  invoices: (typeof invoices.$inferSelect)[];
  invoiceItems: (typeof invoiceItems.$inferSelect)[];
  aiUsage: (typeof aiUsage.$inferSelect)[];
}

export async function exportFirmData(firmId: string): Promise<FirmExport> {
  const [firmData] = await db
    .select()
    .from(firms)
    .where(eq(firms.id, firmId))
    .limit(1);

  const [usersData, casesData, contactsData, documentsData, invoicesData, aiUsageData] =
    await Promise.all([
      db.select().from(users).where(eq(users.firmId, firmId)),
      db.select().from(cases).where(and(eq(cases.firmId, firmId), isNull(cases.deletedAt))),
      db.select().from(contacts).where(and(eq(contacts.firmId, firmId), isNull(contacts.deletedAt))),
      db.select().from(documents).where(and(eq(documents.firmId, firmId), isNull(documents.deletedAt))),
      db.select().from(invoices).where(and(eq(invoices.firmId, firmId), isNull(invoices.deletedAt))),
      db.select().from(aiUsage).where(eq(aiUsage.firmId, firmId)),
    ]);

  const caseIds = casesData.map((c) => c.id);
  const documentIds = documentsData.map((d) => d.id);
  const invoiceIds = invoicesData.map((i) => i.id);

  const [casePartiesData, caseEventsData, timeEntriesData, documentVersionsData, invoiceItemsData] =
    await Promise.all([
      caseIds.length > 0
        ? db.select().from(caseParties).where(inArray(caseParties.caseId, caseIds))
        : [],
      caseIds.length > 0
        ? db.select().from(caseEvents).where(inArray(caseEvents.caseId, caseIds))
        : [],
      caseIds.length > 0
        ? db.select().from(timeEntries).where(inArray(timeEntries.caseId, caseIds))
        : [],
      documentIds.length > 0
        ? db.select().from(documentVersions).where(inArray(documentVersions.documentId, documentIds))
        : [],
      invoiceIds.length > 0
        ? db.select().from(invoiceItems).where(inArray(invoiceItems.invoiceId, invoiceIds))
        : [],
    ]);

  return {
    firm: firmData ?? null,
    users: usersData,
    cases: casesData,
    contacts: contactsData,
    caseParties: casePartiesData,
    caseEvents: caseEventsData,
    documents: documentsData,
    documentVersions: documentVersionsData,
    timeEntries: timeEntriesData,
    invoices: invoicesData,
    invoiceItems: invoiceItemsData,
    aiUsage: aiUsageData,
  };
}

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowsToCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const header = columns.map((c) => escapeCsvValue(c)).join(",");
  const data = rows.map((row) =>
    columns.map((col) => escapeCsvValue(row[col])).join(","),
  );
  return [header, ...data].join("\r\n");
}

const CASE_COLUMNS = [
  "id", "number", "courtNumber", "title", "description", "matter",
  "status", "priority", "assignedLawyerId", "startDate", "endDate",
  "estimatedValue", "metadata", "createdAt", "updatedAt",
];

const CONTACT_COLUMNS = [
  "id", "type", "firstName", "lastName", "companyName", "identityNumber",
  "email", "phone", "address", "notes", "createdAt", "updatedAt",
];

const DOCUMENT_COLUMNS = [
  "id", "caseId", "name", "type", "currentVersion", "status",
  "processingStatus", "ocrConfidence", "createdBy", "createdAt", "updatedAt",
];

const INVOICE_COLUMNS = [
  "id", "caseId", "clientId", "number", "status", "subtotal", "tax",
  "total", "currency", "issueDate", "dueDate", "notes", "cai", "estadoSar",
  "retencionIsr", "createdAt",
];

const ENTITY_COLUMNS: Record<string, string[]> = {
  cases: CASE_COLUMNS,
  contacts: CONTACT_COLUMNS,
  documents: DOCUMENT_COLUMNS,
  invoices: INVOICE_COLUMNS,
};

export async function exportFirmCsv(firmId: string, entityType: string): Promise<string> {
  const columns = ENTITY_COLUMNS[entityType];
  if (!columns) {
    throw new Error(`Tipo de entidad no soportado: ${entityType}. Use: cases, contacts, documents, invoices`);
  }

  let rows: Record<string, unknown>[];

  switch (entityType) {
    case "cases":
      rows = await db
        .select()
        .from(cases)
        .where(and(eq(cases.firmId, firmId), isNull(cases.deletedAt)));
      break;
    case "contacts":
      rows = await db
        .select()
        .from(contacts)
        .where(and(eq(contacts.firmId, firmId), isNull(contacts.deletedAt)));
      break;
    case "documents":
      rows = await db
        .select()
        .from(documents)
        .where(and(eq(documents.firmId, firmId), isNull(documents.deletedAt)));
      break;
    case "invoices":
      rows = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.firmId, firmId), isNull(invoices.deletedAt)));
      break;
    default:
      throw new Error(`Tipo de entidad no soportado: ${entityType}`);
  }

  return rowsToCsv(rows, columns);
}
