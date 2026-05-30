import { NextRequest, NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { sendEmail } from "@/lib/email";
import { generateAccessToken, findContactByEmail } from "@/lib/services/portal.service";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body as { email?: string };

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    const contact = await findContactByEmail(email.toLowerCase().trim());

    if (contact) {
      const token = await generateAccessToken(contact.id, contact.firmId);
      const portalUrl = `${APP_URL}/portal?token=${token}`;

      const clientName = contact.firstName
        ? `${contact.firstName} ${contact.lastName ?? ""}`.trim()
        : "Cliente";

      await sendEmail({
        to: email,
        subject: `Acceso a su portal - ${contact.firm?.name ?? "Justicia Verdadera"}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a365d;">Portal de Cliente</h2>
            <p style="color: #4a5568; line-height: 1.6;">
              Hola ${clientName},<br/><br/>
              Has solicitado acceder al portal de cliente de 
              <strong>${contact.firm?.name ?? "su despacho"}</strong>.
            </p>
            <p style="color: #4a5568; line-height: 1.6;">
              Haz clic en el siguiente enlace para acceder:
            </p>
            <a href="${portalUrl}" 
               style="display: inline-block; background: #2b6cb0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
              Acceder al Portal
            </a>
            <p style="color: #718096; font-size: 14px;">
              Este enlace expirará en 7 días. Si no solicitaste este acceso, ignora este mensaje.
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 24px;" />
            <p style="color: #a0aec0; font-size: 12px;">
              ${contact.firm?.name ?? "Justicia Verdadera"} — Sistema de gestión legal
            </p>
          </div>
        `,
        text: `Hola ${clientName},\n\nHas solicitado acceder al portal de cliente de ${contact.firm?.name ?? "su despacho"}.\n\nAccede aquí: ${portalUrl}\n\nEste enlace expirará en 7 días.`,
      });
    }

    return NextResponse.json({ sent: true });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error in portal login:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al enviar el enlace de acceso" }, { status: 500 });
  }
}
