import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { firms } from "@/database/schema";
import { getFirmId, handleUnauthorized } from "@/lib/auth/require-auth";
import { eq } from "drizzle-orm";
import { checkRateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";
import { AppError, ValidationError } from "@/lib/errors";

export async function PATCH(request: NextRequest) {
  try {
    const firmId = await getFirmId();

    const rateCheck = await checkRateLimit("api", firmId);
    if (rateCheck instanceof NextResponse) return rateCheck;

    const body = await request.json();
    const spendingLimit = Number(body.spendingLimit);

    if (!Number.isFinite(spendingLimit) || spendingLimit < 0) {
      throw new ValidationError("El límite de gasto debe ser un número válido mayor o igual a 0");
    }

    const [updated] = await db
      .update(firms)
      .set({ aiSpendingLimit: String(spendingLimit) })
      .where(eq(firms.id, firmId))
      .returning({ aiSpendingLimit: firms.aiSpendingLimit });

    if (!updated) {
      return NextResponse.json({ error: "Despacho no encontrado" }, { status: 404 });
    }

    await writeAuditLog({
      firmId,
      action: "update",
      entityType: "firm",
      entityId: firmId,
      changes: { aiSpendingLimit: spendingLimit },
    });

    return NextResponse.json({ aiSpendingLimit: Number(updated.aiSpendingLimit) });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error updating AI spending limit:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al actualizar límite de gasto" }, { status: 500 });
  }
}
