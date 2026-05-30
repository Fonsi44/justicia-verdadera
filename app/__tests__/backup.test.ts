import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));

describe("Backup service", () => {
  it("exportFirmData is exported as a function", async () => {
    const { exportFirmData } = await import("@/lib/services/backup.service");
    expect(typeof exportFirmData).toBe("function");
  });

  it("exportFirmCsv is exported as a function", async () => {
    const { exportFirmCsv } = await import("@/lib/services/backup.service");
    expect(typeof exportFirmCsv).toBe("function");
  });
});
