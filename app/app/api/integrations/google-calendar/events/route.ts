import { NextRequest, NextResponse } from "next/server";
import { getFirmId, handleUnauthorized } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { createEvent } from "@/lib/services/events.service";
import { syncEventToGoogle } from "@/lib/services/calendar.service";
import { eventCreateSchema } from "@/lib/validations/index";
import { db } from "@/lib/db";
import { caseEvents } from "@/database/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const firmId = await getFirmId();

    const rateCheck = await checkRateLimit("api", firmId);
    if (rateCheck instanceof NextResponse) return rateCheck;

    const body = await req.json();
    const { accessToken, refreshToken, ...eventData } = body;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Se requiere accessToken de Google Calendar" },
        { status: 400 },
      );
    }

    const parsed = eventCreateSchema.safeParse(eventData);
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fields[issue.path.join(".")] = issue.message;
      }
      return NextResponse.json({ error: "Datos inválidos", code: "VALIDATION_ERROR", fields }, { status: 400 });
    }

    const event = await createEvent(firmId, parsed.data);

    try {
      const googleEventId = await syncEventToGoogle(accessToken, refreshToken ?? "", {
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        endDate: event.endDate,
        location: event.location,
      });

      await db.update(caseEvents).set({ googleEventId }).where(eq(caseEvents.id, event.id));
      event.googleEventId = googleEventId;
    } catch (syncError) {
      console.error("Google Calendar sync error:", syncError instanceof Error ? syncError.message : syncError);
    }

    await writeAuditLog({
      firmId,
      action: "create",
      entityType: "event",
      entityId: event.id,
      changes: { ...parsed.data, googleSynced: true },
    });

    return NextResponse.json({ data: event }, { status: 201 });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error creating event with Google Calendar:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al crear evento" }, { status: 500 });
  }
}
