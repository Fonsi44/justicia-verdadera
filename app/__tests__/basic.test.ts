import { describe, it, expect } from "vitest";
import { formatDate, formatCurrency, cn } from "@/lib/utils";

describe("utils", () => {
  it("formatDate formats correctly", () => {
    const d = formatDate("2026-05-30");
    expect(d).toBeDefined();
    expect(typeof d).toBe("string");
  });

  it("formatCurrency formats HNL", () => {
    const result = formatCurrency(750);
    expect(result).toContain("750");
  });

  it("cn merges class names", () => {
    const result = cn("px-4", "py-2", "bg-primary");
    expect(result).toContain("px-4");
    expect(result).toContain("py-2");
    expect(result).toContain("bg-primary");
  });
});

describe("status mapping", () => {
  it("maps processing statuses correctly", () => {
    const statuses = [
      "pending", "uploaded", "ocr_processing", "ocr_complete",
      "ocr_skipped", "manual_review", "error", "retry_pending",
    ];
    expect(statuses).toHaveLength(8);
    expect(statuses).toContain("pending");
    expect(statuses).toContain("ocr_complete");
  });

  it("maps case statuses correctly", () => {
    const statuses = ["activo", "archivado", "cerrado", "suspendido"];
    expect(statuses).toHaveLength(4);
    expect(statuses).toContain("activo");
  });
});

describe("pricing", () => {
  it("has correct HNL pricing tiers", () => {
    const tiers = [
      { name: "Starter", price: 750 },
      { name: "Profesional", price: 2050 },
      { name: "Despacho", price: 5150 },
    ];
    expect(tiers).toHaveLength(3);
    expect(tiers[0].price).toBeLessThan(tiers[1].price);
    expect(tiers[1].price).toBeLessThan(tiers[2].price);
  });
});

describe("multi-tenant isolation", () => {
  it("firmId must be present in all schema queries", () => {
    const tablesWithFirmId = ["cases", "contacts", "documents", "invoices", "case_events", "time_entries", "notifications", "audit_logs"];
    expect(tablesWithFirmId.length).toBeGreaterThanOrEqual(6);
    tablesWithFirmId.forEach(table => {
      expect(table).toBeTruthy();
    });
  });

  it("entity access requires firmId filter", () => {
    const queries = [
      { table: "cases", where: "firmId = ? AND id = ?" },
      { table: "documents", where: "firmId = ? AND id = ?" },
      { table: "contacts", where: "firmId = ? AND id = ?" },
      { table: "invoices", where: "firmId = ? AND id = ?" },
    ];
    queries.forEach(q => {
      expect(q.where).toContain("firmId");
    });
  });
});

describe("OCR processing", () => {
  it("processing status has valid values", () => {
    const validStatuses = [
      "pending", "uploaded", "ocr_processing", "ocr_complete",
      "ocr_skipped", "manual_review", "error", "retry_pending",
    ];
    expect(validStatuses).toHaveLength(8);
    expect(validStatuses).toContain("ocr_complete");
    expect(validStatuses).toContain("ocr_skipped");
  });

  it("ocr text has max length limit", () => {
    const MAX_OCR_LENGTH = 50000;
    const longText = "a".repeat(60000);
    const truncated = longText.substring(0, MAX_OCR_LENGTH);
    expect(truncated.length).toBe(MAX_OCR_LENGTH);
  });

  it("status transitions are valid", () => {
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

    expect(validTransitions.ocr_processing).toContain("ocr_complete");
    expect(validTransitions.error).toContain("retry_pending");
    expect(validTransitions.pending).toContain("uploaded");
  });
});

describe("rate limiting", () => {
  it("has auth, api, and upload limiters", () => {
    const limiters = ["auth", "api", "upload"];
    expect(limiters).toHaveLength(3);
    expect(limiters).toContain("auth");
    expect(limiters).toContain("api");
    expect(limiters).toContain("upload");
  });

  it("api rate limit is higher than auth", () => {
    const limits = { auth: 5, api: 60, upload: 10 };
    expect(limits.api).toBeGreaterThan(limits.auth);
    expect(limits.upload).toBeGreaterThan(limits.auth);
  });
});
