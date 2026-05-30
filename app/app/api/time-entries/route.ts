import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { timeEntries, cases } from "@/database/schema";
import { getSessionAPI, getFirmId } from "@/lib/auth/require-auth";
import { eq, and, desc, count } from "drizzle-orm";
import { checkRateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const firmId = await getFirmId();
    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get("caseId");
    const userId = searchParams.get("userId");
    const unbilled = searchParams.get("unbilled");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
    const offset = (page - 1) * limit;

    const conditions = [eq(cases.firmId, firmId)];
    if (caseId) conditions.push(eq(timeEntries.caseId, caseId));
    if (userId) conditions.push(eq(timeEntries.userId, userId));
    if (unbilled === "true") conditions.push(eq(timeEntries.isInvoiced, false));

    const where = and(...conditions);

    const [rows, [{ count: total }]] = await Promise.all([
      db
        .select({
          id: timeEntries.id,
          caseId: timeEntries.caseId,
          userId: timeEntries.userId,
          description: timeEntries.description,
          startTime: timeEntries.startTime,
          endTime: timeEntries.endTime,
          durationMinutes: timeEntries.durationMinutes,
          hourlyRate: timeEntries.hourlyRate,
          isBillable: timeEntries.isBillable,
          isInvoiced: timeEntries.isInvoiced,
          createdAt: timeEntries.createdAt,
        })
        .from(timeEntries)
        .innerJoin(cases, eq(timeEntries.caseId, cases.id))
        .where(where)
        .orderBy(desc(timeEntries.startTime))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(timeEntries).innerJoin(cases, eq(timeEntries.caseId, cases.id)).where(where),
    ]);

    return NextResponse.json({ data: rows, total: Number(total), page, limit, totalPages: Math.ceil(Number(total) / limit) });
  } catch (error) {
    console.error("Error fetching time entries:", error);
    return NextResponse.json({ error: "Error al obtener registros de tiempo" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionAPI();
    const firmId = await getFirmId();

    const rateCheck = await checkRateLimit("api", firmId);
    if (rateCheck instanceof NextResponse) return rateCheck;

    const body = await req.json();
    const { caseId, description, startTime, endTime, durationMinutes, hourlyRate, isBillable } = body;

    if (!caseId || !description || !startTime) {
      return NextResponse.json(
        { error: "caseId, description y startTime son requeridos" },
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

    const computedDuration = durationMinutes ?? (endTime
      ? Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000)
      : null);

    const [entry] = await db
      .insert(timeEntries)
      .values({
        caseId,
        userId: session.user.id,
        description,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        durationMinutes: computedDuration,
        hourlyRate: hourlyRate ?? null,
        isBillable: isBillable ?? true,
      })
      .returning();

    await writeAuditLog({
      firmId,
      action: "create",
      entityType: "time_entry",
      entityId: entry.id,
      changes: { caseId, description, durationMinutes: computedDuration },
    });

    return NextResponse.json({ data: entry }, { status: 201 });
  } catch (error) {
    console.error("Error creating time entry:", error);
    return NextResponse.json({ error: "Error al crear registro de tiempo" }, { status: 500 });
  }
}
