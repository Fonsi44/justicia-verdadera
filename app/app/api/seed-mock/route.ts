import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { seedMockData } from "@/lib/mock-data";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.firmId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const rateCheck = await checkRateLimit("auth", session.user.firmId);
    if (rateCheck instanceof NextResponse) return rateCheck;

    const result = await seedMockData(session.user.firmId, session.user.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error seeding mock data:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Error al generar datos de prueba" },
      { status: 500 },
    );
  }
}