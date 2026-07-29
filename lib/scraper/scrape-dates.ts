import Anthropic from "@anthropic-ai/sdk";

// A browser-like User-Agent — many official sites return 403 / a block page to
// the default fetch agent. This recovers a chunk of otherwise-failing scrapes.
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

// Hard per-site timeout. Without it a single hanging site stalls the whole
// cron run until Vercel kills the function (FUNCTION_INVOCATION_TIMEOUT) and
// NOTHING gets synced — which is exactly what happened before batching.
const FETCH_TIMEOUT_MS = 10_000;

const FETCH_INIT: RequestInit = {
  headers: {
    "User-Agent": BROWSER_UA,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
  },
};

/** FETCH_INIT with a fresh timeout signal (signals are single-use). */
function fetchInit(): RequestInit {
  return { ...FETCH_INIT, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Strip heavy / non-content HTML elements and tags, returning plain text.
 * Truncated to 15 000 chars so we stay well within Claude's token budget.
 */
export function cleanHtml(html: string): string {
  let cleaned = html;

  // Remove entire blocks that never contain useful deadline data
  const stripTags = ["script", "style", "nav", "footer", "header"];
  for (const tag of stripTags) {
    // Handles attributes, multiline content, and nested self-closing tags
    cleaned = cleaned.replace(
      new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi"),
      "",
    );
  }

  // Strip remaining HTML tags but keep text content
  cleaned = cleaned.replace(/<[^>]+>/g, " ");

  // Collapse whitespace runs into a single space
  cleaned = cleaned.replace(/\s{2,}/g, " ").trim();

  // Hard cap to control token usage
  return cleaned.slice(0, 15_000);
}

// ---------------------------------------------------------------------------
// Finding the page that actually holds the dates
// ---------------------------------------------------------------------------

// A competition's landing page is marketing; the real deadline almost always
// lives one click away ("Key dates", "Apply", "Calendar"). Scraping only the
// landing page is why every extraction returned null in production — e.g.
// nmun.org has no deadline text at all, but links to
// /register-and-key-dates.html. These weights rank the candidate links.
// Order matters: "events" is deliberately the weakest real signal. Ranking it
// with the others let a generic "alumni events" page outrank an "apply" page
// carrying the actual deadline — dates on the page, wrong dates entirely.
const LINK_SIGNALS: { re: RegExp; score: number }[] = [
  { re: /key[-\s_]?dates|dates[-\s_]?(and|&)?[-\s_]?deadlines?|important[-\s_]?dates/i, score: 10 },
  { re: /deadlines?/i, score: 8 },
  { re: /how[-\s_]?to[-\s_]?(participate|enter|apply)/i, score: 7 },
  { re: /apply|application/i, score: 7 },
  { re: /calendar|schedule/i, score: 6 },
  { re: /register|registration/i, score: 6 },
  { re: /events?/i, score: 4 }, // last resort — often unrelated to the entry deadline
  { re: /rules|guidelines|eligibility/i, score: 3 },
];

// Never follow these — they burn a fetch without carrying dates.
const LINK_REJECT =
  /\.(pdf|jpg|jpeg|png|gif|svg|zip|docx?|xlsx?)($|\?)|^(mailto|tel|javascript):|facebook\.com|instagram\.com|twitter\.com|x\.com|youtube\.com|linkedin\.com|tiktok\.com/i;

// With the off-site penalty below, this admits an off-site "apply" portal
// (6 − 2) — those are real application sites (embark.com, my.site.com) — while
// still rejecting vaguer off-site wording like a bare "rules" link.
const MIN_LINK_SCORE = 4;
const OFFSITE_PENALTY = 2;

/** First path segment ("/programs/apply-rsi" → "programs"), "" at the root. */
function sectionOf(pathname: string): string {
  return pathname.split("/").filter(Boolean)[0] ?? "";
}

/**
 * Rank in-page links by how likely they are to carry the real deadline, best
 * first. Returns absolute URLs (max `limit`), deduped and self-excluded.
 *
 * Cross-origin links are allowed but penalised: application portals genuinely
 * live on other hosts (embark.com, my.site.com), yet most off-site links are
 * noise, so they only survive when the wording is strong.
 */
export function findDatePages(html: string, baseUrl: string, limit = 2): string[] {
  let base: URL;
  try {
    base = new URL(baseUrl);
  } catch {
    return [];
  }

  const baseSection = sectionOf(base.pathname);
  const scored = new Map<string, number>();
  const anchors = html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]{0,120}?)<\/a>/gi);

  for (const m of anchors) {
    const href = m[1].trim();
    const label = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!href || LINK_REJECT.test(href)) continue;

    let abs: URL;
    try {
      abs = new URL(href, base);
    } catch {
      continue;
    }
    if (!/^https?:$/.test(abs.protocol)) continue;
    abs.hash = "";
    const url = abs.toString();
    if (url.replace(/\/$/, "") === baseUrl.replace(/\/$/, "")) continue;

    const haystack = `${abs.pathname} ${label}`;
    let score = 0;
    for (const s of LINK_SIGNALS) if (s.re.test(haystack)) score = Math.max(score, s.score);
    if (score === 0) continue;
    if (abs.host !== base.host) score -= OFFSITE_PENALTY; // only strong wording survives off-site
    // Stay in the same section of the site as the landing page. On cee.org the
    // landing page is /programs/research-science-institute, so /programs/apply-rsi
    // is about THIS program while /about-us/alumni-events is a different one.
    if (baseSection && abs.host === base.host && sectionOf(abs.pathname) === baseSection) {
      score += 2;
    }
    if (score < MIN_LINK_SCORE) continue;

    scored.set(url, Math.max(scored.get(url) ?? 0, score));
  }

  return [...scored.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([url]) => url);
}

