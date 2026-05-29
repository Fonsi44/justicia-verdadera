import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "justicia-verdadera",
  name: "Justicia Verdadera",
  eventKey: process.env.INNGEST_EVENT_KEY,
});
