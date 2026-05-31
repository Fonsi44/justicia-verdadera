import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { legalDocuments } from "@/database/schema";
import { count, eq, and, sql } from "drizzle-orm";
import { getFirmId, handleUnauthorized } from "@/lib/auth/require-auth";
import { requireActiveSubscription } from "@/lib/middleware/plan-limits";
import { AppError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const firmId = await getFirmId();
    await requireActiveSubscription(firmId);
    const { searchParams } = request.nextUrl;

    const verified = searchParams.get("verified");
    const source = searchParams.get("source");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20"))
    );
    const offset = (page - 1) * limit;

    const conditions: ReturnType<typeof sql>[] = [];

    if (verified === "true") {
      conditions.push(sql`verified_at IS NOT NULL`);
    } else if (verified === "false") {
      conditions.push(sql`verified_at IS NULL`);
    }

    if (source) {
      conditions.push(eq(legalDocuments.source, source));
    }

    const where =
      conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await db
      .select({ c: count() })
      .from(legalDocuments)
      .where(where);

    const rows = await db
      .select({
        id: legalDocuments.id,
        source: legalDocuments.source,
        title: legalDocuments.title,
        content: legalDocuments.content,
        chunkIndex: legalDocuments.chunkIndex,
        metadata: legalDocuments.metadata,
        verifiedBy: legalDocuments.verifiedBy,
        verifiedAt: legalDocuments.verifiedAt,
        createdAt: legalDocuments.createdAt,
      })
      .from(legalDocuments)
      .where(where)
      .orderBy(sql`created_at DESC`)
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data: rows,
      total: Number(totalResult.c),
      page,
      limit,
      totalPages: Math.ceil(Number(totalResult.c) / limit),
    });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError)
      return NextResponse.json(error.toJSON(), { status: error.status });
    console.error(
      "Error listing legal documents:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { error: "Error al obtener documentos legales" },
      { status: 500 }
    );
  }
}
