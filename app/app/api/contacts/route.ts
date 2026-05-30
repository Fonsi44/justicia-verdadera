import { NextRequest, NextResponse } from "next/server";
import { getFirmId, handleUnauthorized } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { listContacts, createContact } from "@/lib/services/contacts.service";
import { contactCreateSchema } from "@/lib/validations/index";

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
    const parsed = contactCreateSchema.safeParse(body);
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fields[issue.path.join(".")] = issue.message;
      }
      return NextResponse.json({ error: "Datos inválidos", code: "VALIDATION_ERROR", fields }, { status: 400 });
    }

    const contact = await createContact(firmId, parsed.data);

    await writeAuditLog({
      firmId,
      action: "create",
      entityType: "contact",
      entityId: contact.id,
      changes: { type: parsed.data.type, firstName: parsed.data.firstName ?? null, lastName: parsed.data.lastName ?? null, email: parsed.data.email ?? null },
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
