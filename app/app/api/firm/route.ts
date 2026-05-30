import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { firms, users } from "@/database/schema";
import { getFirmId, handleUnauthorized } from "@/lib/auth/require-auth";
import { auth } from "@/lib/auth";
import { eq, count } from "drizzle-orm";
import { AppError } from "@/lib/errors";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.firmId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const firmId = session.user.firmId;

    const [firm] = await db
      .select({
        name: firms.name, slug: firms.slug, contactEmail: firms.contactEmail,
        contactPhone: firms.contactPhone, address: firms.address, taxId: firms.taxId,
        isvRate: firms.isvRate, settings: firms.settings,
        createdAt: firms.createdAt,
      })
      .from(firms)
      .where(eq(firms.id, firmId))
      .limit(1);

    if (!firm) {
      return NextResponse.json({ error: "Despacho no encontrado" }, { status: 404 });
    }

    const [{ value: userCount }] = await db
      .select({ value: count() })
      .from(users)
      .where(eq(users.firmId, firmId));

    return NextResponse.json({
      data: { ...firm, userCount },
      user: { id: session.user.id, name: session.user.name, email: session.user.email, role: session.user.role },
    });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error fetching config:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al obtener configuración" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const firmId = await getFirmId();
    const body = await req.json();

    const allowedFields = ["contactEmail", "contactPhone", "address", "taxId", "isvRate"];
    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    if (body.settings && typeof body.settings === "object") {
      const [current] = await db
        .select({ settings: firms.settings })
        .from(firms)
        .where(eq(firms.id, firmId))
        .limit(1);
      updates.settings = { ...(current?.settings as object ?? {}), ...body.settings };
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No hay campos para actualizar" }, { status: 400 });
    }

    const [updated] = await db
      .update(firms)
      .set(updates)
      .where(eq(firms.id, firmId))
      .returning();

    return NextResponse.json({ data: updated });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error updating config:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al actualizar configuración" }, { status: 500 });
  }
}
