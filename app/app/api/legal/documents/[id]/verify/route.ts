import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { legalDocuments } from "@/database/schema";
import { eq } from "drizzle-orm";
import { getSession, handleUnauthorized } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { AppError, NotFoundError } from "@/lib/errors";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    const firmId = session.user.firmId;

    const rateCheck = await checkRateLimit("api", firmId);
    if (rateCheck instanceof NextResponse) return rateCheck;

    const [doc] = await db
      .select({ id: legalDocuments.id })
      .from(legalDocuments)
      .where(eq(legalDocuments.id, id))
      .limit(1);

    if (!doc) throw new NotFoundError("Documento legal");

    const [updated] = await db
      .update(legalDocuments)
      .set({
        verifiedBy: session.user.id,
        verifiedAt: new Date(),
      })
      .where(eq(legalDocuments.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError)
      return NextResponse.json(error.toJSON(), { status: error.status });
    console.error(
      "Error verifying legal document:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { error: "Error al verificar documento legal" },
      { status: 500 }
    );
  }
}
