import { NextRequest, NextResponse } from "next/server";
import { getSession, handleUnauthorized } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { AppError } from "@/lib/errors";
import { exportFirmData, exportFirmCsv } from "@/lib/services/backup.service";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    const firmId = session.user.firmId;

    if (!["owner", "admin"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Solo administradores pueden exportar datos del despacho" },
        { status: 403 },
      );
    }

    const rateCheck = await checkRateLimit("auth", firmId);
    if (rateCheck instanceof NextResponse) return rateCheck;

    const { searchParams } = req.nextUrl;
    const type = searchParams.get("type") ?? "json";
    const entity = searchParams.get("entity");

    if (type === "csv") {
      if (!entity || !["cases", "contacts", "documents", "invoices"].includes(entity)) {
        return NextResponse.json(
          { error: "Para exportar CSV, especifica entity: cases, contacts, documents o invoices" },
          { status: 400 },
        );
      }

      const csv = await exportFirmCsv(firmId, entity);

      return new Response("\uFEFF" + csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${entity}-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    const data = await exportFirmData(firmId);

    return NextResponse.json(data, {
      headers: {
        "Content-Disposition": `attachment; filename="backup-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error exporting backup:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al exportar datos" }, { status: 500 });
  }
}
