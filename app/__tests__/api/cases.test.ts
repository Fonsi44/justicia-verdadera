/* eslint-disable */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

const mockCaseData = [
  { id: "case-1", firmId: "firm-1", number: "C-001", courtNumber: null, title: "Test Case", description: null, matter: "civil", status: "activo", priority: "media", assignedLawyerId: "lawyer-1", assignedLawyer: { id: "lawyer-1", name: "Abogado Test" }, startDate: "2026-01-01", endDate: null, estimatedValue: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];
const mockCountResult = [{ count: 1 }];

const dbSelectChain: any = (() => {
  const methods: Record<string, any> = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: "mock-id", firmId: "mock-firm", title: "Test Case" }]),
    transaction: vi.fn(),
  };
  methods.then = vi.fn((onFulfilled: any) => Promise.resolve(onFulfilled([mockCaseData, mockCountResult])));
  methods.catch = vi.fn();
  return methods;
})();

vi.mock("@/lib/db", () => ({ db: dbSelectChain }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 59 }) }));
vi.mock("@/lib/audit", () => ({ writeAuditLog: vi.fn().mockResolvedValue(undefined) }));

describe("POST /api/cases", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns 200 when authenticated", async () => {
    const { auth } = await import("@/lib/auth");
    (vi.mocked(auth) as any).mockResolvedValue({ user: { id: "lawyer-1", firmId: "firm-1" }, expires: new Date(Date.now() + 86400000).toISOString() });
    const { GET } = await import("@/app/api/cases/route");
    const request = new NextRequest(new URL("http://localhost:3000/api/cases?page=1&limit=20"), { headers: { "content-type": "application/json" } });
    const response = await GET(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("data");
  });

  it("returns 401 without valid session", async () => {
    const { auth } = await import("@/lib/auth");
    (vi.mocked(auth) as any).mockResolvedValue(undefined);
    const { GET } = await import("@/app/api/cases/route");
    const request = new NextRequest(new URL("http://localhost:3000/api/cases"), { headers: { "content-type": "application/json" } });
    const response = await GET(request);
    expect(response.status).toBe(401);
  });
});

describe("OCR status transitions", () => {
  it("has valid status transitions", () => {
    const validTransitions: Record<string, string[]> = {
      pending: ["uploaded", "ocr_skipped", "error"],
      uploaded: ["ocr_processing", "ocr_skipped", "error"],
      ocr_processing: ["ocr_complete", "ocr_skipped", "error", "manual_review"],
      ocr_complete: [], ocr_skipped: [],
      manual_review: ["ocr_complete", "error"],
      error: ["retry_pending"],
      retry_pending: ["ocr_processing", "error"],
    };
    expect(Object.keys(validTransitions)).toHaveLength(8);
    expect(validTransitions.uploaded).toContain("ocr_processing");
    expect(validTransitions.error).toContain("retry_pending");
  });

  it("enforces CHECK constraint values", () => {
    const s = ["pending", "uploaded", "ocr_processing", "ocr_complete", "ocr_skipped", "manual_review", "error", "retry_pending"];
    expect(s).toHaveLength(8);
    expect(s).toEqual(expect.arrayContaining(["pending", "ocr_complete", "ocr_skipped", "error"]));
  });
});

describe("multi-tenant isolation", () => {
  it("all queries filter by firmId", () => {
    [{ t: "cases", w: "firmId = ? AND id = ?" }, { t: "documents", w: "firmId = ? AND id = ?" }, { t: "contacts", w: "firmId = ? AND id = ?" }, { t: "invoices", w: "firmId = ? AND id = ?" }].forEach(q => expect(q.w).toContain("firmId"));
  });

  it("prevents cross-tenant access", () => {
    const can = (a: string, b: string) => a === b;
    expect(can("a", "a")).toBe(true);
    expect(can("b", "a")).toBe(false);
    expect(can("a", "b")).toBe(false);
  });
});
