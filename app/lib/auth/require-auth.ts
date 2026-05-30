import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { UnauthorizedError } from "@/lib/errors";

const UNAUTHORIZED_RESPONSE = NextResponse.json(
  { error: "No autorizado. Inicia sesión para continuar." },
  { status: 401 }
);

export function getUnauthorizedResponse(): NextResponse {
  return UNAUTHORIZED_RESPONSE;
}

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
 * Retorna el firmId del usuario autenticado.
 * Lanza UnauthorizedError si no hay sesión — usar con withApiRoute o try/catch.
 */
export async function getSessionAPI(): Promise<string> {
  const session = await auth();
  if (!session?.user?.firmId) {
    throw new UnauthorizedError();
  }
  return session.user.firmId;
}

/**
 * getSession: para API Routes que necesitan la sesión completa.
 * Retorna la sesión o lanza UnauthorizedError.
 */
export async function getSession(): Promise<Session> {
  const session = await auth();
  if (!session?.user) {
    throw new UnauthorizedError();
  }
  return session;
}

/**
 * getFirmId: alias de getSessionAPI para retrocompatibilidad.
 */
export async function getFirmId() {
  return getSessionAPI();
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
 * handleUnauthorized: captura el error de getSessionAPI/getFirmId
 * y retorna un NextResponse 401 consistente.
 */
export function handleUnauthorized(error: unknown): NextResponse | null {
  if (error instanceof UnauthorizedError) {
    return UNAUTHORIZED_RESPONSE;
  }
  return null;
}
