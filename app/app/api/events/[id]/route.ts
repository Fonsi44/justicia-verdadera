import { NextRequest, NextResponse } from "next/server";
import { getFirmId, handleUnauthorized } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { getEventById, updateEvent, deleteEvent } from "@/lib/services/events.service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const firmId = await getFirmId();
    const { id } = await params;
    const event = await getEventById(firmId, id);
    return NextResponse.json({ data: event });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error fetching event:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al obtener evento" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const firmId = await getFirmId();
    const { id } = await params;

    const rateCheck = await checkRateLimit("api", firmId);
    if (rateCheck instanceof NextResponse) return rateCheck;

    const body = await req.json();

    const updates: Record<string, unknown> = {};
    const allowedFields = ["title", "description", "date", "endDate", "location", "type", "isCompleted"];
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updates[key] = key === "date" || key === "endDate" ? new Date(body[key]) : body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No hay campos para actualizar" }, { status: 400 });
    }

    const event = await updateEvent(firmId, id, updates);

    await writeAuditLog({
      firmId,
      action: "update",
      entityType: "event",
      entityId: id,
      changes: updates,
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

    const rateCheck = await checkRateLimit("api", firmId);
    if (rateCheck instanceof NextResponse) return rateCheck;

    await deleteEvent(firmId, id);

    await writeAuditLog({
      firmId,
      action: "delete",
      entityType: "event",
      entityId: id,
      changes: { deletedId: id },
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
