import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cases, contacts, documents, invoices, caseEvents } from "@/database/schema";
import { getFirmId, handleUnauthorized } from "@/lib/auth/require-auth";
import { eq, and, isNull, count } from "drizzle-orm";
import { AppError } from "@/lib/errors";

export async function GET() {
  try {
    const firmId = await getFirmId();

    const [totalCases, totalContacts, totalDocuments, totalInvoices, totalEvents] =
      await Promise.all([
        db
          .select({ count: count() })
          .from(cases)
          .where(and(eq(cases.firmId, firmId), isNull(cases.deletedAt))),
        db
          .select({ count: count() })
          .from(contacts)
          .where(and(eq(contacts.firmId, firmId), isNull(contacts.deletedAt))),
        db
          .select({ count: count() })
          .from(documents)
          .where(and(eq(documents.firmId, firmId), isNull(documents.deletedAt))),
        db
          .select({ count: count() })
          .from(invoices)
          .where(and(eq(invoices.firmId, firmId), isNull(invoices.deletedAt))),
        db
          .select({ count: count() })
          .from(caseEvents)
          .innerJoin(cases, eq(caseEvents.caseId, cases.id))
          .where(and(eq(cases.firmId, firmId), isNull(cases.deletedAt))),
      ]);

    return NextResponse.json({
      totalCases: Number(totalCases[0].count),
      totalContacts: Number(totalContacts[0].count),
      totalDocuments: Number(totalDocuments[0].count),
      totalInvoices: Number(totalInvoices[0].count),
      totalEvents: Number(totalEvents[0].count),
    });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error fetching backup info:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al obtener información de respaldo" }, { status: 500 });
  }
}
