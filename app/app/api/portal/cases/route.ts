import { NextRequest, NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { validateAccessToken, markTokenUsed, getClientCases } from "@/lib/services/portal.service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    const record = await validateAccessToken(token);

    if (!record) {
      return NextResponse.json({ error: "Token inválido o expirado" }, { status: 401 });
    }

    await markTokenUsed(record.id);

    const cases = await getClientCases(record.contactId, record.firmId);

    return NextResponse.json({ data: cases });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error fetching portal cases:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al obtener casos" }, { status: 500 });
  }
}
