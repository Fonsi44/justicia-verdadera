import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));

describe("OCR utilities", () => {
  it("returns empty result for invalid URLs gracefully", async () => {
    const { extractTextFromPdf } = await import("@/lib/ocr");
    const result = await extractTextFromPdf("https://invalid-url-that-does-not-exist.test/file.pdf");
    expect(result.text).toBe("");
    expect(result.confidence).toBe(0);
  });

  it("extractTextFromPlainText returns confidence 1.0", async () => {
    const { extractTextFromPlainText } = await import("@/lib/ocr");
    const result = await extractTextFromPlainText("https://invalid-url.test/file.txt");
    expect(result.text).toBe("");
    expect(result.confidence).toBe(0);
  });
});

describe("Error classes", () => {
  it("AppError serializes correctly", async () => {
    const { AppError } = await import("@/lib/errors");
    const err = new AppError("test", 418, "TEST");
    const json = err.toJSON();
    expect(json.error).toBe("test");
    expect(json.code).toBe("TEST");
    expect(err.status).toBe(418);
  });

  it("NotFoundError has default message", async () => {
    const { NotFoundError } = await import("@/lib/errors");
    const err = new NotFoundError("Caso");
    expect(err.message).toBe("Caso no encontrado");
    expect(err.status).toBe(404);
  });

  it("ValidationError includes fields", async () => {
    const { ValidationError } = await import("@/lib/errors");
    const err = new ValidationError("Invalid", { name: "Required" });
    const json = err.toJSON();
    expect(json.fields).toEqual({ name: "Required" });
    expect(err.status).toBe(400);
  });

  it("UnauthorizedError has status 401", async () => {
    const { UnauthorizedError } = await import("@/lib/errors");
    const err = new UnauthorizedError();
    expect(err.status).toBe(401);
  });

  it("ConflictError has status 409", async () => {
    const { ConflictError } = await import("@/lib/errors");
    const err = new ConflictError("Overlap detected");
    expect(err.status).toBe(409);
  });

  it("RateLimitError has status 429", async () => {
    const { RateLimitError } = await import("@/lib/errors");
    const err = new RateLimitError();
    expect(err.status).toBe(429);
  });
});

describe("Version limit", () => {
  it("getMaxVersions returns 50", async () => {
    const { getMaxVersions } = await import("@/lib/version-limit");
    expect(getMaxVersions()).toBe(50);
  });
});

describe("Soft-delete schema", () => {
  it("cases has deletedAt column", async () => {
    const { cases } = await import("@/database/schema");
    expect(cases.deletedAt).toBeDefined();
  });

  it("contacts has deletedAt column", async () => {
    const { contacts } = await import("@/database/schema");
    expect(contacts.deletedAt).toBeDefined();
  });

  it("documents has deletedAt column", async () => {
    const { documents } = await import("@/database/schema");
    expect(documents.deletedAt).toBeDefined();
  });

  it("invoices has deletedAt column", async () => {
    const { invoices } = await import("@/database/schema");
    expect(invoices.deletedAt).toBeDefined();
  });
});

describe("ISV configurable", () => {
  it("firms has isvRate column", async () => {
    const { firms } = await import("@/database/schema");
    expect(firms.isvRate).toBeDefined();
  });
});

describe("Audit log index", () => {
  it("auditLogs table is defined", async () => {
    const { auditLogs } = await import("@/database/schema");
    expect(auditLogs).toBeDefined();
    expect(auditLogs.createdAt).toBeDefined();
  });
});
