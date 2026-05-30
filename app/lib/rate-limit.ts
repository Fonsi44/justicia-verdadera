import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
  prefix: "ratelimit:auth",
});

const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
  analytics: true,
  prefix: "ratelimit:api",
});

const uploadLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
  prefix: "ratelimit:upload",
});

type LimitKind = "auth" | "api" | "upload";

const limiters: Record<LimitKind, Ratelimit> = {
  auth: authLimiter,
  api: apiLimiter,
  upload: uploadLimiter,
};

export async function checkRateLimit(
  kind: LimitKind,
  identifier: string
): Promise<{ allowed: boolean; remaining: number } | NextResponse> {
  try {
    const limiter = limiters[kind];
    const { success, remaining } = await limiter.limit(identifier);

    if (!success) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta de nuevo en un minuto." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    return { allowed: true, remaining };
  } catch {
    // If Redis is unavailable, allow the request to proceed
    return { allowed: true, remaining: -1 };
  }
}
