import { init } from "@sentry/nextjs";

const isDev = process.env.NODE_ENV === "development";

init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !isDev,
  tracesSampleRate: isDev ? 1.0 : 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [],
});
