import { db } from "@/lib/db";
import { cases, caseEvents, invoices, contacts, documents, timeEntries, firms } from "@/database/schema";
import { eq, and, gte, lte, desc, count, sql } from "drizzle-orm";

export interface DashboardStats {
  activeCases: number;
  upcomingEvents: number;
  pendingInvoices: number;
  pendingAmount: string;
  billableHours: number;
  totalContacts: number;
  totalDocuments: number;
  recentCases: unknown[];
  upcomingDeadlines: unknown[];
  casesByMatter: Array<{ name: string; value: number }>;
  monthlyActivity: Array<{ name: string; casos: number; docs: number }>;
  currentSpending: string;
  spendingLimit: string;
  isvRate: number;
}

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export async function getDashboardStats(firmId: string): Promise<DashboardStats> {
  const now = new Date();
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    [activeCasesResult],
    [upcomingEventsResult],
    [pendingInvoicesResult],
    [totalContactsResult],
    [totalDocumentsResult],
    [billableResult],
    recentCases,
    upcomingDeadlines,
    casesByMatterResult,
    caseActivity,
    docActivity,
    [firmResult],
  ] = await Promise.all([
    db.select({ count: count() }).from(cases).where(and(eq(cases.firmId, firmId), eq(cases.status, "activo"))),
    db.select({ count: count() }).from(caseEvents).innerJoin(cases, eq(caseEvents.caseId, cases.id)).where(
      and(eq(cases.firmId, firmId), gte(caseEvents.date, now), lte(caseEvents.date, sevenDays), eq(caseEvents.isCompleted, false))
    ),
    db.select({ count: count(), total: sql<string>`COALESCE(SUM(${invoices.total}), '0')` }).from(invoices).where(
      and(eq(invoices.firmId, firmId), sql`${invoices.status} IN ('emitida', 'vencida')`)
    ),
    db.select({ count: count() }).from(contacts).where(eq(contacts.firmId, firmId)),
    db.select({ count: count() }).from(documents).where(eq(documents.firmId, firmId)),
    db.select({ total: sql<string>`COALESCE(SUM(${timeEntries.durationMinutes}), '0')` }).from(timeEntries)
      .innerJoin(cases, eq(timeEntries.caseId, cases.id))
      .where(and(eq(cases.firmId, firmId), eq(timeEntries.isBillable, true), eq(timeEntries.isInvoiced, false))),
    db.select().from(cases).where(eq(cases.firmId, firmId)).orderBy(desc(cases.createdAt)).limit(5),
    db.select({
      id: caseEvents.id, caseId: caseEvents.caseId, type: caseEvents.type, title: caseEvents.title,
      description: caseEvents.description, date: caseEvents.date, endDate: caseEvents.endDate, location: caseEvents.location,
    }).from(caseEvents).innerJoin(cases, eq(caseEvents.caseId, cases.id))
      .where(and(eq(cases.firmId, firmId), gte(caseEvents.date, now), eq(caseEvents.isCompleted, false)))
      .orderBy(caseEvents.date).limit(5),
    db.select({ name: cases.matter, value: count() }).from(cases).where(eq(cases.firmId, firmId)).groupBy(cases.matter),
    db.select({ month: sql<string>`to_char(${cases.createdAt}, 'Mon')`, casos: count() }).from(cases)
      .where(and(eq(cases.firmId, firmId), gte(cases.createdAt, new Date(Date.now() - 180 * 24 * 60 * 60 * 1000))))
      .groupBy(sql`to_char(${cases.createdAt}, 'Mon')`),
    db.select({ month: sql<string>`to_char(${documents.createdAt}, 'Mon')`, docs: count() }).from(documents)
      .where(and(eq(documents.firmId, firmId), gte(documents.createdAt, new Date(Date.now() - 180 * 24 * 60 * 60 * 1000))))
      .groupBy(sql`to_char(${documents.createdAt}, 'Mon')`),
    db.select({ settings: firms.settings, isvRate: firms.isvRate }).from(firms).where(eq(firms.id, firmId)).limit(1),
  ]);

  const caseMonthMap = new Map((caseActivity || []).map((r) => [r.month, Number(r.casos)]));
  const docMonthMap = new Map((docActivity || []).map((r) => [r.month, Number(r.docs)]));

  return {
    activeCases: Number(activeCasesResult?.count ?? 0),
    upcomingEvents: Number(upcomingEventsResult?.count ?? 0),
    pendingInvoices: Number(pendingInvoicesResult?.count ?? 0),
    pendingAmount: (pendingInvoicesResult as { count: number; total: string } | undefined)?.total ?? "0",
    billableHours: Math.round(Number(billableResult?.total ?? 0) / 60),
    totalContacts: Number(totalContactsResult?.count ?? 0),
    totalDocuments: Number(totalDocumentsResult?.count ?? 0),
    recentCases,
    upcomingDeadlines,
    casesByMatter: (casesByMatterResult || []).map((r) => ({ name: r.name, value: Number(r.value) })),
    monthlyActivity: MONTHS.map((m) => ({
      name: m,
      casos: Number(caseMonthMap.get(m) ?? 0),
      docs: Number(docMonthMap.get(m) ?? 0),
    })),
    currentSpending: "0",
    spendingLimit: (firmResult?.settings as { spendingLimit?: string } | null)?.spendingLimit ?? "0",
    isvRate: Number(firmResult?.isvRate ?? 15),
  };
}
