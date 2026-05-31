import { ForbiddenError } from "@/lib/errors";
import { checkPlanLimit, type PlanResource } from "@/lib/services/subscription.service";
import { db } from "@/lib/db";
import { firms } from "@/database/schema";
import { eq } from "drizzle-orm";

const RESOURCE_LABELS: Record<PlanResource, string> = {
  users: "usuarios",
  cases: "casos activos",
  prompts: "prompts de IA",
  documents: "documentos",
  storage: "almacenamiento",
};

export async function requirePlanLimit(firmId: string, resource: PlanResource) {
  const result = await checkPlanLimit(firmId, resource);

  if (!result.allowed) {
    throw new ForbiddenError(
      `Has alcanzado el límite de ${RESOURCE_LABELS[resource]} de tu plan (${result.limit}). Actualiza a un plan superior en la configuración.`
    );
  }

  return result;
}

const ALLOWED_SUBSCRIPTION_STATUSES = ["active", "past_due"];

export async function requireActiveSubscription(firmId: string): Promise<{ status: string; tier: string }> {
  const [firm] = await db
    .select({
      subscriptionStatus: firms.subscriptionStatus,
      subscriptionTier: firms.subscriptionTier,
    })
    .from(firms)
    .where(eq(firms.id, firmId))
    .limit(1);

  if (!firm) {
    throw new ForbiddenError("Despacho no encontrado.");
  }

  const status = firm.subscriptionStatus ?? "trial";
  const tier = firm.subscriptionTier ?? "starter";

  if (!ALLOWED_SUBSCRIPTION_STATUSES.includes(status)) {
    if (status === "trial") {
      throw new ForbiddenError(
        "El corpus legal especializado solo está disponible para suscriptores activos. " +
        "Activa tu suscripción en /suscripcion para acceder a más de 2 millones de palabras " +
        "de legislación hondureña."
      );
    }
    throw new ForbiddenError(
      `Tu suscripción está ${status}. Renueva tu plan en /suscripcion para seguir accediendo al corpus legal.`
    );
  }

  return { status, tier };
}
