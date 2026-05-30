import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices, firms, contacts } from "@/database/schema";
import { getFirmId, handleUnauthorized } from "@/lib/auth/require-auth";
import { eq, and, isNull } from "drizzle-orm";
import { AppError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const firmId = await getFirmId();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const conditions = [eq(invoices.firmId, firmId), isNull(invoices.deletedAt)];
    if (status) conditions.push(eq(invoices.status, status as typeof invoices.status._.data));

    const [firm] = await db
      .select({ name: firms.name, taxId: firms.taxId })
      .from(firms)
      .where(eq(firms.id, firmId))
      .limit(1);

    const rows = await db
      .select({
        number: invoices.number,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        subtotal: invoices.subtotal,
        tax: invoices.tax,
        total: invoices.total,
        cai: invoices.cai,
        rtnReceptor: invoices.rtnReceptor,
        rtnEmisor: invoices.rtnEmisor,
        estadoSar: invoices.estadoSar,
        client: { identityNumber: contacts.identityNumber },
      })
      .from(invoices)
      .leftJoin(contacts, eq(invoices.clientId, contacts.id))
      .where(and(...conditions))
      .orderBy(invoices.issueDate);

    const header = [
      "RTN_EMISOR", "RTN_RECEPTOR", "NUMERO_FACTURA",
      "FECHA_EMISION", "FECHA_VENCIMIENTO", "SUBTOTAL",
      "ISV_15", "TOTAL", "CAI", "ESTADO_SAR",
    ];

    const csvRows = rows.map((r) => [
      r.rtnEmisor || firm?.taxId || "",
      r.rtnReceptor || r.client?.identityNumber || "",
      r.number,
      r.issueDate,
      r.dueDate,
      r.subtotal,
      r.tax,
      r.total,
      r.cai || "",
      r.estadoSar || "pendiente_enviar",
    ]);

    const csv = [
      header.join(","),
      ...csvRows.map((r) => r.map((v) => `"${v}"`).join(",")),
    ].join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="facturas-sar-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error exporting CSV:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al exportar CSV" }, { status: 500 });
  }
}
