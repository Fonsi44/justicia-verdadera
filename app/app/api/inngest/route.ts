import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  processDocumentOcr,
  processNotification,
  scheduledEventReminder,
  scheduledInvoiceCheck,
} from "@/lib/inngest/functions";

const functions = [processDocumentOcr, processNotification, scheduledEventReminder, scheduledInvoiceCheck].filter(Boolean) as Parameters<typeof serve>[0]["functions"];

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});