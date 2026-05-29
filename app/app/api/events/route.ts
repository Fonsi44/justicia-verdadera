import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { caseEvents, cases } from "@/database/schema";
import { getFirmId } from "@/lib/auth/require-auth";
import { eq, and, gte, lte, asc, count } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const firmId = await getFirmId();
    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get("caseId");
    const type = searchParams.get("type");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const upcoming = searchParams.get("upcoming");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50")));
    const offset = (page - 1) * limit;

    const conditions = [eq(cases.firmId, firmId)];
    if (caseId) conditions.push(eq(caseEvents.caseId, caseId));
    if (type) conditions.push(eq(caseEvents.type, type as typeof caseEvents.type._.data));
    if (from) conditions.push(gte(caseEvents.date, new Date(from)));
    if (to) conditions.push(lte(caseEvents.date, new Date(to)));
    if (upcoming === "true") {
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
          case: {
            id: cases.id,
            number: cases.number,
            title: cases.title,
          },
        })
        .from(caseEvents)
        .innerJoin(cases, eq(caseEvents.caseId, cases.id))
        .where(where)
        .orderBy(asc(caseEvents.date))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(caseEvents).innerJoin(cases, eq(caseEvents.caseId, cases.id)).where(where),
    ]);

    return NextResponse.json({ data: rows, total: Number(total), page, limit, totalPages: Math.ceil(Number(total) / limit) });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ error: "Error al obtener eventos" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const firmId = await getFirmId();
    const body = await req.json();
    const { caseId, type, title, description, date, endDate, location } = body;

    if (!caseId || !type || !title || !date) {
      return NextResponse.json(
        { error: "caseId, type, title y date son requeridos" },
        { status: 400 }
      );
    }

    const [caseExists] = await db
      .select({ id: cases.id })
      .from(cases)
      .where(and(eq(cases.id, caseId), eq(cases.firmId, firmId)))
      .limit(1);

    if (!caseExists) {
      return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 });
    }

    const [event] = await db
      .insert(caseEvents)
      .values({
        caseId,
        type,
        title,
        description: description ?? null,
        date: new Date(date),
        endDate: endDate ? new Date(endDate) : null,
        location: location ?? null,
      })
      .returning();

    return NextResponse.json({ data: event }, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json({ error: "Error al crear evento" }, { status: 500 });
  }
}
