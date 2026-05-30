import { db } from "@/lib/db";
import { caseEvents, cases } from "@/database/schema";
import { eq, and, gte, lte, asc, count } from "drizzle-orm";
import { NotFoundError } from "@/lib/errors";

export interface EventFilters {
  caseId?: string;
  type?: string;
  from?: string;
  to?: string;
  upcoming?: string;
  page?: number;
  limit?: number;
}

export async function listEvents(firmId: string, filters: EventFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 50));
  const offset = (page - 1) * limit;

  const conditions = [eq(cases.firmId, firmId)];

  if (filters.caseId) conditions.push(eq(caseEvents.caseId, filters.caseId));
  if (filters.type) conditions.push(eq(caseEvents.type, filters.type as typeof caseEvents.type._.data));
  if (filters.from) conditions.push(gte(caseEvents.date, new Date(filters.from)));
  if (filters.to) conditions.push(lte(caseEvents.date, new Date(filters.to)));
  if (filters.upcoming === "true") {
    conditions.push(gte(caseEvents.date, new Date()));
    conditions.push(eq(caseEvents.isCompleted, false));
  }

  const where = and(...conditions);

  const [rows, [{ count: total }]] = await Promise.all([
    db
      .select({
        id: caseEvents.id,
        caseId: caseEvents.caseId,
        type: caseEvents.type,
        title: caseEvents.title,
        description: caseEvents.description,
        date: caseEvents.date,
        endDate: caseEvents.endDate,
        location: caseEvents.location,
        isCompleted: caseEvents.isCompleted,
        notifiedAt: caseEvents.notifiedAt,
        createdBy: caseEvents.createdBy,
        createdAt: caseEvents.createdAt,
        case: { id: cases.id, number: cases.number, title: cases.title },
      })
      .from(caseEvents)
      .innerJoin(cases, eq(caseEvents.caseId, cases.id))
      .where(where)
      .orderBy(asc(caseEvents.date))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(caseEvents).innerJoin(cases, eq(caseEvents.caseId, cases.id)).where(where),
  ]);

  return {
    data: rows,
    total: Number(total),
    page,
    limit,
    totalPages: Math.ceil(Number(total) / limit),
  };
}

export interface CreateEventInput {
  caseId: string;
  type: string;
  title: string;
  description?: string;
  date: string;
  endDate?: string;
  location?: string;
}

export async function createEvent(firmId: string, input: CreateEventInput) {
  const [caseExists] = await db
    .select({ id: cases.id })
    .from(cases)
    .where(and(eq(cases.id, input.caseId), eq(cases.firmId, firmId)))
    .limit(1);

  if (!caseExists) throw new NotFoundError("Caso");

  const [event] = await db
    .insert(caseEvents)
    .values({
      caseId: input.caseId as string,
      type: input.type,
      title: input.title,
      description: input.description ?? null,
      date: new Date(input.date),
      endDate: input.endDate ? new Date(input.endDate) : null,
      location: input.location ?? null,
    } as typeof caseEvents.$inferInsert)
    .returning();

  return event;
}

export async function getEventById(firmId: string, id: string) {
  const [event] = await db
    .select({
      id: caseEvents.id,
      caseId: caseEvents.caseId,
      type: caseEvents.type,
      title: caseEvents.title,
      description: caseEvents.description,
      date: caseEvents.date,
      endDate: caseEvents.endDate,
      location: caseEvents.location,
      isCompleted: caseEvents.isCompleted,
      notifiedAt: caseEvents.notifiedAt,
      createdBy: caseEvents.createdBy,
      createdAt: caseEvents.createdAt,
      googleEventId: caseEvents.googleEventId,
      case: { id: cases.id, number: cases.number, title: cases.title },
    })
    .from(caseEvents)
    .innerJoin(cases, eq(caseEvents.caseId, cases.id))
    .where(and(eq(caseEvents.id, id), eq(cases.firmId, firmId)))
    .limit(1);

  if (!event) throw new NotFoundError("Evento");

  return event;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  date?: string;
  endDate?: string;
  location?: string;
  type?: string;
  isCompleted?: boolean;
}

export async function updateEvent(firmId: string, id: string, input: UpdateEventInput) {
  const [existing] = await db
    .select({ id: caseEvents.id })
    .from(caseEvents)
    .innerJoin(cases, eq(caseEvents.caseId, cases.id))
    .where(and(eq(caseEvents.id, id), eq(cases.firmId, firmId)))
    .limit(1);

  if (!existing) throw new NotFoundError("Evento");

  const allowedFields = ["title", "description", "date", "endDate", "location", "type", "isCompleted"];
  const updates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if ((input as Record<string, unknown>)[key] !== undefined) {
      if (key === "date" || key === "endDate") {
        updates[key] = new Date((input as Record<string, unknown>)[key] as string);
      } else {
        updates[key] = (input as Record<string, unknown>)[key];
      }
    }
  }

  const [event] = await db
    .update(caseEvents)
    .set(updates)
    .where(eq(caseEvents.id, id))
    .returning();

  return event;
}

export async function deleteEvent(firmId: string, id: string) {
  const [existing] = await db
    .select({ id: caseEvents.id })
    .from(caseEvents)
    .innerJoin(cases, eq(caseEvents.caseId, cases.id))
    .where(and(eq(caseEvents.id, id), eq(cases.firmId, firmId)))
    .limit(1);

  if (!existing) throw new NotFoundError("Evento");

  await db.delete(caseEvents).where(eq(caseEvents.id, id));

  return true;
}
