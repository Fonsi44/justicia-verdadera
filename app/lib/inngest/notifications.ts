import { inngest } from "@/lib/inngest/client";
import { db } from "@/lib/db";
import { notifications, caseEvents, cases, invoices, users } from "@/database/schema";
import { eq, and, lte, gte, isNull, sql } from "drizzle-orm";
import { sendNotificationEmail } from "@/lib/email";
import { notifyEventTomorrow, notifyInvoiceOverdue } from "@/lib/services/notifications.service";

const configured = !!process.env.INNGEST_EVENT_KEY;

export const processNotification = configured
  ? inngest.createFunction(
      {
        id: "process-notification",
        triggers: [{ event: "notification/process" }],
        retries: 2,
      },
      async ({ event, step }) => {
        const { notificationId } = event.data as { notificationId: string };

        const [notification] = await step.run("fetch-notification", async () => {
          return db
            .select({
              id: notifications.id,
              userId: notifications.userId,
              title: notifications.title,
              body: notifications.body,
              channel: notifications.channel,
              sentAt: notifications.sentAt,
            })
            .from(notifications)
            .where(eq(notifications.id, notificationId))
            .limit(1);
        });

        if (!notification) {
          return { status: "not_found" };
        }

        if (notification.channel === "email" && notification.userId) {
          await step.run("send-email", async () => {
            const [user] = await db
              .select({ email: users.email, name: users.name })
              .from(users)
              .where(eq(users.id, notification.userId!))
              .limit(1);

            if (user?.email) {
              await sendNotificationEmail(user.email, notification.title, notification.body ?? "");
            }
          });
        }

        await step.run("mark-sent", async () => {
          await db
            .update(notifications)
            .set({ sentAt: new Date() })
            .where(eq(notifications.id, notificationId));
        });

        return { status: "processed" };
      }
    )
  : undefined;

export const scheduledEventReminder = configured
  ? inngest.createFunction(
      {
        id: "scheduled-event-reminder",
        triggers: [{ cron: "0 * * * *" }],
        retries: 1,
      },
      async ({ step }) => {
        const now = new Date();
        const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const upcomingEvents = await step.run("fetch-upcoming-events", async () => {
          return db
            .select({
              id: caseEvents.id,
              caseId: caseEvents.caseId,
              title: caseEvents.title,
              date: caseEvents.date,
              notifiedAt: caseEvents.notifiedAt,
              firmId: cases.firmId,
              assignedLawyerId: cases.assignedLawyerId,
            })
            .from(caseEvents)
            .innerJoin(cases, eq(caseEvents.caseId, cases.id))
            .where(
              and(
                gte(caseEvents.date, now),
                lte(caseEvents.date, in24h),
                isNull(caseEvents.notifiedAt),
                eq(caseEvents.isCompleted, false)
              )
            )
            .limit(100);
        });

        let notified = 0;
        for (const evt of upcomingEvents) {
          await step.run(`notify-event-${evt.id}`, async () => {
            if (evt.assignedLawyerId) {
              await notifyEventTomorrow(evt.firmId, evt.caseId, evt.title, new Date(evt.date), evt.assignedLawyerId);
            }

            await db
              .update(caseEvents)
              .set({ notifiedAt: new Date() })
              .where(eq(caseEvents.id, evt.id));
          });
          notified++;
        }

        return { status: "completed", eventsProcessed: notified };
      }
    )
  : undefined;

export const scheduledInvoiceCheck = configured
  ? inngest.createFunction(
      {
        id: "scheduled-invoice-check",
        triggers: [{ cron: "0 */6 * * *" }],
        retries: 1,
      },
      async ({ step }) => {
        const overdueInvoices = await step.run("fetch-overdue-invoices", async () => {
          return db
            .select({
              id: invoices.id,
              firmId: invoices.firmId,
              number: invoices.number,
              total: invoices.total,
              dueDate: invoices.dueDate,
              caseId: invoices.caseId,
              status: invoices.status,
            })
            .from(invoices)
            .where(
              and(
                sql`${invoices.dueDate} < NOW()`,
                eq(invoices.status, "emitida"),
                isNull(invoices.deletedAt)
              )
            )
            .limit(100);
        });

        let processed = 0;
        for (const inv of overdueInvoices) {
          await step.run(`process-overdue-${inv.id}`, async () => {
            await notifyInvoiceOverdue(inv.firmId, inv.number, inv.total, inv.dueDate, inv.caseId);

            await db
              .update(invoices)
              .set({ status: "vencida" })
              .where(eq(invoices.id, inv.id));
          });
          processed++;
        }

        return { status: "completed", invoicesProcessed: processed };
      }
    )
  : undefined;
