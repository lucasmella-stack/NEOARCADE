import * as Sentry from "@sentry/nextjs";
import { glitchtipOptions } from "@/lib/glitchtip";

// Inlineado en build desde GLITCHTIP_DSN / GLITCHTIP_ENVIRONMENT (next.config.mjs).
const dsn = process.env.NEXT_PUBLIC_GLITCHTIP_DSN;

if (dsn) {
  Sentry.init(glitchtipOptions(dsn, process.env.NEXT_PUBLIC_GLITCHTIP_ENVIRONMENT));
}

// Instrumenta navegaciones (tracing al 5%).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
