import * as Sentry from "@sentry/nextjs";
import { glitchtipOptions } from "@/lib/glitchtip";

// Next llama a register() al arrancar (también con el custom server.ts).
// El DSN se lee en runtime: en prod llega como env del contenedor.
export function register(): void {
  const dsn = process.env.GLITCHTIP_DSN;
  if (!dsn) {
    if (process.env.NODE_ENV === "production") {
      console.warn("[glitchtip] GLITCHTIP_DSN no definido: errores de servidor sin reportar");
    }
    return;
  }
  Sentry.init(glitchtipOptions(dsn, process.env.GLITCHTIP_ENVIRONMENT));
}

// Sin este hook Next captura los errores de render/route handlers y solo los
// loguea por consola: nunca llegan a GlitchTip.
export const onRequestError = Sentry.captureRequestError;
