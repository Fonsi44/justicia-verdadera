import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

const publicPaths = [
  "/",
  "/auth/signin",
  "/auth/error",
  "/api/auth",
  "/api/webhooks",
  "/pricing",
  "/blog",
  "/docs",
];

const adminPaths = ["/api/admin", "/config"];

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";

  // Rate limit global por IP (100 req/min)
  const rl = await checkRateLimit("api", `proxy:${ip}`);
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

  // Admin RBAC check
  if (adminPaths.some((p) => pathname.startsWith(p))) {
    const role = (req.auth.user as { role?: string })?.role ?? "";
    if (!["owner", "admin"].includes(role)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png).*)"],
};