import Anthropic from "@anthropic-ai/sdk";

// A browser-like User-Agent — many official sites return 403 / a block page to
// the default fetch agent. This recovers a chunk of otherwise-failing scrapes.
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const FETCH_INIT: RequestInit = {
  headers: {
    "User-Agent": BROWSER_UA,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
  },
};

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
export async function scrapeSatDates(): Promise<
  { test: string; regDeadline: string }[]
> {
  try {
    // 1. Fetch the official SAT dates page
    const res = await fetch(
      "https://satsuite.collegeboard.org/sat/dates-deadlines",
      FETCH_INIT,
    );
    if (!res.ok) {
      console.error(
        `[scrapeSatDates] fetch failed: ${res.status} ${res.statusText}`,
      );
      return [];
    }
    const rawHtml = await res.text();

    // 2. Clean the HTML to reduce token usage
    const text = cleanHtml(rawHtml);

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
      console.error("[scrapeSatDates] unexpected content type:", content.type);
      return [];
    }

    const parsed: unknown = JSON.parse(content.text);
    if (!Array.isArray(parsed)) {
      console.error("[scrapeSatDates] response is not an array");
      return [];
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
    return results;
  } catch (err) {
    console.error("[scrapeSatDates] error:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Competition deadlines
// ---------------------------------------------------------------------------

/**
 * Scrape the next registration/submission deadline for a given academic
 * competition from its website.
 *
 * @param url  – Direct URL to the competition's dates / registration page.
 * @param name – Human-readable competition name (used in the Claude prompt).
 *
 * Returns `{ deadline, window }` on success, or `null` when the data cannot
 * be extracted. Never throws.
 */
export async function scrapeCompetitionDeadline(
  url: string,
  name: string,
): Promise<{ deadline: string; window: string } | null> {
  try {
    // 1. Fetch the competition page
    const res = await fetch(url, FETCH_INIT);
    if (!res.ok) {
      console.error(
        `[scrapeCompetitionDeadline] fetch failed for ${name}: ${res.status} ${res.statusText}`,
      );
      return null;
    }
    const rawHtml = await res.text();

    // 2. Clean the HTML
    const text = cleanHtml(rawHtml);

    // 3. Ask Claude to extract the deadline
    const today = new Date().toISOString().slice(0, 10);
    const anthropic = getClient();
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 2000,
      system: [
        `You are a careful data-extraction assistant. Today's date is ${today}.`,
        `From the provided HTML of the "${name}" competition website, extract the NEXT registration or submission deadline that is in the FUTURE relative to today, for the upcoming cycle.`,
        ``,
        `Be conservative — a wrong date causes students to miss real deadlines:`,
        `- Only return a date you can clearly tie to "${name}"'s next cycle.`,
        `- IGNORE dates from past/previous cycles still shown on the page.`,
        `- If the page only shows past dates, no clear date, or you are at all unsure which date is the real upcoming deadline, return null.`,
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
      console.error(
        `[scrapeCompetitionDeadline] unexpected content type for ${name}:`,
        content.type,
      );
      return null;
    }

    const trimmed = content.text.trim();

    // Claude may respond with the literal string "null"
    if (trimmed === "null") return null;

    const parsed: unknown = JSON.parse(trimmed);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("deadline" in parsed) ||
      !("window" in parsed)
    ) {
      console.error(
        `[scrapeCompetitionDeadline] malformed response for ${name}`,
      );
      return null;
    }

    const obj = parsed as { deadline: string; window: string };

    // 5. Validate the deadline date
    if (
      typeof obj.deadline !== "string" ||
      typeof obj.window !== "string" ||
      !isValidISODate(obj.deadline)
    ) {
      console.error(
        `[scrapeCompetitionDeadline] invalid date for ${name}:`,
        obj.deadline,
      );
      return null;
    }

    return { deadline: obj.deadline, window: obj.window };
  } catch (err) {
    console.error(`[scrapeCompetitionDeadline] error for ${name}:`, err);
    return null;
  }
}
