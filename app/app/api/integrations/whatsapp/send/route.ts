import { NextRequest, NextResponse } from "next/server";
import { getFirmId, handleUnauthorized } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendWhatsAppTemplate } from "@/lib/services/whatsapp.service";
import { AppError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const firmId = await getFirmId();

    const rateCheck = await checkRateLimit("auth", firmId);
    if (rateCheck instanceof NextResponse) return rateCheck;

    const { to, template, parameters } = await req.json();

    if (!to || !template) {
      return NextResponse.json({ error: "Faltan campos requeridos: to, template" }, { status: 400 });
    }

    if (!Array.isArray(parameters)) {
      return NextResponse.json({ error: "parameters debe ser un array" }, { status: 400 });
    }

    const result = await sendWhatsAppTemplate(to, template, parameters);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("[WhatsApp Send]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al enviar mensaje de WhatsApp" }, { status: 500 });
  }
}
