import { NextResponse } from "next/server";
import { getFirmId, handleUnauthorized } from "@/lib/auth/require-auth";
import { AppError } from "@/lib/errors";

export async function GET() {
  try {
    await getFirmId();

    return NextResponse.json({
      configured: !!process.env.WHATSAPP_ACCESS_TOKEN && !!process.env.WHATSAPP_PHONE_NUMBER_ID,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? null,
    });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("[WhatsApp Status]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al verificar estado de WhatsApp" }, { status: 500 });
  }
}
