import { NextResponse } from "next/server";
import { getFirmId, handleUnauthorized } from "@/lib/auth/require-auth";
import { db } from "@/lib/db";
import { firms } from "@/database/schema";
import { eq } from "drizzle-orm";
import { AppError } from "@/lib/errors";

export async function GET() {
  try {
    const firmId = await getFirmId();

    const [firm] = await db
      .select({ settings: firms.settings })
      .from(firms)
      .where(eq(firms.id, firmId))
      .limit(1);

    if (!firm) {
      return NextResponse.json({ error: "Despacho no encontrado" }, { status: 404 });
    }

    const onboarding = firm.settings?.onboarding;

    return NextResponse.json({
      stepsCompleted: onboarding?.stepsCompleted ?? [],
      currentStep: onboarding?.currentStep ?? "firm_data",
    });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error fetching onboarding status:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al obtener estado del onboarding" }, { status: 500 });
  }
}
