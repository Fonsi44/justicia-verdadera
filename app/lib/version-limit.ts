import { db } from "@/lib/db";
import { documentVersions } from "@/database/schema";
import { eq, count } from "drizzle-orm";

const MAX_VERSIONS = 50;

export async function canCreateVersion(documentId: string): Promise<boolean> {
  const [{ value }] = await db
    .select({ value: count() })
    .from(documentVersions)
    .where(eq(documentVersions.documentId, documentId));

  return Number(value) < MAX_VERSIONS;
}

export function getMaxVersions(): number {
  return MAX_VERSIONS;
}
