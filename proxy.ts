import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const publicPaths = [
  "/",
  "/auth/signin",
  "/auth/error",
  "/api/auth",
  "/pricing",
  "/blog",
  "/docs",
];

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const session = await auth();
  if (!session?.user) {
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|api/webhooks).*)"],
};
