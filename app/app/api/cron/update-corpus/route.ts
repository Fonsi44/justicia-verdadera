import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { legalDocuments } from "@/database/schema";
import { count, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const [totalResult] = await db
      .select({ c: count() })
      .from(legalDocuments);
    const totalDocs = Number(totalResult.c);

    const [unverifiedResult] = await db
      .select({ c: count() })
      .from(legalDocuments)
      .where(sql`verified_at IS NULL`);
    const unverifiedDocs = Number(unverifiedResult.c);

    const [verifiedResult] = await db
      .select({ c: count() })
      .from(legalDocuments)
      .where(sql`verified_at IS NOT NULL`);
    const verifiedDocs = Number(verifiedResult.c);

    const [obsoleteBefore] = await db
      .select({ c: count() })
      .from(legalDocuments)
      .where(sql`metadata->>'status' = 'obsolete'`);
    const beforeCount = Number(obsoleteBefore.c);

    await db
      .update(legalDocuments)
      .set({
        metadata: sql`COALESCE(metadata, '{}'::jsonb) || '{"status":"obsolete"}'::jsonb`,
      })
      .where(
        sql`source LIKE 'codigo_%'
            AND created_at < NOW() - INTERVAL '365 days'
            AND (metadata IS NULL OR metadata->>'status' IS DISTINCT FROM 'obsolete')`
      );

    const [obsoleteAfter] = await db
      .select({ c: count() })
      .from(legalDocuments)
      .where(sql`metadata->>'status' = 'obsolete'`);
    const afterCount = Number(obsoleteAfter.c);
    const markedObsolete = afterCount - beforeCount;

    const sources = await db
      .select({ source: legalDocuments.source, c: count() })
      .from(legalDocuments)
      .groupBy(legalDocuments.source)
      .orderBy(sql`count DESC`);

    const stats = {
      totalDocs,
      unverifiedDocs,
      verifiedDocs,
      markedObsolete,
      sources: sources.map((s) => ({
        source: s.source,
        count: Number(s.c),
      })),
      timestamp: new Date().toISOString(),
    };

    console.log(
      "[CRON] Actualizaci\u00f3n del corpus legal:",
      JSON.stringify(stats)
    );

    return NextResponse.json(stats);
  } catch (error) {
    console.error(
      "[CRON] Error:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { error: "Error al actualizar corpus legal" },
      { status: 500 }
    );
  }
}
