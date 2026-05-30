/* eslint-disable */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/ai/embeddings", () => ({ searchSimilarDocuments: vi.fn() }));
vi.mock("@ai-sdk/deepseek", () => ({ deepseek: vi.fn() }));
vi.mock("ai", () => ({ generateText: vi.fn(), streamText: vi.fn() }));

describe("GET /api/legal/search validation", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns 400 without query param", async () => {
    const { auth } = await import("@/lib/auth");
    (vi.mocked(auth) as any).mockResolvedValue({ user: { firmId: "firm-1" } });
    const { GET } = await import("@/app/api/legal/search/route");
    const request = new NextRequest(new URL("http://localhost:3000/api/legal/search"));
    const response = await GET(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  it("returns 400 for query shorter than 3 chars", async () => {
    const { auth } = await import("@/lib/auth");
    (vi.mocked(auth) as any).mockResolvedValue({ user: { firmId: "firm-1" } });
    const { GET } = await import("@/app/api/legal/search/route");
    const request = new NextRequest(new URL("http://localhost:3000/api/legal/search?q=ab"));
    const response = await GET(request);
    expect(response.status).toBe(400);
  });

  it("returns 401 without auth", async () => {
    const { auth } = await import("@/lib/auth");
    (vi.mocked(auth) as any).mockResolvedValue(undefined);
    const { GET } = await import("@/app/api/legal/search/route");
    const request = new NextRequest(new URL("http://localhost:3000/api/legal/search?q=plazo+apelacion"));
    const response = await GET(request);
    expect(response.status).toBe(401);
  });
});
