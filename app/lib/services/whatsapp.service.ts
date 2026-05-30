const WHATSAPP_API_BASE = "https://graph.facebook.com/v22.0";

interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

function isConfigured(): boolean {
  return !!process.env.WHATSAPP_ACCESS_TOKEN && !!process.env.WHATSAPP_PHONE_NUMBER_ID;
}

export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  parameters: string[],
): Promise<WhatsAppResponse> {
  if (!isConfigured()) {
    console.warn("[WhatsApp] WHATSAPP_ACCESS_TOKEN no configurado. Omitiendo envío.");
    return { success: false, error: "WhatsApp no configurado" };
  }

  try {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN!;

    const body = {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: "es" },
        components: [
          {
            type: "body",
            parameters: parameters.map((p) => ({ type: "text", text: p })),
          },
        ],
      },
    };

    const res = await fetch(`${WHATSAPP_API_BASE}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[WhatsApp] Error sending template:", data);
      return { success: false, error: data.error?.message ?? "Error desconocido" };
    }

    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (error) {
    console.error("[WhatsApp] Exception:", error instanceof Error ? error.message : error);
    return { success: false, error: "Error de conexión con WhatsApp API" };
  }
}

export async function sendEventReminder(
  to: string,
  eventTitle: string,
  date: string,
  time: string,
  location: string,
  caseNumber: string,
): Promise<WhatsAppResponse> {
  return sendWhatsAppTemplate(to, "recordatorio_audiencia", [eventTitle, date, time, location, caseNumber]);
}

export async function sendInvoiceNotification(
  to: string,
  invoiceNumber: string,
  amount: string,
  dueDate: string,
): Promise<WhatsAppResponse> {
  return sendWhatsAppTemplate(to, "factura_disponible", [invoiceNumber, amount, dueDate]);
}

export async function sendCaseUpdate(
  to: string,
  caseNumber: string,
  updateText: string,
): Promise<WhatsAppResponse> {
  return sendWhatsAppTemplate(to, "documento_nuevo", [updateText, caseNumber]);
}
