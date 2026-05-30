import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

/**
 * getSessionSC: para Server Components.
 * Redirige a signin si no hay sesión (usa redirect de next/navigation).
 */
export async function getSessionSC() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }
  return session;
}

/**
 * getSessionAPI: para API Routes.
 * Lanza error si no hay sesión (debe ser manejado por try/catch en la route).
 * Retorna NextResponse.redirect para compatibilidad con API routes.
 */
export async function getSessionAPI() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

/**
 * getFirmId: para API Routes. Usa getSessionAPI internamente.
 * Lanza error si no hay sesión.
 */
export async function getFirmId() {
  const session = await getSessionAPI();
  return session.user.firmId;
}

/**
 * getFirmIdSC: para Server Components. Usa getSessionSC internamente.
 * Redirige si no hay sesión.
 */
export async function getFirmIdSC() {
  const session = await getSessionSC();
  return session.user.firmId;
}

/**
 * handleUnauthorized: para API Routes, captura el error de getSessionAPI/getFirmId
 * y retorna un NextResponse 401 consistente.
 */
export function handleUnauthorized(error: unknown): NextResponse | null {
  if (error instanceof Error && error.message === "Unauthorized") {
    return NextResponse.json(
      { error: "No autorizado. Inicia sesión para continuar." },
      { status: 401 }
    );
  }
  return null;
}