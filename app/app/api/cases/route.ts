import { NextRequest, NextResponse } from "next/server";
import { getFirmId, handleUnauthorized } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import {
  listCases,
  createCase,
} from "@/lib/services/cases.service";

export async function GET(request: NextRequest) {
  try {
    const firmId = await getFirmId();
    const { searchParams } = request.nextUrl;

    const result = await listCases(firmId, {
      search: searchParams.get("search") ?? undefined,
      matter: searchParams.get("matter") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      priority: searchParams.get("priority") ?? undefined,
      page: parseInt(searchParams.get("page") ?? "1"),
      limit: parseInt(searchParams.get("limit") ?? "20"),
    });

    return Response.json(result);
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error fetching cases:", error instanceof Error ? error.message : error);
    return Response.json({ error: "Error al obtener casos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const firmId = await getFirmId();

    const rateCheck = await checkRateLimit("api", firmId);
    if (rateCheck instanceof NextResponse) return rateCheck;

    const body = await request.json();

    if (!body.number || !body.title || !body.matter || !body.startDate) {
      return Response.json(
        { error: "Campos requeridos: number, title, matter, startDate" },
        { status: 400 },
      );
    }

    const newCase = await createCase(firmId, body);

    await writeAuditLog({
      firmId,
      action: "create",
      entityType: "case",
      entityId: newCase.id,
      changes: { number: body.number, title: body.title, matter: body.matter },
    });

    return Response.json(newCase, { status: 201 });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error creating case:", error instanceof Error ? error.message : error);
    return Response.json({ error: "Error al crear el caso" }, { status: 500 });
  }
}
