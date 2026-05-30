import { NextRequest, NextResponse } from "next/server";
import { getFirmId, handleUnauthorized } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { listInvoices, createInvoice } from "@/lib/services/invoices.service";

export async function GET(req: NextRequest) {
  try {
    const firmId = await getFirmId();
    const { searchParams } = new URL(req.url);

    const result = await listInvoices(firmId, {
      status: searchParams.get("status") ?? undefined,
      clientId: searchParams.get("clientId") ?? undefined,
      caseId: searchParams.get("caseId") ?? undefined,
      page: parseInt(searchParams.get("page") ?? "1"),
      limit: parseInt(searchParams.get("limit") ?? "20"),
    });

    return NextResponse.json(result);
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error fetching invoices:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al obtener facturas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const firmId = await getFirmId();

    const rateCheck = await checkRateLimit("api", firmId);
    if (rateCheck instanceof NextResponse) return rateCheck;

    const body = await req.json();
    const { clientId, number, issueDate, dueDate } = body;

    if (!clientId || !number || !issueDate || !dueDate) {
      return NextResponse.json(
        { error: "clientId, number, issueDate y dueDate son requeridos" },
        { status: 400 }
      );
    }

    const { inv, subtotal, tax, total } = await createInvoice(firmId, body);

    await writeAuditLog({
      firmId,
      action: "create",
      entityType: "invoice",
      entityId: inv.id,
      changes: { clientId, number, subtotal, tax, total },
    });

    return NextResponse.json({ data: inv }, { status: 201 });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error creating invoice:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al crear factura" }, { status: 500 });
  }
}
