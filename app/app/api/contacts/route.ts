import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contacts, caseParties } from "@/database/schema";
import { getFirmId } from "@/lib/auth/require-auth";
import { and, eq, or, ilike, count, desc, inArray, type SQL } from "drizzle-orm";
import { checkRateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";

type ContactType = "persona_natural" | "persona_juridica" | "institucion";

const validTypes: ContactType[] = ["persona_natural", "persona_juridica", "institucion"];

export async function GET(request: NextRequest) {
  try {
    const firmId = await getFirmId();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const typeParam = searchParams.get("type") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const offset = (page - 1) * limit;

  const conditions: (SQL<unknown> | undefined)[] = [eq(contacts.firmId, firmId)];
  const matchedType = validTypes.find((t) => t === typeParam);
  if (matchedType) {
    conditions.push(eq(contacts.type, matchedType));
  }
  if (search) {
    conditions.push(
      or(
        ilike(contacts.firstName, `%${search}%`),
        ilike(contacts.lastName, `%${search}%`),
        ilike(contacts.companyName, `%${search}%`),
        ilike(contacts.email, `%${search}%`),
        ilike(contacts.identityNumber, `%${search}%`),
      ),
    );
  }

  const where = and(...conditions);

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(contacts)
    .where(where);

  const items = await db
    .select()
    .from(contacts)
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(contacts.createdAt));

  const contactIds = items.map(c => c.id);
  const counts = contactIds.length > 0
    ? await db
        .select({ contactId: caseParties.contactId, value: count() })
        .from(caseParties)
        .where(inArray(caseParties.contactId, contactIds))
        .groupBy(caseParties.contactId)
    : [];

  const countMap = new Map(counts.map(c => [c.contactId, c.value]));

  const data = items.map(c => ({
    ...c,
    caseCount: countMap.get(c.id) ?? 0,
  }));

  return NextResponse.json({ data, total, page, limit });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json({ error: "Error al obtener contactos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const firmId = await getFirmId();

    const rateCheck = await checkRateLimit("api", firmId);
    if (rateCheck instanceof NextResponse) return rateCheck;

  const body = await request.json();

  const { type, firstName, lastName, companyName, identityNumber, email, phone, address, notes } = body;

  if (!type || !validTypes.includes(type)) {
    return NextResponse.json({ error: "Tipo de contacto inválido" }, { status: 400 });
  }

  const [contact] = await db
    .insert(contacts)
    .values({
      firmId,
      type,
      firstName: firstName ?? null,
      lastName: lastName ?? null,
      companyName: companyName ?? null,
      identityNumber: identityNumber ?? null,
      email: email ?? null,
      phone: phone ?? null,
      address: address ?? null,
      notes: notes ?? null,
    })
    .returning();

  await writeAuditLog({
    firmId,
    action: "create",
    entityType: "contact",
    entityId: contact.id,
    changes: { type, firstName: firstName ?? null, lastName: lastName ?? null, email: email ?? null },
  });

  return NextResponse.json({ data: { ...contact, caseCount: 0 } }, { status: 201 });
  } catch (error) {
    console.error("Error creating contact:", error);
    return NextResponse.json({ error: "Error al crear el contacto" }, { status: 500 });
  }
}
