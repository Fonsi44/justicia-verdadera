import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getFirmId } from "@/lib/auth/require-auth";
import { cases, users } from "@/database/schema";
import { eq, and, ilike, or, desc, count, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const firmId = await getFirmId();
  const { searchParams } = request.nextUrl;

  const search = searchParams.get("search");
  const matter = searchParams.get("matter");
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const offset = (page - 1) * limit;

  const conditions: ReturnType<typeof sql>[] = [eq(cases.firmId, firmId)];

  if (search) {
    conditions.push(
      or(
        ilike(cases.title, `%${search}%`),
        ilike(cases.number, `%${search}%`),
      )!,
    );
  }
  if (matter) conditions.push(eq(cases.matter, matter as typeof cases.matter._.data));
  if (status) conditions.push(eq(cases.status, status as typeof cases.status._.data));
  if (priority) conditions.push(eq(cases.priority, priority as typeof cases.priority._.data));

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
        assignedLawyer: {
          id: users.id,
          name: users.name,
        },
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

  return Response.json({
    data: caseList,
    total: Number(total),
    page,
    limit,
    totalPages: Math.ceil(Number(total) / limit),
  });
  } catch (error) {
    console.error("Error fetching cases:", error);
    return Response.json({ error: "Error al obtener casos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const firmId = await getFirmId();
  const body = await request.json();

  if (!body.number || !body.title || !body.matter || !body.startDate) {
    return Response.json(
      { error: "Campos requeridos: number, title, matter, startDate" },
      { status: 400 },
    );
  }

  const [newCase] = await db
    .insert(cases)
    .values({
      firmId,
      number: body.number,
      courtNumber: body.courtNumber ?? null,
      title: body.title,
      description: body.description ?? null,
      matter: body.matter,
      priority: body.priority ?? "media",
      assignedLawyerId: body.assignedLawyerId ?? null,
      startDate: body.startDate,
      endDate: body.endDate ?? null,
      estimatedValue: body.estimatedValue ?? null,
    })
    .returning();

  return Response.json(newCase, { status: 201 });
  } catch (error) {
    console.error("Error creating case:", error);
    return Response.json({ error: "Error al crear el caso" }, { status: 500 });
  }
}