/** Fetch + clean one page, or null on any failure. Never throws. */
async function fetchClean(url: string, budget: number): Promise<string | null> {
  try {
    const res = await fetch(url, fetchInit());
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "";
    if (type && !/html|text/i.test(type)) return null;
    return cleanHtml(await res.text()).slice(0, budget);
  } catch {
    return null;
  }
}

/**
 * Parse JSON out of a model reply that may carry markdown fences or a
 * sentence of preamble ("Here is the JSON: ```json [...]```").
 *
 * The previous code called JSON.parse on the raw reply, so a single stray
 * character threw and the whole scrape silently returned "nothing found" —
 * indistinguishable from a page that genuinely has no dates. Returns null
 * when there is no parseable JSON value of the expected shape.
 */
export function parseJsonLoose(reply: string): unknown {
  const text = reply.replace(/```(?:json)?/gi, "").trim();
  if (text === "null") return null;

  const candidates: [number, number][] = [];
  const arr: [number, number] = [text.indexOf("["), text.lastIndexOf("]")];
  const obj: [number, number] = [text.indexOf("{"), text.lastIndexOf("}")];
  // Prefer whichever bracket opens first, so an object inside an array (or a
  // sentence containing a brace) can't hijack the parse.
  if (arr[0] !== -1 && arr[1] > arr[0]) candidates.push(arr);
  if (obj[0] !== -1 && obj[1] > obj[0]) candidates.push(obj);
  candidates.sort((a, b) => a[0] - b[0]);

  for (const [start, end] of candidates) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      // try the next shape
    }
  }
  return null;
}

/**
 * Validate that a string is a well-formed ISO date (YYYY-MM-DD) pointing to a
 * real calendar day (e.g. rejects 2025-02-30).
 */
export function isValidISODate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;

  const d = new Date(s + "T00:00:00Z");
  if (isNaN(d.getTime())) return false;

  // Ensure the parsed date round-trips back to the same string.
  // This catches impossible dates like Feb 30 where the Date constructor
  // silently rolls forward.
  const [y, m, day] = s.split("-").map(Number);
  return (
    d.getUTCFullYear() === y &&
    d.getUTCMonth() + 1 === m &&
    d.getUTCDate() === day
  );
}

// ---------------------------------------------------------------------------
// Anthropic client (lazy singleton)
// ---------------------------------------------------------------------------

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
      maxRetries: 1,
    });
  }
  return _client;
}

// ---------------------------------------------------------------------------
// SAT dates
// ---------------------------------------------------------------------------

/**
 * Scrape upcoming SAT test dates and registration deadlines from the official
 * College Board page, using Claude to extract structured data from the HTML.
 *
 * Returns an array sorted by test date ascending. On any failure the function
 * returns an empty array so callers can fall back gracefully.
 */
export async function scrapeSatDates(): Promise<{
  sittings: { test: string; regDeadline: string }[];
  note: string;
}> {
  const fail = (note: string) => ({ sittings: [], note });
  try {
    // 1. Fetch the official SAT dates page
    const res = await fetch(
      "https://satsuite.collegeboard.org/sat/dates-deadlines",
      fetchInit(),
    );
    if (!res.ok) {
      return fail(`fetch_failed: ${res.status} ${res.statusText}`);
    }
    const rawHtml = await res.text();

    // 2. Clean the HTML to reduce token usage
    const text = cleanHtml(rawHtml);
    if (text.length < 200) return fail("no_content: page has no readable text");

    // 3. Ask Claude to extract structured data
    const anthropic = getClient();
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 2000,
      system: `You are a data extraction assistant. Extract SAT test dates and their registration deadlines from the provided HTML. Return ONLY a JSON array, no other text. Each element should have exactly two fields: "test" (ISO YYYY-MM-DD format) and "regDeadline" (ISO YYYY-MM-DD format). Only include future dates. Sort by test date ascending.`,
      messages: [{ role: "user", content: text }],
    });

    // 4. Parse the JSON response
    const content = message.content[0];
    if (content.type !== "text") {
      return fail(`model_error: content type ${content.type}`);
    }

    const parsed = parseJsonLoose(content.text);
    if (!Array.isArray(parsed)) {
      return fail(`declined: reply was ${content.text.trim().slice(0, 80)}`);
    }

    // 5. Validate every entry
    const results: { test: string; regDeadline: string }[] = [];
    for (const entry of parsed) {
      if (
        typeof entry === "object" &&
        entry !== null &&
        "test" in entry &&
        "regDeadline" in entry &&
        typeof entry.test === "string" &&
        typeof entry.regDeadline === "string" &&
        isValidISODate(entry.test) &&
        isValidISODate(entry.regDeadline)
      ) {
        results.push({ test: entry.test, regDeadline: entry.regDeadline });
      }
    }

    // 6. Return sorted by test date ascending
    results.sort((a, b) => a.test.localeCompare(b.test));
    return {
      sittings: results,
      note:
        results.length > 0
          ? `parsed ${results.length} of ${parsed.length} entries`
          : `declined: model returned ${parsed.length} entries, none valid`,
    };
  } catch (err) {
    // Auth / rate-limit / network against the model — previously indistinguishable
    // from "the page has no dates".
    const detail = err instanceof Error ? `${err.name}: ${err.message}` : "unknown";
    console.error("[scrapeSatDates] model call failed:", detail);
    return fail(`model_error: ${detail.slice(0, 160)}`);
  }
}

// ---------------------------------------------------------------------------
// Competition deadlines
// ---------------------------------------------------------------------------

// Why a scrape produced no date. "Nothing found" and "the model call blew up"
// used to be the same silent null in the cron report, which made a broken
// pipeline indistinguishable from a page that genuinely has no dates.
export type ScrapeFailure =
  | { ok: false; reason: "fetch_failed"; detail: string }
  | { ok: false; reason: "no_content"; detail: string }
  | { ok: false; reason: "model_error"; detail: string }
  | { ok: false; reason: "declined"; detail: string }
  | { ok: false; reason: "invalid_date"; detail: string };

export type ScrapeResult =
  | { ok: true; deadline: string; window: string; pagesRead: number }
  | ScrapeFailure;

/**
 * Scrape the next registration/submission deadline for a given academic
 * competition from its website (landing page + any linked dates page).
 *
 * @param url  – The competition's official URL.
 * @param name – Human-readable competition name (used in the Claude prompt).
 *
 * Never throws: every failure comes back as a typed reason.
 */
export async function scrapeCompetitionDeadline(
  url: string,
  name: string,
): Promise<ScrapeResult> {
  let rawHtml: string;
  try {
    // 1. Fetch the landing page
    const res = await fetch(url, fetchInit());
    if (!res.ok) {
      return { ok: false, reason: "fetch_failed", detail: `${res.status} ${res.statusText}` };
    }
    rawHtml = await res.text();
  } catch (err) {
    return {
      ok: false,
      reason: "fetch_failed",
      detail: err instanceof Error ? err.message : "unknown",
    };
  }

  // 2. Follow to the page that actually carries the dates. Landing pages are
  //    marketing — the deadline lives on "Key dates" / "Apply" / "Calendar".
  //    Reading only the landing page is what made every extraction return
  //    null in production. Still ONE model call: the pages are concatenated.
  const landing = cleanHtml(rawHtml).slice(0, 9_000);
  const sections = [`--- Landing page (${url}) ---`, landing];
  let pagesRead = 1;
  for (const sub of findDatePages(rawHtml, url)) {
    const subText = await fetchClean(sub, 9_000);
    if (subText && subText.length > 120) {
      sections.push(`--- Linked page (${sub}) ---`, subText);
      pagesRead++;
    }
  }
  const text = sections.join("\n").slice(0, 24_000);
  if (text.replace(/---[^\n]*---/g, "").trim().length < 200) {
    // Nothing readable — almost always a fully JS-rendered site.
    return { ok: false, reason: "no_content", detail: `${pagesRead} page(s), no readable text` };
  }

  try {
    // 3. Ask Claude to extract the deadline
    const today = new Date().toISOString().slice(0, 10);
    const anthropic = getClient();
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 2000,
      system: [
        `You are a careful data-extraction assistant. Today's date is ${today}.`,
        `You are given the text of one or more pages from the "${name}" competition website (its landing page, plus any linked dates/apply pages). Extract the NEXT registration or submission deadline that is in the FUTURE relative to today, for the upcoming cycle.`,
        ``,
        `Be conservative — a wrong date causes students to miss real deadlines:`,
        `- Only return a date you can clearly tie to "${name}"'s next cycle.`,
        `- IGNORE dates from past/previous cycles still shown on the pages.`,
        `- If a year is not stated next to a date, infer it only when the page makes the cycle unambiguous; otherwise return null.`,
        `- If the pages only show past dates, no clear date, or you are at all unsure which date is the real upcoming deadline, return null.`,
        ``,
        `Return ONLY one of:`,
        `- a JSON object {"deadline": "YYYY-MM-DD", "window": "<short timing, e.g. 'Contest in November'>"}, or`,
        `- the literal null.`,
      ].join("\n"),
      messages: [{ role: "user", content: text }],
    });

    // 4. Parse the JSON response
    const content = message.content[0];
    if (content.type !== "text") {
      return { ok: false, reason: "model_error", detail: `content type ${content.type}` };
    }

    const trimmed = content.text.trim();
    const parsed = parseJsonLoose(trimmed);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("deadline" in parsed) ||
      !("window" in parsed)
    ) {
      // A model that declines ("no upcoming date found") is a normal, honest
      // outcome — surface the reply so it stays diagnosable.
      return {
        ok: false,
        reason: "declined",
        detail: `${pagesRead} page(s) read; reply: ${trimmed.slice(0, 80)}`,
      };
    }

    const obj = parsed as { deadline: string; window: string };

    // 5. Validate the deadline date
    if (
      typeof obj.deadline !== "string" ||
      typeof obj.window !== "string" ||
      !isValidISODate(obj.deadline)
    ) {
      return { ok: false, reason: "invalid_date", detail: String(obj.deadline) };
    }

    return { ok: true, deadline: obj.deadline, window: obj.window, pagesRead };
  } catch (err) {
    // Auth, rate-limit or network failure against the model — this is the case
    // that used to masquerade as "no dates on the page".
    const detail = err instanceof Error ? `${err.name}: ${err.message}` : "unknown";
    console.error(`[scrapeCompetitionDeadline] model call failed for ${name}:`, detail);
    return { ok: false, reason: "model_error", detail: detail.slice(0, 160) };
  }
}
