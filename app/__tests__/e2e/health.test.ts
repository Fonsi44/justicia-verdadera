/* eslint-disable */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }) }));
vi.mock("@/lib/audit", () => ({ writeAuditLog: vi.fn() }));
vi.mock("@/lib/services/cases.service", () => ({ listCases: vi.fn(), createCase: vi.fn() }));
vi.mock("@/lib/services/dashboard.service", () => ({ getDashboardStats: vi.fn() }));
vi.mock("@/lib/ai/embeddings", () => ({ searchSimilarDocuments: vi.fn() }));
vi.mock("@ai-sdk/deepseek", () => ({ deepseek: vi.fn() }));
vi.mock("ai", () => ({ generateText: vi.fn(), streamText: vi.fn() }));
vi.mock("@neondatabase/serverless", () => ({
  neon: vi.fn(() => vi.fn(async () => [{ 1: 1 }])),
}));

describe("GET /api/health", () => {
  it("responds with status and checks", async () => {
    const { GET } = await import("@/app/api/health/route");
    const response = await GET();
    expect([200, 503]).toContain(response.status);
    const body = await response.json();
    expect(body).toHaveProperty("status");
    expect(body).toHaveProperty("checks");
    expect(body).toHaveProperty("timestamp");
  });
});

describe("GET /api/dashboard", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns 401 without auth", async () => {
    const { auth } = await import("@/lib/auth");
    (vi.mocked(auth) as any).mockResolvedValue(undefined);
    const { GET } = await import("@/app/api/dashboard/route");
    const response = await GET();
    expect(response.status).toBe(401);
  });
});

describe("GET /api/cases", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns 401 without auth", async () => {
    const { auth } = await import("@/lib/auth");
    (vi.mocked(auth) as any).mockResolvedValue(undefined);
    const { GET } = await import("@/app/api/cases/route");
    const request = new NextRequest(new URL("http://localhost:3000/api/cases"));
    const response = await GET(request);
    expect(response.status).toBe(401);
  });
});

describe("GET /api/legal/search", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns 401 without auth", async () => {
    const { auth } = await import("@/lib/auth");
    (vi.mocked(auth) as any).mockResolvedValue(undefined);
    const { GET } = await import("@/app/api/legal/search/route");
    const request = new NextRequest(new URL("http://localhost:3000/api/legal/search?q=plazo+apelacion"));
    const response = await GET(request);
    expect(response.status).toBe(401);
  });
});
