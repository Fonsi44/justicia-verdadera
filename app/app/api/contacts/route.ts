import { NextRequest, NextResponse } from "next/server";
import { getFirmId, handleUnauthorized } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { listContacts, createContact } from "@/lib/services/contacts.service";

const VALID_TYPES = ["persona_natural", "persona_juridica", "institucion"];

export async function GET(request: NextRequest) {
  try {
    const firmId = await getFirmId();
    const { searchParams } = new URL(request.url);

    const result = await listContacts(firmId, {
      search: searchParams.get("search") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      page: parseInt(searchParams.get("page") ?? "1"),
      limit: parseInt(searchParams.get("limit") ?? "20"),
    });

    return NextResponse.json(result);
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error fetching contacts:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al obtener contactos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const firmId = await getFirmId();

    const rateCheck = await checkRateLimit("api", firmId);
    if (rateCheck instanceof NextResponse) return rateCheck;

    const body = await request.json();
    const { type } = body;

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: "Tipo de contacto inválido" }, { status: 400 });
    }

    const contact = await createContact(firmId, body);

    await writeAuditLog({
      firmId,
      action: "create",
      entityType: "contact",
      entityId: contact.id,
      changes: { type, firstName: body.firstName ?? null, lastName: body.lastName ?? null, email: body.email ?? null },
    });

    return NextResponse.json({ data: contact }, { status: 201 });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error creating contact:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al crear el contacto" }, { status: 500 });
  }
}
