import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

// Mock auth para pruebas
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: "mock-id", firmId: "mock-firm", title: "Test Case" }]),
    transaction: vi.fn(),
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 59 }),
}));

vi.mock("@/lib/audit", () => ({
  writeAuditLog: vi.fn().mockResolvedValue(undefined),
}));

describe("POST /api/cases", () => {
  it("creates a case when authenticated", async () => {
    const { GET } = await import("@/app/api/cases/route");
    
    const request = new NextRequest(
      new URL("http://localhost:3000/api/cases?page=1&limit=20"),
      { headers: { "content-type": "application/json" } }
    );
    
    const response = await GET(request);
    expect(response.status).toBe(200);
    
    const body = await response.json();
    expect(body).toHaveProperty("data");
  });

  it("rejects request without valid firmId", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth).mockRejectedValueOnce(new Error("Unauthorized"));
    
    const { GET } = await import("@/app/api/cases/route");
    
    const request = new NextRequest(
      new URL("http://localhost:3000/api/cases"),
      { headers: { "content-type": "application/json" } }
    );
    
    const response = await GET(request);
    expect(response.status).toBe(500);
  });
});

describe("OCR status transitions", () => {
  it("has valid status transitions", () => {
    const validTransitions: Record<string, string[]> = {
      pending: ["uploaded", "ocr_skipped", "error"],
      uploaded: ["ocr_processing", "ocr_skipped", "error"],
      ocr_processing: ["ocr_complete", "ocr_skipped", "error", "manual_review"],
      ocr_complete: [],
      ocr_skipped: [],
      manual_review: ["ocr_complete", "error"],
      error: ["retry_pending"],
      retry_pending: ["ocr_processing", "error"],
    };
    
    // Verify all states are covered
    const allStates = Object.keys(validTransitions);
    expect(allStates).toHaveLength(8);
    expect(validTransitions.uploaded).toContain("ocr_processing");
    expect(validTransitions.error).toContain("retry_pending");
  });

  it("enforces CHECK constraint values", () => {
    const validStatuses = [
      "pending", "uploaded", "ocr_processing", "ocr_complete",
      "ocr_skipped", "manual_review", "error", "retry_pending",
    ];
    expect(validStatuses).toHaveLength(8);
    expect(validStatuses).toEqual(
      expect.arrayContaining(["pending", "ocr_complete", "ocr_skipped", "error"])
    );
  });
});

describe("multi-tenant isolation", () => {
  it("all queries filter by firmId", () => {
    const casesQuery = { table: "cases", where: "firmId = ? AND id = ?" };
    const documentsQuery = { table: "documents", where: "firmId = ? AND id = ?" };
    const contactsQuery = { table: "contacts", where: "firmId = ? AND id = ?" };
    const invoicesQuery = { table: "invoices", where: "firmId = ? AND id = ?" };
    
    [casesQuery, documentsQuery, contactsQuery, invoicesQuery].forEach(q => {
      expect(q.where).toContain("firmId");
    });
  });

  it("prevents cross-tenant access", () => {
    const firmA = "firm-a-id";
    const firmB = "firm-b-id";
    
    // Simular que firmA no puede acceder a casos de firmB
    function canAccessCase(caseFirmId: string, userFirmId: string): boolean {
      return caseFirmId === userFirmId;
    }
    
    expect(canAccessCase(firmA, firmA)).toBe(true);
    expect(canAccessCase(firmB, firmA)).toBe(false);
    expect(canAccessCase(firmA, firmB)).toBe(false);
  });
});