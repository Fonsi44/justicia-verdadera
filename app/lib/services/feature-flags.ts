import { db } from "@/lib/db";
import { firms } from "@/database/schema";
import { eq } from "drizzle-orm";
import { NotFoundError } from "@/lib/errors";

export type FeatureFlagName =
  | "rls"
  | "calendarSync"
  | "whatsapp"
  | "firmaElectronica"
  | "portalCliente"
  | "aiJuridica"
  | "exportSar";

export interface FeatureFlags {
  rls: boolean;
  calendarSync: boolean;
  whatsapp: boolean;
  firmaElectronica: boolean;
  portalCliente: boolean;
  aiJuridica: boolean;
  exportSar: boolean;
}

const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  rls: false,
  calendarSync: false,
  whatsapp: false,
  firmaElectronica: false,
  portalCliente: true,
  aiJuridica: true,
  exportSar: true,
};

export const FEATURE_FLAG_LABELS: Record<FeatureFlagName, string> = {
  rls: "Aislamiento multi-tenant (RLS)",
  calendarSync: "Sincronización de calendario",
  whatsapp: "Notificaciones WhatsApp",
  firmaElectronica: "Firma electrónica",
  portalCliente: "Portal del cliente",
  aiJuridica: "IA jurídica",
  exportSar: "Exportación SAR",
};

export async function getFeatureFlags(firmId: string): Promise<FeatureFlags> {
  const [firm] = await db
    .select({ settings: firms.settings })
    .from(firms)
    .where(eq(firms.id, firmId))
    .limit(1);

  if (!firm) throw new NotFoundError("Despacho");

  const settings = firm.settings as { featureFlags?: Partial<FeatureFlags> } | null;
  const featureFlags = settings?.featureFlags ?? {};

  return { ...DEFAULT_FEATURE_FLAGS, ...featureFlags };
}

export async function isFeatureEnabled(firmId: string, flag: FeatureFlagName): Promise<boolean> {
  const flags = await getFeatureFlags(firmId);
  return flags[flag] ?? DEFAULT_FEATURE_FLAGS[flag] ?? false;
}

export async function setFeatureFlag(
  firmId: string,
  flag: FeatureFlagName,
  enabled: boolean
): Promise<FeatureFlags> {
  const current = await getFeatureFlags(firmId);

  const [firm] = await db
    .select({ settings: firms.settings })
    .from(firms)
    .where(eq(firms.id, firmId))
    .limit(1);

  if (!firm) throw new NotFoundError("Despacho");

  const currentSettings = (firm.settings as Record<string, unknown>) ?? {};

  const updatedFlags = { ...current, [flag]: enabled };
  const newSettings = { ...currentSettings, featureFlags: updatedFlags };

  await db
    .update(firms)
    .set({ settings: newSettings as typeof firms.$inferInsert.settings })
    .where(eq(firms.id, firmId));

  return updatedFlags;
}

export function getGlobalFeatureFlags(): Partial<FeatureFlags> {
  return {};
}

export function isFeatureEnabledGlobal(_flag: FeatureFlagName): boolean {
  return true;
}
