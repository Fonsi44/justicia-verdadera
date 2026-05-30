import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function GET() {
  const checks: Record<string, string> = {};

  try {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`SELECT 1`;
    checks.database = "ok";
  } catch {
    checks.database = "error";
  }

  checks.redis = process.env.UPSTASH_REDIS_REST_URL ? "configured" : "not_configured";
  checks.uploadthing = process.env.UPLOADTHING_TOKEN ? "configured" : "not_configured";
  checks.resend = process.env.RESEND_API_KEY ? "configured" : "not_configured";
  checks.deepseek = process.env.DEEPSEEK_API_KEY ? "configured" : "not_configured";
  checks.inngest = process.env.INNGEST_EVENT_KEY ? "configured" : "not_configured";
  checks.lemonSqueezy = process.env.LEMON_SQUEEZY_API_KEY ? "configured" : "not_configured";

  const allOk = Object.values(checks).every((v) => v === "ok" || v === "configured");

  return NextResponse.json(
    {
      status: allOk ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allOk ? 200 : 503 }
  );
}
