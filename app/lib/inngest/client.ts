import { Inngest } from "inngest";

const eventKey = process.env.INNGEST_EVENT_KEY;

const isConfigured = !!eventKey;

export const inngest = isConfigured
  ? new Inngest({
      id: "justicia-verdadera",
      name: "Justicia Verdadera",
      eventKey: eventKey,
    })
  : ({
      send: () => {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[Inngest] No INNGEST_EVENT_KEY configured. Skipping event.");
        }
      },
    } as unknown as Inngest);

export function isInngestConfigured(): boolean {
  return isConfigured;
}
