import { NextRequest, NextResponse } from "next/server";
import { getFirmId, handleUnauthorized } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { updateEvent, deleteEvent, getEventById } from "@/lib/services/events.service";
import { syncEventToGoogle, deleteEventFromGoogle } from "@/lib/services/calendar.service";
import { eventUpdateSchema } from "@/lib/validations/update.schemas";
import { db } from "@/lib/db";
import { caseEvents } from "@/database/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const firmId = await getFirmId();
    const { id } = await params;

    const rateCheck = await checkRateLimit("api", firmId);
    if (rateCheck instanceof NextResponse) return rateCheck;

    const body = await req.json();
    const { accessToken, refreshToken, ...updateData } = body;

    const parsed = eventUpdateSchema.safeParse(updateData);
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fields[issue.path.join(".")] = issue.message;
      }
      return NextResponse.json({ error: "Datos inválidos", code: "VALIDATION_ERROR", fields }, { status: 400 });
    }

    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ error: "No hay campos para actualizar" }, { status: 400 });
    }

    const event = await updateEvent(firmId, id, parsed.data);

    if (accessToken) {
      try {
        const googleEventId = await syncEventToGoogle(accessToken, refreshToken ?? "", {
          id: event.id,
          title: event.title,
          description: event.description,
          date: event.date,
          endDate: event.endDate,
          location: event.location,
          googleEventId: event.googleEventId,
        });

        if (!event.googleEventId) {
          await db.update(caseEvents).set({ googleEventId }).where(eq(caseEvents.id, event.id));
          event.googleEventId = googleEventId;
        }
      } catch (syncError) {
        console.error("Google Calendar sync error:", syncError instanceof Error ? syncError.message : syncError);
      }
    }

    await writeAuditLog({
      firmId,
      action: "update",
      entityType: "event",
      entityId: id,
      changes: { ...parsed.data, googleSynced: !!accessToken },
    });

    return NextResponse.json({ data: event });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error updating event:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al actualizar evento" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const firmId = await getFirmId();
    const { id } = await params;

    const body = await req.json().catch(() => ({}));
    const { accessToken, refreshToken } = body;

    const event = await getEventById(firmId, id);

    if (accessToken && event.googleEventId) {
      try {
        await deleteEventFromGoogle(accessToken, refreshToken ?? "", event.googleEventId);
      } catch (syncError) {
        console.error("Google Calendar delete error:", syncError instanceof Error ? syncError.message : syncError);
      }
    }

    await deleteEvent(firmId, id);

    await writeAuditLog({
      firmId,
      action: "delete",
      entityType: "event",
      entityId: id,
      changes: { deletedId: id, googleDeleted: !!accessToken },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error deleting event:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al eliminar evento" }, { status: 500 });
  }
}
