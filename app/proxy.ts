import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

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

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (!req.auth) {
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png).*)"],
};
