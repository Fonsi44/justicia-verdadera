import { db } from "@/lib/db";
import { cases, users } from "@/database/schema";
import { eq, and, ilike, or, desc, count, sql, isNull } from "drizzle-orm";
import { NotFoundError } from "@/lib/errors";
import { notifyCaseCreated } from "@/lib/services/notifications.service";

export interface CaseFilters {
  search?: string;
  matter?: string;
  status?: string;
  priority?: string;
  page?: number;
  limit?: number;
}

export async function listCases(firmId: string, filters: CaseFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
  const offset = (page - 1) * limit;

  const conditions: ReturnType<typeof sql>[] = [eq(cases.firmId, firmId), isNull(cases.deletedAt)];

  if (filters.search) {
    conditions.push(
      or(
        ilike(cases.title, `%${filters.search}%`),
        ilike(cases.number, `%${filters.search}%`),
      )!,
    );
  }
  if (filters.matter) conditions.push(eq(cases.matter, filters.matter as typeof cases.matter._.data));
  if (filters.status) conditions.push(eq(cases.status, filters.status as typeof cases.status._.data));
  if (filters.priority) conditions.push(eq(cases.priority, filters.priority as typeof cases.priority._.data));

  const where = and(...conditions);

  const [caseList, [{ count: total }]] = await Promise.all([
    db
      .select({
        id: cases.id,
        firmId: cases.firmId,
        number: cases.number,
        courtNumber: cases.courtNumber,
        title: cases.title,
        description: cases.description,
        matter: cases.matter,
        status: cases.status,
        priority: cases.priority,
        assignedLawyerId: cases.assignedLawyerId,
        assignedLawyer: { id: users.id, name: users.name },
        startDate: cases.startDate,
        endDate: cases.endDate,
        estimatedValue: cases.estimatedValue,
        createdAt: cases.createdAt,
        updatedAt: cases.updatedAt,
      })
      .from(cases)
      .leftJoin(users, eq(cases.assignedLawyerId, users.id))
      .where(where)
      .orderBy(desc(cases.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(cases).where(where),
  ]);

  return {
    data: caseList,
    total: Number(total),
    page,
    limit,
    totalPages: Math.ceil(Number(total) / limit),
  };
}

export interface CreateCaseInput {
  number: string;
  courtNumber?: string;
  title: string;
  description?: string;
  matter: string;
  priority?: string;
  assignedLawyerId?: string;
  startDate: string;
  endDate?: string;
  estimatedValue?: string;
}

export async function createCase(firmId: string, input: CreateCaseInput) {
  const [newCase] = await db
    .insert(cases)
    .values({
      firmId: firmId as string,
      number: input.number,
      courtNumber: input.courtNumber ?? null,
      title: input.title,
      description: input.description ?? null,
      matter: input.matter,
      priority: input.priority ?? "media",
      assignedLawyerId: input.assignedLawyerId ?? null,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
      estimatedValue: input.estimatedValue ?? null,
    } as typeof cases.$inferInsert)
    .returning();

  // Auto-notify assigned lawyer
  if (newCase && input.assignedLawyerId) {
    notifyCaseCreated(firmId, newCase.id, input.number, input.title, [input.assignedLawyerId]).catch(() => {});
  }

  return newCase;
}

export async function getCaseById(firmId: string, id: string) {
  const [caseData] = await db
    .select({
      id: cases.id,
      firmId: cases.firmId,
      number: cases.number,
      courtNumber: cases.courtNumber,
      title: cases.title,
      description: cases.description,
      matter: cases.matter,
      status: cases.status,
      priority: cases.priority,
      assignedLawyerId: cases.assignedLawyerId,
      assignedLawyer: { id: users.id, name: users.name },
      startDate: cases.startDate,
      endDate: cases.endDate,
      estimatedValue: cases.estimatedValue,
      metadata: cases.metadata,
      createdAt: cases.createdAt,
      updatedAt: cases.updatedAt,
    })
    .from(cases)
    .leftJoin(users, eq(cases.assignedLawyerId, users.id))
    .where(and(eq(cases.id, id), eq(cases.firmId, firmId), isNull(cases.deletedAt)))
    .limit(1);

  if (!caseData) {
    throw new NotFoundError("Caso");
  }

  return caseData;
}

export interface UpdateCaseInput {
  number?: string;
  courtNumber?: string;
  title?: string;
  description?: string;
  matter?: string;
  status?: string;
  priority?: string;
  assignedLawyerId?: string;
  startDate?: string;
  endDate?: string;
  estimatedValue?: string;
  metadata?: Record<string, unknown>;
}

export async function updateCase(firmId: string, id: string, input: UpdateCaseInput) {
  const [existing] = await db
    .select({ id: cases.id })
    .from(cases)
    .where(and(eq(cases.id, id), eq(cases.firmId, firmId), isNull(cases.deletedAt)))
    .limit(1);

  if (!existing) {
    throw new NotFoundError("Caso");
  }

  const allowedFields = [
    "number", "courtNumber", "title", "description", "matter",
    "status", "priority", "assignedLawyerId", "startDate", "endDate",
    "estimatedValue", "metadata",
  ];

  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in input) updates[field] = (input as Record<string, unknown>)[field];
  }

  const [updated] = await db
    .update(cases)
    .set(updates)
    .where(eq(cases.id, id))
    .returning();

  return updated;
}

export async function softDeleteCase(firmId: string, id: string) {
  const [existing] = await db
    .select({ id: cases.id })
    .from(cases)
    .where(and(eq(cases.id, id), eq(cases.firmId, firmId), isNull(cases.deletedAt)))
    .limit(1);

  if (!existing) {
    throw new NotFoundError("Caso");
  }

  await db
    .update(cases)
    .set({ deletedAt: new Date() })
    .where(eq(cases.id, id));

  return true;
}
