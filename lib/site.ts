/** The single canonical production domain. Change here to rebrand everywhere. */
export const CANONICAL_HOST = "applycompass.app";
export const CANONICAL_URL = `https://${CANONICAL_HOST}`;

/**
 * The address a reader writes to. It was spelled out separately in
 * `app/privacy/page.tsx` and `app/terms/page.tsx`, which is two copies of the
 * one fact a person needs when something has gone wrong — and the structured
 * data on the home page now states it a third time. Two of those three would
 * have gone stale the first time it changed.
 */
export const CONTACT_EMAIL = "alibek196u@gmail.com";

/**
 * How long an organisation waits to hear back after applying.
 *
 * The application said only that we would write to them, which leaves the one
 * question a person actually has — "so do I wait, or did this go nowhere?" —
 * unanswered, and an unanswered wait is where an application is abandoned. It
 * is stated before the form as well as after it, because it is a reason to
 * start rather than a consolation for having finished.
 *
 * This is a PROMISE, not a description, and it is a single string so that it is
 * one edit when it stops being true. Shorten it or lengthen it to whatever can
 * actually be met — a stated window that is missed costs more trust than the
 * silence it replaced.
 */
export const REPLY_WINDOW = "two working days";

/**
 * Absolute URL of the CURRENT request origin. Used for OAuth/email redirect
 * targets so auth resolves to whatever host is actually serving the app
 * (localhost in dev, the canonical domain in prod).
 */
export function siteUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/**
 * Absolute base for shareable, branded links (ambassador referral links, OG
 * tags). Always the canonical domain so a copied link works no matter which
 * host it was generated on.
 */
export function shareUrl() {
  return CANONICAL_URL;
}
