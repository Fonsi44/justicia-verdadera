import { NextRequest, NextResponse } from "next/server";
import { getSession, handleUnauthorized } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { AppError } from "@/lib/errors";
import { scrapeAllSources, scrapeSourceById, getCorpusStats } from "@/lib/scraping/pipeline";

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();

    if (session.user.role !== "owner" && session.user.role !== "admin") {
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
    }

    const stats = await getCorpusStats();
    return NextResponse.json({ data: stats });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("[Scrape API] Error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al obtener estadísticas del corpus" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const firmId = session.user.firmId;

    if (session.user.role !== "owner" && session.user.role !== "admin") {
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
    }

    const rateCheck = await checkRateLimit("api", firmId);
    if (rateCheck instanceof NextResponse) return rateCheck;

    const body = await request.json().catch(() => ({}));
    const sourceId = body.sourceId as string | undefined;

    let results;

    if (sourceId) {
      const result = await scrapeSourceById(sourceId);
      if (!result) {
        return NextResponse.json({ error: "Fuente no encontrada" }, { status: 404 });
      }
      results = [result];
    } else {
      results = await scrapeAllSources();
    }

    return NextResponse.json({ data: results });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("[Scrape API] Error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al ejecutar scraping" }, { status: 500 });
  }
}
