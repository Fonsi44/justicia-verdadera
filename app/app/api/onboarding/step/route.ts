import { NextRequest, NextResponse } from "next/server";
import { getFirmId, handleUnauthorized } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { firms } from "@/database/schema";
import { eq } from "drizzle-orm";
import { AppError } from "@/lib/errors";
import { writeAuditLog } from "@/lib/audit";

const VALID_STEPS = ["firm_data", "invite_users", "import_data", "complete"];
const STEP_ORDER = ["firm_data", "invite_users", "import_data", "complete"];

export async function PATCH(request: NextRequest) {
  try {
    const firmId = await getFirmId();

    const rateCheck = await checkRateLimit("api", firmId);
    if (rateCheck instanceof NextResponse) return rateCheck;

    const body = await request.json();
    const { step } = body as { step?: string };

    if (!step || !VALID_STEPS.includes(step)) {
      return NextResponse.json({
        error: `Paso inválido. Debe ser uno de: ${VALID_STEPS.join(", ")}`,
      }, { status: 400 });
    }

    const [firm] = await db
      .select({ settings: firms.settings })
      .from(firms)
      .where(eq(firms.id, firmId))
      .limit(1);

    if (!firm) {
      return NextResponse.json({ error: "Despacho no encontrado" }, { status: 404 });
    }

    const onboarding = firm.settings?.onboarding ?? { stepsCompleted: [], currentStep: "firm_data" };

    if (onboarding.stepsCompleted.includes(step)) {
      return NextResponse.json({ message: "Este paso ya estaba completado", onboarding });
    }

    onboarding.stepsCompleted = [...onboarding.stepsCompleted, step];

    const currentIndex = STEP_ORDER.indexOf(step);
    onboarding.currentStep =
      currentIndex < STEP_ORDER.length - 1 ? STEP_ORDER[currentIndex + 1] : "complete";

    await db
      .update(firms)
      .set({
        settings: { ...firm.settings, onboarding },
      })
      .where(eq(firms.id, firmId));

    await writeAuditLog({
      firmId,
      action: "update",
      entityType: "firm",
      entityId: firmId,
      changes: { onboarding: { completedStep: step } },
    });

    return NextResponse.json({ onboarding });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error updating onboarding step:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al actualizar paso del onboarding" }, { status: 500 });
  }
}
