/**
 * API Route Wrapper — Envuelve cada API route con:
 * 1. Auth check (vía getSessionAPI)
 * 2. Rate limiting específico
 * 3. Body size validation
 * 4. Error handling estandarizado (401/429/413/500)
 *
 * Uso:
 *   export const POST = withApiRoute(async (req, firmId) => { ... }, { rateLimitKind: "api" });
 */
import { NextRequest, NextResponse } from "next/server";
import { getSessionAPI, handleUnauthorized } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";

type RouteHandler = (
  request: NextRequest,
  firmId: string
) => Promise<NextResponse | Response>;

interface ApiRouteOptions {
  /** Tipo de rate limit: "auth" (5/min), "api" (60/min), "upload" (10/min) */
  rateLimitKind?: "auth" | "api" | "upload";
  /** Tamaño máximo del body en bytes (default: 1MB = 1048576) */
  maxBodySize?: number;
  /** Si requiere autenticación (default: true) */
  requireAuth?: boolean;
  /** Si registra en audit log automáticamente (default: false) */
  audit?: { entityType: string; extractEntityId?: (result: unknown) => string | undefined };
}

const DEFAULT_MAX_BODY = 1_048_576; // 1 MB

export function withApiRoute(handler: RouteHandler, options: ApiRouteOptions = {}) {
  const {
    rateLimitKind = "api",
    maxBodySize = DEFAULT_MAX_BODY,
    requireAuth = true,
    audit,
  } = options;

  return async (request: NextRequest): Promise<NextResponse | Response> => {
    try {
      // 0. Body size validation (POST/PATCH/PUT)
      if (["POST", "PATCH", "PUT"].includes(request.method)) {
        const contentLength = request.headers.get("content-length");
        if (contentLength && parseInt(contentLength, 10) > maxBodySize) {
          return NextResponse.json(
            { error: `Payload demasiado grande. Máximo ${(maxBodySize / 1048576).toFixed(1)} MB.` },
            { status: 413 }
          );
        }
      }

      // 1. Auth check
      let firmId = "";
      if (requireAuth) {
        try {
          firmId = await getSessionAPI();
        } catch (e) {
          const unauth = handleUnauthorized(e);
          if (unauth) return unauth;
          throw e;
        }
      }

      // 2. Rate limiting
      if (rateLimitKind && firmId) {
        const key = `${request.method}:${firmId}`;
        const rl = await checkRateLimit(rateLimitKind, key);
        if (rl instanceof NextResponse) return rl;
      }

      // 3. Execute handler
      const result = await handler(request, firmId);

      // 4. Audit log
      if (audit && firmId) {
        const action = request.method === "POST" ? "create" : request.method === "PATCH" ? "update" : "delete";
        const entityId = audit.extractEntityId ? audit.extractEntityId(result) : undefined;
        await writeAuditLog({
          firmId,
          action,
          entityType: audit.entityType,
          entityId,
          ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
          userAgent: request.headers.get("user-agent") ?? undefined,
        });
      }

      return result;
    } catch (error) {
      const unauthorized = handleUnauthorized(error);
      if (unauthorized) return unauthorized;

      console.error(`[API] ${request.method} ${request.nextUrl.pathname}:`, error instanceof Error ? error.message : error);
      return NextResponse.json(
        { error: "Error interno del servidor. Intenta de nuevo." },
        { status: 500 }
      );
    }
  };
}