import { NextRequest, NextResponse } from "next/server";
import { getFirmId, handleUnauthorized } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { listDocuments, createDocument } from "@/lib/services/documents.service";

export async function GET(req: NextRequest) {
  try {
    const firmId = await getFirmId();
    const { searchParams } = new URL(req.url);

    const result = await listDocuments(firmId, {
      search: searchParams.get("search") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      caseId: searchParams.get("caseId") ?? undefined,
      page: parseInt(searchParams.get("page") ?? "1"),
      limit: parseInt(searchParams.get("limit") ?? "20"),
    });

    return NextResponse.json(result);
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error fetching documents:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al obtener documentos" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const firmId = await getFirmId();

    const rateCheck = await checkRateLimit("upload", firmId);
    if (rateCheck instanceof NextResponse) return rateCheck;

    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "Nombre del documento es requerido" }, { status: 400 });
    }

    const doc = await createDocument(firmId, body);

    await writeAuditLog({
      firmId,
      action: "create",
      entityType: "document",
      entityId: doc.id,
      changes: { name, type: body.type, fileUrl: body.fileUrl ?? null },
    });

    return NextResponse.json({ data: doc }, { status: 201 });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error creating document:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al crear documento" }, { status: 500 });
  }
}
