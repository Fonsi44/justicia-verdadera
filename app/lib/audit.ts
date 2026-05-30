import { db } from "@/lib/db";
import { auditLogs } from "@/database/schema";

interface AuditEntry {
  firmId: string;
  userId?: string;
  action: "create" | "update" | "delete";
  entityType: string;
  entityId?: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function writeAuditLog(entry: AuditEntry) {
  try {
    await db.insert(auditLogs).values({
      firmId: entry.firmId,
      userId: entry.userId ?? null,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      changes: entry.changes ?? null,
      ipAddress: entry.ipAddress ?? null,
      userAgent: entry.userAgent ?? null,
    });
  } catch (error) {
    console.error("[AuditLog] Error writing audit entry:", error);
  }
}
