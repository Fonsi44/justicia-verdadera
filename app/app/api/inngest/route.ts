import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { processDocumentOcr } from "@/lib/inngest/functions";

const functions = [processDocumentOcr].filter(Boolean) as Parameters<typeof serve>[0]["functions"];

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});