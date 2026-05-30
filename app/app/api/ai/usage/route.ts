import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aiUsage } from "@/database/schema";
import { getFirmId, handleUnauthorized } from "@/lib/auth/require-auth";
import { eq, and, sql, gte } from "drizzle-orm";
import { getFirmPlan } from "@/lib/services/subscription.service";
import { AppError } from "@/lib/errors";
import { startOfMonth, subDays } from "date-fns";

export async function GET() {
  try {
    const firmId = await getFirmId();

    const thirtyDaysAgo = subDays(new Date(), 30);
    const monthStart = startOfMonth(new Date());

    const [totalAgg] = await db
      .select({
        totalPrompts: sql<number>`COALESCE(COUNT(*), 0)`,
        totalTokens: sql<number>`COALESCE(SUM(${aiUsage.promptTokens} + ${aiUsage.completionTokens}), 0)`,
        totalCost: sql<string>`COALESCE(SUM(${aiUsage.cost})::numeric, '0')`,
      })
      .from(aiUsage)
      .where(eq(aiUsage.firmId, firmId));

    const promptsByDay = await db
      .select({
        date: sql<string>`DATE(${aiUsage.createdAt})`,
        count: sql<number>`COALESCE(COUNT(*), 0)`,
      })
      .from(aiUsage)
      .where(
        and(
          eq(aiUsage.firmId, firmId),
          gte(aiUsage.createdAt, thirtyDaysAgo)
        )
      )
      .groupBy(sql`DATE(${aiUsage.createdAt})`)
      .orderBy(sql`DATE(${aiUsage.createdAt})`);

    const [currentPeriodAgg] = await db
      .select({
        prompts: sql<number>`COALESCE(COUNT(*), 0)`,
        cost: sql<string>`COALESCE(SUM(${aiUsage.cost})::numeric, '0')`,
      })
      .from(aiUsage)
      .where(
        and(
          eq(aiUsage.firmId, firmId),
          gte(aiUsage.createdAt, monthStart)
        )
      );

    const recentUsage = await db
      .select({
        id: aiUsage.id,
        model: aiUsage.model,
        promptTokens: aiUsage.promptTokens,
        completionTokens: aiUsage.completionTokens,
        totalTokens: sql<number>`COALESCE(${aiUsage.promptTokens} + ${aiUsage.completionTokens}, 0)`,
        cost: aiUsage.cost,
        createdAt: aiUsage.createdAt,
      })
      .from(aiUsage)
      .where(eq(aiUsage.firmId, firmId))
      .orderBy(sql`${aiUsage.createdAt} DESC`)
      .limit(50);

    const plan = await getFirmPlan(firmId);

    return NextResponse.json({
      totalPrompts: Number(totalAgg?.totalPrompts ?? 0),
      totalTokens: Number(totalAgg?.totalTokens ?? 0),
      totalCost: Number(totalAgg?.totalCost ?? 0),
      promptsByDay,
      currentPeriodUsage: Number(currentPeriodAgg?.prompts ?? 0),
      periodLimit: plan.limits.prompts,
      spendingLimit: plan.aiSpendingLimit,
      currentSpending: Number(currentPeriodAgg?.cost ?? 0),
      recentUsage,
    });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error fetching AI usage:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al obtener uso de IA" }, { status: 500 });
  }
}
