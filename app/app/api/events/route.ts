import { NextRequest, NextResponse } from "next/server";
import { getFirmId, handleUnauthorized } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { listEvents, createEvent } from "@/lib/services/events.service";
import { eventCreateSchema } from "@/lib/validations/index";

export async function GET(req: NextRequest) {
  try {
    const firmId = await getFirmId();
    const { searchParams } = new URL(req.url);

    const result = await listEvents(firmId, {
      caseId: searchParams.get("caseId") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      upcoming: searchParams.get("upcoming") ?? undefined,
      page: parseInt(searchParams.get("page") ?? "1"),
      limit: parseInt(searchParams.get("limit") ?? "50"),
    });

    return NextResponse.json(result);
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error fetching events:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al obtener eventos" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const firmId = await getFirmId();

    const rateCheck = await checkRateLimit("api", firmId);
    if (rateCheck instanceof NextResponse) return rateCheck;

    const body = await req.json();
    const parsed = eventCreateSchema.safeParse(body);
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fields[issue.path.join(".")] = issue.message;
      }
      return NextResponse.json({ error: "Datos inválidos", code: "VALIDATION_ERROR", fields }, { status: 400 });
    }

    const event = await createEvent(firmId, parsed.data);

    await writeAuditLog({
      firmId,
      action: "create",
      entityType: "event",
      entityId: event.id,
      changes: { caseId: parsed.data.caseId, type: parsed.data.type, title: parsed.data.title, date: parsed.data.date },
    });

    return NextResponse.json({ data: event }, { status: 201 });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error creating event:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al crear evento" }, { status: 500 });
  }
}
