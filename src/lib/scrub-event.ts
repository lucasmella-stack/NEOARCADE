import type { Breadcrumb, Event } from "@sentry/nextjs";

/**
 * `sendDefaultPii: false` does not stop the Sentry SDK (10.x) from attaching
 * the incoming request's `Cookie` and `Authorization` headers, nor
 * `request.cookies`, nor full URLs with their query string (search terms,
 * tokens). This removes all of that before anything leaves the process.
 */

const SENSITIVE_HEADERS = new Set([
  "authorization",
  "cf-connecting-ip",
  "cookie",
  "proxy-authorization",
  "referer",
  "set-cookie",
  "stripe-signature",
  "true-client-ip",
  "x-forwarded-for",
  "x-real-ip",
]);

const URL_BREADCRUMB_FIELDS = ["url", "from", "to"] as const;

/** Drops the query string and fragment: `/a?q=x#y` -> `/a`. */
export function stripQuery(url: string): string {
  return url.split(/[?#]/, 1)[0] ?? "";
}

export function scrubEvent<T extends Event>(event: T): T {
  const request = event.request;
  if (!request) {
    return event;
  }

  delete request.cookies;
  delete request.data;
  delete request.query_string;

  if (request.url) {
    request.url = stripQuery(request.url);
  }

  if (request.headers) {
    for (const name of Object.keys(request.headers)) {
      if (SENSITIVE_HEADERS.has(name.toLowerCase())) {
        delete request.headers[name];
      }
    }
  }

  return event;
}

/** Console breadcrumbs can carry anything that was logged; URLs lose their query. */
export function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb | null {
  if (breadcrumb.category === "console") {
    return null;
  }

  const data = breadcrumb.data;
  if (data) {
    // Node's http breadcrumb keeps the parameter names here (`?token=[Filtered]`).
    delete data["http.query"];
    delete data["http.fragment"];
    for (const field of URL_BREADCRUMB_FIELDS) {
      const value = data[field];
      if (typeof value === "string") {
        data[field] = stripQuery(value);
      }
    }
  }

  return breadcrumb;
}
