/** The single canonical production domain. Change here to rebrand everywhere. */
export const CANONICAL_HOST = "applycompass.app";
export const CANONICAL_URL = `https://${CANONICAL_HOST}`;

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
