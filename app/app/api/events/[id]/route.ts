import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { caseEvents, cases } from "@/database/schema";
import { getFirmId } from "@/lib/auth/require-auth";
import { eq, and } from "drizzle-orm";
import { checkRateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const firmId = await getFirmId();
    const { id } = await params;

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
        case: {
          id: cases.id,
          number: cases.number,
          title: cases.title,
        },
      })
      .from(caseEvents)
      .innerJoin(cases, eq(caseEvents.caseId, cases.id))
      .where(and(eq(caseEvents.id, id), eq(cases.firmId, firmId)))
      .limit(1);

    if (!event) {
      return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ data: event });
  } catch (error) {
    console.error("Error fetching event:", error);
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

    const allowedFields = ["title", "description", "date", "endDate", "location", "type", "isCompleted"];
    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        if (key === "date" || key === "endDate") {
          updates[key] = new Date(body[key]);
        } else {
          updates[key] = body[key];
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No hay campos para actualizar" }, { status: 400 });
    }

    const [existing] = await db
      .select({ id: caseEvents.id, caseId: caseEvents.caseId })
      .from(caseEvents)
      .innerJoin(cases, eq(caseEvents.caseId, cases.id))
      .where(and(eq(caseEvents.id, id), eq(cases.firmId, firmId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    }

    const [event] = await db
      .update(caseEvents)
      .set(updates)
      .where(eq(caseEvents.id, id))
      .returning();

    await writeAuditLog({
      firmId,
      action: "update",
      entityType: "event",
      entityId: id,
      changes: updates,
    });

    return NextResponse.json({ data: event });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json({ error: "Error al actualizar evento" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const firmId = await getFirmId();
    const { id } = await params;

    const rateCheck = await checkRateLimit("api", firmId);
    if (rateCheck instanceof NextResponse) return rateCheck;

    const [existing] = await db
      .select({ id: caseEvents.id })
      .from(caseEvents)
      .innerJoin(cases, eq(caseEvents.caseId, cases.id))
      .where(and(eq(caseEvents.id, id), eq(cases.firmId, firmId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    }

    await db.delete(caseEvents).where(eq(caseEvents.id, id));

    await writeAuditLog({
      firmId,
      action: "delete",
      entityType: "event",
      entityId: id,
      changes: { deletedId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json({ error: "Error al eliminar evento" }, { status: 500 });
  }
}
