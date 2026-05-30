import { db } from "@/lib/db";
import { notifications } from "@/database/schema";
import { sendNotificationEmail } from "@/lib/email";
import { users } from "@/database/schema";
import { eq } from "drizzle-orm";

type NotificationType = "plazo" | "evento" | "documento" | "estado" | "factura" | "sistema";

interface CreateNotificationInput {
  firmId: string;
  userId?: string;
  type: NotificationType;
  title: string;
  body: string;
  caseId?: string;
  sendEmail?: boolean;
}

export async function createNotification(input: CreateNotificationInput) {
  const [n] = await db
    .insert(notifications)
    .values({
      firmId: input.firmId as string,
      userId: input.userId ?? null,
      type: input.type,
      title: input.title,
      body: input.body,
      caseId: input.caseId ?? undefined,
    } as typeof notifications.$inferInsert)
    .returning();

  if (input.sendEmail && input.userId) {
    const [user] = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1);

    if (user?.email) {
      await sendNotificationEmail(user.email, input.title, input.body);
    }
  }

  return n;
}

export async function notifyCaseCreated(firmId: string, caseId: string, caseNumber: string, title: string, lawyerIds: string[]) {
  for (const userId of lawyerIds) {
    await createNotification({
      firmId,
      userId,
      type: "estado",
      title: "Nuevo caso creado",
      body: `Se ha creado el caso ${caseNumber}: ${title}`,
      caseId,
    });
  }
}

export async function notifyEventTomorrow(firmId: string, caseId: string, eventTitle: string, eventDate: Date, userId: string) {
  await createNotification({
    firmId,
    userId,
    type: "evento",
    title: "📅 Recordatorio: evento mañana",
    body: `Mañana tiene ${eventTitle} a las ${eventDate.toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit" })}`,
    caseId,
    sendEmail: true,
  });
}

export async function notifyInvoiceOverdue(firmId: string, invoiceNumber: string, amount: string, dueDate: string, caseId: string | null) {
  const firmUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.firmId, firmId))
    .limit(5);

  for (const user of firmUsers) {
    await createNotification({
      firmId,
      userId: user.id,
      type: "factura",
      title: "🚨 Factura vencida",
      body: `La factura ${invoiceNumber} por L. ${amount} venció el ${dueDate}`,
      caseId: caseId ?? undefined,
      sendEmail: true,
    });
  }
}

export async function notifyDocumentUploaded(firmId: string, caseId: string, docName: string, lawyerIds: string[]) {
  for (const userId of lawyerIds) {
    await createNotification({
      firmId,
      userId,
      type: "documento",
      title: "Nuevo documento disponible",
      body: `Se ha subido el documento "${docName}" al caso`,
      caseId,
    });
  }
}
