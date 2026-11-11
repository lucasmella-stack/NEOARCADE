import type { Event } from "@sentry/nextjs";

/**
 * `sendDefaultPii: false` does not stop the Sentry SDK (10.x) from attaching
 * the incoming request's `Cookie` and `Authorization` headers, nor
 * `request.cookies`. This removes them, plus client IP headers and bodies,
 * before anything leaves the process.
 */

const SENSITIVE_HEADERS = new Set([
  "authorization",
  "cf-connecting-ip",
  "cookie",
  "proxy-authorization",
  "set-cookie",
  "stripe-signature",
  "true-client-ip",
  "x-forwarded-for",
  "x-real-ip",
]);

export function scrubEvent<T extends Event>(event: T): T {
  const request = event.request;
  if (!request) {
    return event;
  }

  delete request.cookies;
  delete request.data;

  if (request.headers) {
    for (const name of Object.keys(request.headers)) {
      if (SENSITIVE_HEADERS.has(name.toLowerCase())) {
        delete request.headers[name];
      }
    }
  }

  return event;
}
