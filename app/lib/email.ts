import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "Justicia Verdadera <onboarding@resend.dev>";

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  if (!resend) {
    console.warn("[Email] Resend not configured. Skipping email to:", payload.to);
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });

    if (error) {
      console.error("[Email] Failed to send:", error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Email] Send error:", error instanceof Error ? error.message : error);
    return false;
  }
}

export async function sendNotificationEmail(
  to: string,
  title: string,
  body: string,
  link?: string
): Promise<boolean> {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a365d;">${title}</h2>
      <p style="color: #4a5568; line-height: 1.6;">${body}</p>
      ${link ? `<a href="${link}" style="display: inline-block; background: #2b6cb0; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">Ver en Justicia Verdadera</a>` : ""}
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 24px;" />
      <p style="color: #a0aec0; font-size: 12px;">Este correo fue enviado por Justicia Verdadera. Si no esperabas este mensaje, puedes ignorarlo.</p>
    </div>
  `;

  return sendEmail({
    to,
    subject: title,
    html,
    text: body,
  });
}
