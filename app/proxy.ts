import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

const publicPaths = [
  "/",
  "/auth/signin",
  "/auth/error",
  "/api/auth",
  "/api/webhooks",
  "/api/inngest",
  "/pricing",
  "/blog",
  "/docs",
];

const adminPaths = ["/api/admin", "/config"];

const writeMethods = ["POST", "PATCH", "DELETE", "PUT"];

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";

  // Rate limit global por IP (300 req/min — DDoS básico)
  const rl = await checkRateLimit("global", `proxy:${ip}`);
  if (rl instanceof NextResponse) return rl;

  // Public paths - no auth required
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Auth check
  if (!req.auth) {
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  const role = (req.auth.user as { role?: string })?.role ?? "";

  // Admin RBAC check
  if (adminPaths.some((p) => pathname.startsWith(p))) {
    if (!["owner", "admin"].includes(role)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // Write operations RBAC: only owner/admin/lawyer can write
  if (writeMethods.includes(req.method) && pathname.startsWith("/api/")) {
    if (!["owner", "admin", "lawyer"].includes(role)) {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción. Contacta al administrador." },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|json|txt|xml|map)).*)",
  ],
};
