import { NextRequest, NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { validateAccessToken, markTokenUsed, getClientDocuments } from "@/lib/services/portal.service";

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

    const documents = await getClientDocuments(record.contactId, record.firmId);

    return NextResponse.json({ data: documents });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error fetching portal documents:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al obtener documentos" }, { status: 500 });
  }
}
