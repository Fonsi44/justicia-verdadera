import { NextRequest, NextResponse } from "next/server";
import { getFirmId, handleUnauthorized } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { getInvoiceById, updateInvoice, softDeleteInvoice } from "@/lib/services/invoices.service";
import { invoiceUpdateSchema } from "@/lib/validations/update.schemas";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const firmId = await getFirmId();
    const { id } = await params;
    const inv = await getInvoiceById(firmId, id);
    return NextResponse.json({ data: inv });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error fetching invoice:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al obtener factura" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const firmId = await getFirmId();
    const { id } = await params;

    const rateCheck = await checkRateLimit("api", firmId);
    if (rateCheck instanceof NextResponse) return rateCheck;

    const body = await req.json();

    const parsed = invoiceUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fields[issue.path.join(".")] = issue.message;
      }
      return NextResponse.json({ error: "Datos inválidos", code: "VALIDATION_ERROR", fields }, { status: 400 });
    }

    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ error: "No hay campos para actualizar" }, { status: 400 });
    }

    const inv = await updateInvoice(firmId, id, parsed.data);

    await writeAuditLog({
      firmId,
      action: "update",
      entityType: "invoice",
      entityId: id,
      changes: parsed.data,
    });

    return NextResponse.json({ data: inv });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error updating invoice:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al actualizar factura" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const firmId = await getFirmId();
    const { id } = await params;

    const rateCheck = await checkRateLimit("api", firmId);
    if (rateCheck instanceof NextResponse) return rateCheck;

    await softDeleteInvoice(firmId, id);

    await writeAuditLog({
      firmId,
      action: "delete",
      entityType: "invoice",
      entityId: id,
      changes: { deletedId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error deleting invoice:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al eliminar factura" }, { status: 500 });
  }
}
