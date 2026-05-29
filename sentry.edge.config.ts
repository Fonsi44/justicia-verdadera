import { init } from "@sentry/nextjs";

init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
});
