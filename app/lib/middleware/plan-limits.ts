import { ForbiddenError } from "@/lib/errors";
import { checkPlanLimit, type PlanResource } from "@/lib/services/subscription.service";

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
