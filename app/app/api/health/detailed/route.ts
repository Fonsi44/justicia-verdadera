import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

async function checkDbTableCount(): Promise<number> {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const result = await sql`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;
    return Number(result[0]?.count ?? 0);
  } catch {
    return -1;
  }
}

async function checkService(apiKey?: string): Promise<string> {
  if (!apiKey) return "not_configured";
  return "configured";
}

export async function GET() {
  const tableCount = await checkDbTableCount();

  const checks = await Promise.allSettled([
    checkService(process.env.DEEPSEEK_API_KEY),
    checkService(process.env.UPSTASH_REDIS_REST_URL),
    checkService(process.env.RESEND_API_KEY),
    checkService(process.env.LEMON_SQUEEZY_API_KEY),
  ]);

  const serviceNames = ["deepseek", "redis", "resend", "lemonSqueezy"];
  const services: Record<string, string> = {};
  checks.forEach((result, i) => {
    services[serviceNames[i]] = result.status === "fulfilled" ? result.value : "error";
  });

  const mem = process.memoryUsage();

  return NextResponse.json({
    version: process.version,
    uptime: Math.floor(process.uptime()),
    memory: {
      rss: mem.rss,
      heapTotal: mem.heapTotal,
      heapUsed: mem.heapUsed,
      external: mem.external,
    },
    database: { tableCount },
    services,
    timestamp: new Date().toISOString(),
  });
}
