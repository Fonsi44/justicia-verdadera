import { NextRequest, NextResponse } from "next/server";
import { getFirmId, handleUnauthorized } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { NotFoundError } from "@/lib/errors";
import { eq, and } from "drizzle-orm";
import { listGoogleEvents } from "@/lib/services/calendar.service";
import { db } from "@/lib/db";
import { caseEvents, cases } from "@/database/schema";

export async function GET(req: NextRequest) {
  try {
    await getFirmId();

    const { searchParams } = new URL(req.url);
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken") ?? "";
    const maxResults = parseInt(searchParams.get("maxResults") ?? "50");

    if (!accessToken) {
      return NextResponse.json(
        { error: "Se requiere accessToken de Google Calendar como query param" },
        { status: 400 },
      );
    }

    const events = await listGoogleEvents(accessToken, refreshToken, maxResults);

    return NextResponse.json({ data: events });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error listing Google Calendar events:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al obtener eventos de Google Calendar" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const firmId = await getFirmId();

    const rateCheck = await checkRateLimit("api", firmId);
    if (rateCheck instanceof NextResponse) return rateCheck;

    const body = await req.json();
    const { accessToken, refreshToken, caseId, maxResults } = body;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Se requiere accessToken de Google Calendar" },
        { status: 400 },
      );
    }

    if (!caseId) {
      return NextResponse.json(
        { error: "Se requiere caseId para importar eventos" },
        { status: 400 },
      );
    }

    const [caseExists] = await db
      .select({ id: cases.id })
      .from(cases)
      .where(and(eq(cases.id, caseId), eq(cases.firmId, firmId)))
      .limit(1);

    if (!caseExists) throw new NotFoundError("Caso");

    const existingIds = await db
      .select({ googleEventId: caseEvents.googleEventId })
      .from(caseEvents)
      .where(eq(caseEvents.caseId, caseId));

    const existingSet = new Set(
      existingIds.map((e) => e.googleEventId).filter(Boolean) as string[],
    );

    const events = await listGoogleEvents(accessToken, refreshToken ?? "", maxResults ?? 50);

    let imported = 0;
    for (const gEvent of events) {
      if (existingSet.has(gEvent.id)) continue;

      const startDate = gEvent.start?.dateTime ?? gEvent.start?.date;
      const endDate = gEvent.end?.dateTime ?? gEvent.end?.date;

      if (!startDate) continue;

      await db.insert(caseEvents).values({
        caseId: caseId as string,
        type: "otro",
        title: gEvent.summary || "Evento importado de Google Calendar",
        date: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        googleEventId: gEvent.id,
      } as typeof caseEvents.$inferInsert);

      imported++;
    }

    await writeAuditLog({
      firmId,
      action: "create",
      entityType: "event",
      changes: { importedFromGoogle: true, count: imported, caseId },
    });

    return NextResponse.json({ data: { imported } }, { status: 201 });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error importing Google Calendar events:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al importar eventos de Google Calendar" }, { status: 500 });
  }
}
