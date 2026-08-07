/**
 * The write side of site traffic: cookie contract + the small pure functions
 * that decide what a raw request is allowed to turn into.
 *
 * Edge-safe on purpose — `lib/supabase/middleware.ts` imports it, so nothing
 * here may touch `node:*`, the database, or `next/headers`.
 *
 * Everything in this file is a pure function over strings for one reason: these
 * are the decisions that determine whether the numbers on /admin/traffic mean
 * anything (is this a bot? is this a real referral or our own site? does this
 * path carry a query string we must not store?), and a decision that can't be
 * unit-tested is a decision nobody can check. See scripts/test-engine.ts.
 */

export const VISITOR_COOKIE = "compass_vid";
export const SESSION_COOKIE = "compass_sid";

/** A browser stays the same visitor for a year. */
export const VISITOR_MAX_AGE = 60 * 60 * 24 * 365;
/**
 * 30 minutes of inactivity ends the visit. Re-set on every request, so the
 * window slides — it is an inactivity timeout, not a hard session length.
 */
export const SESSION_MAX_AGE = 60 * 30;

export type Device = "mobile" | "tablet" | "desktop";

/** Longest path we will store. Paths are our own routes; nothing is near this. */
const MAX_PATH = 200;
const MAX_HOST = 100;

/**
 * Bots that execute JavaScript are rare, and the tracker only runs in the
 * browser — so most crawlers never reach us at all. This catches the ones that
 * do: headless checkers, link previewers, and uptime pingers, all of which
 * would otherwise read as a real person who bounced in 0 seconds.
 */
const BOT = /bot|crawl|spider|slurp|headless|phantom|puppeteer|playwright|lighthouse|preview|monitor|uptime|curl|wget|python-requests|axios|facebookexternalhit|whatsapp|telegram|discord|vercel|screaming|semrush|ahrefs|dataprovider|pingdom/i;

export function isBot(userAgent: string | null | undefined): boolean {
  if (!userAgent) return true; // no UA at all is never a browser
  return BOT.test(userAgent);
}

/**
 * Coarse device class. Three buckets, not a device database: the only decision
 * this ever informs is "are we designing for phones or desktops", and a wrong
 * guess on an exotic tablet costs nothing.
 */
export function deviceFromUA(userAgent: string | null | undefined): Device {
  const ua = (userAgent ?? "").toLowerCase();
  if (!ua) return "desktop";
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android|blackberry|iemobile|opera mini/.test(ua))
    return "mobile";
  return "desktop";
}

/**
 * Pathname only — the query string and hash are cut off here and never reach
 * the database.
 *
 * This is the privacy boundary of the whole feature and it is one line: URLs on
 * this site carry `?ref=` ambassador codes, `?next=` return paths, and auth
 * callback tokens. None of that is traffic data, and a token in an analytics
 * table is a token that leaks into every screenshot of it.
 *
 * Returns null when there is nothing storable.
 */
export function cleanPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cut = raw.split("?")[0].split("#")[0].trim();
  if (!cut.startsWith("/")) return null;
  // Trailing slash is noise: /guide and /guide/ are one page, and splitting
  // them across two rows quietly halves the top-pages table.
  const normal = cut.length > 1 ? cut.replace(/\/+$/, "") || "/" : "/";
  return normal.slice(0, MAX_PATH);
}

/**
 * Paths we deliberately do not record.
 *
 * `/admin` is excluded because the founder reading this dashboard would
 * otherwise be a large share of the traffic it reports — a dashboard that
 * counts its own audience tells you about yourself, not your students.
 */
export function shouldTrack(path: string): boolean {
  return !(
    path.startsWith("/admin") ||
    path.startsWith("/api") ||
    path.startsWith("/auth")
  );
}

/**
 * Is traffic to this host worth counting?
 *
 * No for localhost and for `*.vercel.app` preview deploys. Both are visited
 * almost exclusively by whoever is building the site, and both write into the
 * same production database — so without this, a week of development shows up
 * on the dashboard as a surge of engaged returning visitors reading /guide
 * forty times. Set `TRACK_LOCAL=1` to record them anyway while testing.
 */
export function isMeasurableHost(host: string | null | undefined): boolean {
  const h = (host ?? "").toLowerCase().split(":")[0];
  if (!h) return false;
  if (h === "localhost" || h === "127.0.0.1" || h === "[::1]") return false;
  if (h.endsWith(".local") || h.endsWith(".vercel.app")) return false;
  return true;
}

/**
 * The external hostname a visitor arrived from, or null.
 *
 * Null covers both "typed it in / no referrer" and "clicked a link inside our
 * own site" — the summary shows both as Direct, because an internal referrer is
 * not a traffic source, it is us.
 */
export function externalHost(
  referrer: string | null | undefined,
  selfHost: string | null | undefined
): string | null {
  if (!referrer) return null;
  let host: string;
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (!host) return null;
  const self = (selfHost ?? "").toLowerCase().split(":")[0];
  if (self && (host === self || host.endsWith(`.${self}`))) return null;
  return host.replace(/^www\./, "").slice(0, MAX_HOST);
}

/** 2-letter country code from a CDN header, or null. */
export function cleanCountry(raw: string | null | undefined): string | null {
  const code = (raw ?? "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

/**
 * A visitor may not report more time on a page than could plausibly have
 * passed. Without a ceiling one tab left open over a weekend turns the median
 * visit into two days, and the beacon payload is client-supplied, so this is
 * also the only thing stopping a hand-written request from doing it on purpose.
 */
export const MAX_DWELL_MS = 60 * 60 * 1000; // 1 hour

export function cleanDwell(raw: unknown): number | null {
  const ms = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(ms) || ms <= 0) return null;
  return Math.min(Math.round(ms), MAX_DWELL_MS);
}
