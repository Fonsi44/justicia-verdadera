import { db } from "@/lib/db";
import { firms, users, cases, documents, aiUsage, documentVersions } from "@/database/schema";
import { eq, and, count, sql, isNull } from "drizzle-orm";
import { NotFoundError } from "@/lib/errors";

export type SubscriptionTier = "starter" | "profesional" | "despacho" | "enterprise";
export type PlanResource = "users" | "cases" | "prompts" | "documents" | "storage";

export interface PlanLimits {
  users: number;
  cases: number;
  prompts: number;
  documents: number;
  storage: number; // MB
}

export interface PlanCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
}

export interface FirmUsage {
  users: number;
  cases: number;
  documents: number;
  prompts: number;
  storage: number;
}

export interface FirmPlan {
  tier: SubscriptionTier;
  limits: PlanLimits;
  usage: FirmUsage;
  subscriptionStatus: string;
  subscriptionEndDate: Date | null;
  aiSpendingLimit: number;
}

const PLAN_LIMITS: Record<SubscriptionTier, PlanLimits> = {
  starter: { users: 1, cases: 20, prompts: 10, documents: 50, storage: 500 },
  profesional: { users: 3, cases: 100, prompts: 50, documents: 200, storage: 2048 },
  despacho: { users: 10, cases: 500, prompts: 200, documents: 500, storage: 10240 },
  enterprise: { users: 50, cases: 2000, prompts: 1000, documents: 5000, storage: 102400 },
};

function parseTier(tier: string | null | undefined): SubscriptionTier {
  if (tier && ["starter", "profesional", "despacho", "enterprise"].includes(tier)) {
    return tier as SubscriptionTier;
  }
  return "starter";
}

export function getPlanLimits(tier: SubscriptionTier): PlanLimits {
  return PLAN_LIMITS[tier];
}

export async function getFirmPlan(firmId: string): Promise<FirmPlan> {
  const [firm] = await db
    .select({
      subscriptionStatus: firms.subscriptionStatus,
      subscriptionTier: firms.subscriptionTier,
      subscriptionEndDate: firms.subscriptionEndDate,
      aiSpendingLimit: firms.aiSpendingLimit,
    })
    .from(firms)
    .where(eq(firms.id, firmId))
    .limit(1);

  if (!firm) {
    throw new NotFoundError("Despacho");
  }

  const tier = parseTier(firm.subscriptionTier);
  const limits = PLAN_LIMITS[tier];

  const [userCount, caseCount, docCount, promptCount] = await Promise.all([
    db
      .select({ count: count() })
      .from(users)
      .where(eq(users.firmId, firmId))
      .then((r) => Number(r[0]?.count ?? 0)),
    db
      .select({ count: count() })
      .from(cases)
      .where(and(eq(cases.firmId, firmId), isNull(cases.deletedAt)))
      .then((r) => Number(r[0]?.count ?? 0)),
    db
      .select({ count: count() })
      .from(documents)
      .where(and(eq(documents.firmId, firmId), isNull(documents.deletedAt)))
      .then((r) => Number(r[0]?.count ?? 0)),
    db
      .select({ total: sql<number>`COALESCE(COUNT(*), 0)` })
      .from(aiUsage)
      .where(
        and(
          eq(aiUsage.firmId, firmId),
          sql`${aiUsage.createdAt} >= date_trunc('month', CURRENT_TIMESTAMP)`
        )
      )
      .then((r) => Number(r[0]?.total ?? 0)),
  ]);

  const [storageResult] = await db
    .select({
      totalBytes: sql<string>`COALESCE(SUM(${documentVersions.fileSize}), '0')`,
    })
    .from(documentVersions)
    .innerJoin(documents, eq(documentVersions.documentId, documents.id))
    .where(and(eq(documents.firmId, firmId), isNull(documents.deletedAt)));

  const storageMb = Math.ceil(Number(storageResult?.totalBytes ?? 0) / (1024 * 1024));

  return {
    tier,
    limits,
    usage: {
      users: userCount,
      cases: caseCount,
      documents: docCount,
      prompts: promptCount,
      storage: storageMb,
    },
    subscriptionStatus: firm.subscriptionStatus ?? "trial",
    subscriptionEndDate: firm.subscriptionEndDate ?? null,
    aiSpendingLimit: Number(firm.aiSpendingLimit ?? 200),
  };
}

export async function checkPlanLimit(
  firmId: string,
  resource: PlanResource
): Promise<PlanCheckResult> {
  const plan = await getFirmPlan(firmId);

  const current = plan.usage[resource];
  const limit = plan.limits[resource];

  return {
    allowed: current < limit,
    current,
    limit,
  };
}

export async function incrementAiUsage(
  firmId: string,
  userId: string,
  tokens: { promptTokens: number; completionTokens: number; cost: number }
): Promise<{ blocked: boolean; currentSpending: number; limit: number }> {
  await db.insert(aiUsage).values({
    firmId: firmId as string,
    userId: userId as string,
    model: "deepseek-v4-flash",
    promptTokens: tokens.promptTokens,
    completionTokens: tokens.completionTokens,
    cost: tokens.cost.toString(),
  } as typeof aiUsage.$inferInsert);

  const [firm] = await db
    .select({ aiSpendingLimit: firms.aiSpendingLimit })
    .from(firms)
    .where(eq(firms.id, firmId))
    .limit(1);

  const spendingLimit = Number(firm?.aiSpendingLimit ?? 200);

  const [spendingResult] = await db
    .select({
      totalCost: sql<string>`COALESCE(SUM(${aiUsage.cost})::numeric, '0')`,
    })
    .from(aiUsage)
    .where(
      and(
        eq(aiUsage.firmId, firmId),
        sql`${aiUsage.createdAt} >= date_trunc('month', CURRENT_TIMESTAMP)`
      )
    );

  const currentSpending = Number(spendingResult?.totalCost ?? 0);
  const blocked = currentSpending >= spendingLimit;

  return { blocked, currentSpending, limit: spendingLimit };
}

export async function updateFirmSubscription(
  firmId: string,
  data: {
    subscriptionStatus?: string;
    subscriptionTier?: string;
    subscriptionId?: string;
    subscriptionEndDate?: Date | null;
  }
) {
  const [updated] = await db
    .update(firms)
    .set(data as Partial<typeof firms.$inferInsert>)
    .where(eq(firms.id, firmId))
    .returning({ id: firms.id });

  if (!updated) {
    throw new NotFoundError("Despacho");
  }

  return updated;
}

export async function getFirmBySubscriptionId(
  subscriptionId: string
) {
  const [firm] = await db
    .select({ id: firms.id })
    .from(firms)
    .where(eq(firms.subscriptionId, subscriptionId))
    .limit(1);

  return firm ?? null;
}

export function getVariantTier(variantId: string): SubscriptionTier {
  const env = process.env;
  const variantMap: Record<string, SubscriptionTier> = {};

  if (env.LS_VARIANT_STARTER_ID) variantMap[env.LS_VARIANT_STARTER_ID] = "starter";
  if (env.LS_VARIANT_PROFESIONAL_ID) variantMap[env.LS_VARIANT_PROFESIONAL_ID] = "profesional";
  if (env.LS_VARIANT_DESPACHO_ID) variantMap[env.LS_VARIANT_DESPACHO_ID] = "despacho";

  return variantMap[variantId] ?? "starter";
}
