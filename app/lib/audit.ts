import { db } from "@/lib/db";
import { auditLogs } from "@/database/schema";
import { lt } from "drizzle-orm";

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
    console.error("[AuditLog] Error writing audit entry:", error instanceof Error ? error.message : "Unknown error");
  }
}

/**
 * purgeOldAuditLogs: Elimina registros de auditoría mayores a 90 días.
 * Debe ejecutarse periódicamente vía cron/scheduler externo o Inngest.
 */
export async function purgeOldAuditLogs(): Promise<{ deleted: number }> {
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const deleted = await db
    .delete(auditLogs)
    .where(lt(auditLogs.createdAt, cutoff))
    .returning({ id: auditLogs.id });
  return { deleted: deleted.length };
}
