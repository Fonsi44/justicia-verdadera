import { NextResponse } from "next/server";
import { getFirmId, handleUnauthorized } from "@/lib/auth/require-auth";
import { getDashboardStats } from "@/lib/services/dashboard.service";

export async function GET() {
  try {
    const firmId = await getFirmId();
    const stats = await getDashboardStats(firmId);
    return NextResponse.json(stats);
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    console.error("Error fetching dashboard data:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Error al obtener datos del dashboard" },
      { status: 500 }
    );
  }
}
