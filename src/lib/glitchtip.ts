import type { BrowserOptions, NodeOptions } from "@sentry/nextjs";

import { scrubEvent } from "./scrub-event";

/**
 * Única fuente de verdad de las opciones del SDK de Sentry → GlitchTip
 * (errors.hausdersieg.com). La usan servidor, edge y cliente.
 */
export function glitchtipOptions(
  dsn: string,
  environment: string | undefined,
): BrowserOptions & NodeOptions {
  return {
    dsn,
    environment: environment || "production",
    tracesSampleRate: 0.05,
    sendDefaultPii: false,
    beforeSend: scrubEvent,
    beforeSendTransaction: scrubEvent,
  };
}
