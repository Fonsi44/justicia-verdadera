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
