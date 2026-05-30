import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifications } from "@/database/schema";
import { getFirmId, handleUnauthorized } from "@/lib/auth/require-auth";
import { auth } from "@/lib/auth";
import { eq, and, desc, count } from "drizzle-orm";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    const firmId = await getFirmId();

    const rateCheck = await checkRateLimit("api", firmId);
    if (rateCheck instanceof NextResponse) return rateCheck;

    const session = await auth();
    const userId = session?.user?.id;
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
    const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0"));

    const conditions = [eq(notifications.firmId, firmId)];
    if (userId) conditions.push(eq(notifications.userId, userId));
    if (unreadOnly) conditions.push(eq(notifications.isRead, false));

    const where = and(...conditions);

    const [rows, [{ count: total }], [{ count: unreadCount }]] = await Promise.all([
      db
        .select({
          id: notifications.id,
          type: notifications.type,
          title: notifications.title,
          body: notifications.body,
          isRead: notifications.isRead,
          caseId: notifications.caseId,
          createdAt: notifications.createdAt,
        })
        .from(notifications)
        .where(where)
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(notifications).where(where),
      db
        .select({ count: count() })
        .from(notifications)
        .where(and(...conditions, eq(notifications.isRead, false))),
    ]);

    return NextResponse.json({
      data: rows,
      total: Number(total),
      unreadCount: Number(unreadCount),
    });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    console.error("Error fetching notifications:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al obtener notificaciones" }, { status: 500 });
  }
}