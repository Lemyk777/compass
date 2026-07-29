// Opportunity discovery engine.
//
// Finds NEW competitions/olympiads that are not yet in the curated registry
// (lib/data/key-dates.ts) and turns them into `competition_candidates` rows
// for human review. Nothing discovered here ever reaches a student directly:
// the admin approves candidates at /admin/opportunities, and only then does a
// row land in `competition_deadlines` (which resolveCompetitions() merges
// into the student-facing pool).
//
// Pipeline per faculty:
//   1. Haiku + the web_search server tool finds candidates (name, official
//      URL, claimed deadline, eligibility).
//   2. Dedup against the code registry + already-known DB rows.
//   3. DATE VERIFICATION: we fetch the candidate's own official page and
//      independently re-extract the deadline with the existing
//      scrapeCompetitionDeadline() guardrail pattern. Only a page-sourced,
//      future, in-range date is marked date_confirmed — a date the model
//      merely claimed from search results never is. Unconfirmed dates render
//      as "Dates not yet announced" in the UI, never a countdown.

import Anthropic from "@anthropic-ai/sdk";
import { FACULTY_LABEL, FACULTY_VALUES, type FacultyValue } from "@/lib/data/faculties";
import type { LocalTarget } from "@/lib/data/geo";
import {
  COMPETITIONS,
  type CompetitionCategory,
  type CompetitionLevel,
  type CompetitionTier,
} from "@/lib/data/key-dates";
import {
  isValidISODate,
  parseJsonLoose,
  scrapeCompetitionDeadline,
} from "@/lib/scraper/scrape-dates";

export type CandidateRow = {
  id: string;
  name: string;
  url: string;
  fields: FacultyValue[] | "all";
  level: CompetitionLevel;
  category: CompetitionCategory;
  tier: CompetitionTier;
  deadline: string | null; // ISO YYYY-MM-DD
  event_window: string;
  blurb: string;
  eligibility: string | null;
  date_confirmed: boolean;
  date_evidence: string;
  source: string;
  // Geographic scope: null = global, ISO-2 code = local to that country.
  region: string | null;
  city: string | null;
};

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 1 });
  }
  return _client;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Cyrillic → latin so local (KZ/RU-named) opportunities get real slugs instead
// of empty/colliding ids ("Олимпиада Мёбиус" must not slug to "").
const CYR: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
  и: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  // Kazakh-specific letters
  ә: "a", ғ: "g", қ: "k", ң: "n", ө: "o", ұ: "u", ү: "u", һ: "h", і: "i",
};

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[Ѐ-ӿ]/g, (ch) => CYR[ch] ?? "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Hostname without www — the dedup key for "same competition, same site". */
function urlHost(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** Loose name key: lowercase alphanumerics only. */
function nameKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const LEVELS: CompetitionLevel[] = ["international", "national", "regional"];
const TIERS: CompetitionTier[] = ["accessible", "selective", "elite"];
const CATEGORIES: CompetitionCategory[] = [
  "competition",
  "olympiad",
  "course",
  "research_program",
  "summer_program",
];

function daysFromToday(iso: string): number {
  const ms = new Date(iso + "T00:00:00Z").getTime() - Date.now();
  return Math.round(ms / 86_400_000);
}

// ---------------------------------------------------------------------------
// Step 1 — web-search discovery via Haiku
// ---------------------------------------------------------------------------

type RawCandidate = {
  name: string;
  url: string;
  fields: string[] | "all";
  level: string;
  category: string;
  tier: string;
  deadline: string | null;
  event_window: string;
  blurb: string;
  eligibility: string | null;
  city: string | null;
};

// The JSON contract both search prompts share.
function jsonContract(extraFields: string[]): string[] {
  return [
    `Return ONLY a JSON array (no prose, no markdown fences). Each element:`,
    `{`,
    `  "name": "official name",`,
    `  "url": "https://official-site...",`,
    `  "fields": subset of ${JSON.stringify(FACULTY_VALUES)} or "all",`,
    `  "level": "international" | "national" | "regional",`,
    `  "category": "competition" | "olympiad" | "course" | "research_program" | "summer_program",`,
    `  "tier": "accessible" (entry-level) | "selective" (national-calibre) | "elite" (world-class flagship),`,
    `  "deadline": "YYYY-MM-DD" next registration/submission deadline if you clearly found one, else null,`,
    `  "event_window": "short human timing, e.g. 'Finals in May'",`,
    `  "blurb": "one sentence on why it matters for an applicant profile",`,
    `  "eligibility": "the age/grade gate as the organizer states it" or null,`,
    ...extraFields,
    `}`,
  ];
}

/** One streamed Haiku call with web search → parsed raw candidates. */
async function runSearch(
  system: string,
  userContent: string,
  tag: string,
): Promise<RawCandidate[]> {
  const anthropic = getClient();
  const stream = anthropic.messages.stream({
    model: "claude-haiku-4-5",
    max_tokens: 4000,
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }],
    system,
    messages: [{ role: "user", content: userContent }],
  });
  const message = await stream.finalMessage();

  // The final text block carries the JSON array (search-result blocks precede it).
  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  const parsed = parseJsonLoose(text);
  if (!Array.isArray(parsed)) {
    console.error(`[discover] no JSON array in response for ${tag}:`, text.slice(0, 200));
    return [];
  }

  const candidates: RawCandidate[] = [];
  for (const item of parsed) {
    if (typeof item !== "object" || item === null) continue;
    const c = item as Record<string, unknown>;
    if (typeof c.name !== "string" || typeof c.url !== "string") continue;
    if (!/^https?:\/\//.test(c.url)) continue;
    candidates.push({
      name: c.name.trim(),
      url: c.url.trim(),
      fields:
        c.fields === "all"
          ? "all"
          : Array.isArray(c.fields)
            ? (c.fields.filter((f) => typeof f === "string") as string[])
            : [],
      level: typeof c.level === "string" ? c.level : "national",
      category: typeof c.category === "string" ? c.category : "competition",
      tier: typeof c.tier === "string" ? c.tier : "accessible",
      deadline: typeof c.deadline === "string" ? c.deadline : null,
      event_window: typeof c.event_window === "string" ? c.event_window : "",
      blurb: typeof c.blurb === "string" ? c.blurb : "",
      eligibility: typeof c.eligibility === "string" ? c.eligibility : null,
      city: typeof c.city === "string" && c.city.trim() ? c.city.trim() : null,
    });
  }
  return candidates;
}

/**
 * GLOBAL discovery: opportunities in one faculty that are OPEN TO INTERNATIONAL
 * high-school students. Returns raw, unverified candidates — the caller dedups
 * and verifies dates before anything is stored.
 */
export async function searchCandidates(
  faculty: FacultyValue,
  knownNames: string[],
): Promise<{ candidates: RawCandidate[]; query: string }> {
  const label = FACULTY_LABEL[faculty];
  const query = `discover: ${label} opportunities for international high school students`;

  const system = [
    `You are a research assistant for a university-admissions guidance tool.`,
    `Task: find real, currently-running academic competitions, olympiads, essay prizes, research fairs, summer programs or challenges in the field of ${label} that INTERNATIONAL high-school students (outside the US) can enter.`,
    ``,
    `Hard requirements — exclude anything that:`,
    `- is restricted to citizens/residents of one country (e.g. "US citizens only"),`,
    `- is a pay-to-win award mill, vanity award, or has no real selection,`,
    `- is for university students or adults only,`,
    `- is already in this known list: ${knownNames.join("; ")}.`,
    ``,
    `Use web search to verify each item has a real official website. Prefer the organizer's own domain as "url" (never an aggregator/blog link).`,
    ``,
    ...jsonContract([`  "city": null`]),
    ``,
    `Quality over quantity: return at most 6 items you are confident are real and international-friendly. If unsure about an item, leave it out.`,
  ].join("\n");

  const candidates = await runSearch(
    system,
    `Find ${label} opportunities open to international high-school students for the upcoming admissions cycle.`,
    faculty,
  );
  return { candidates, query };
}

/**
 * LOCAL discovery: opportunities inside ONE country (down to city level) for
 * that country's school students — national olympiad stages, city hackathons,
 * local summer schools, university-run circles. Searched in the local
 * language(s), because that's where these are announced.
 */
export async function searchLocalCandidates(
  target: LocalTarget,
  knownNames: string[],
): Promise<{ candidates: RawCandidate[]; query: string }> {
  const query = `discover-local: school-student opportunities in ${target.name}`;

  const system = [
    `You are a research assistant for a university-admissions guidance tool used by school students in ${target.name}.`,
    `Task: find real, currently-running opportunities INSIDE ${target.name} that school students there can join: national olympiads and their stages, local competitions and hackathons, summer schools, research programs, university-run courses/circles for schoolchildren.`,
    `Search in ${target.searchLanguages} — local opportunities are announced in local languages. Include city-level events in: ${target.cities.join(", ")}.`,
    ``,
    `Hard requirements — exclude anything that:`,
    `- is a pay-to-win award mill, vanity award, or has no real selection or substance,`,
    `- is for university students or adults only,`,
    `- has no official page at all (an organizer's site or the organizer's official social page is acceptable),`,
    `- is already in this known list: ${knownNames.join("; ")}.`,
    ``,
    `Use web search to verify each item is real and current. "url" must be the organizer's own page.`,
    ``,
    ...jsonContract([
      `  "city": "city name if the event is city-scoped (e.g. "${target.cities[0]}"), null if country-wide"`,
    ]),
    ``,
    `Notes: "name" and "blurb" must be in English (translate if the source is not); "level" for these is "national" or "regional".`,
    `Quality over quantity: return at most 6 items you are confident are real. If unsure, leave it out.`,
  ].join("\n");

  const candidates = await runSearch(
    system,
    `Find current competitions, olympiads, summer schools and programs for school students in ${target.name} (country-wide and in ${target.cities.join(", ")}).`,
    `local:${target.code}`,
  );
  return { candidates, query };
}

// ---------------------------------------------------------------------------
// Step 2+3 — dedup, sanitize, verify dates
// ---------------------------------------------------------------------------

/** Registry dedup keys, computed once. */
function registryKeys(): { hosts: Set<string>; names: Set<string>; ids: Set<string> } {
  const hosts = new Set<string>();
  const names = new Set<string>();
  const ids = new Set<string>();
  for (const c of COMPETITIONS) {
    const h = urlHost(c.url);
    if (h) hosts.add(h);
    names.add(nameKey(c.name));
    ids.add(c.id);
  }
  return { hosts, names, ids };
}

/**
 * Turn raw search output into verified candidate rows.
 *
 * `knownIds` = ids already present in competition_deadlines or
 * competition_candidates (any status), so re-runs never re-surface something
 * the admin already rejected.
 */
export async function verifyCandidates(
  raw: RawCandidate[],
  knownIds: Set<string>,
  source: string,
  // ISO-2 code for local batches ("KZ"); null/omitted for global discovery.
  region: string | null = null,
): Promise<CandidateRow[]> {
  const reg = registryKeys();
  const out: CandidateRow[] = [];
  const seenThisRun = new Set<string>();

  for (const c of raw) {
    const id = slugify(c.name);
    if (!id) continue;
    const host = urlHost(c.url);
    if (!host) continue;

    // Dedup: registry (id, host, name), DB rows, and this batch.
    if (
      reg.ids.has(id) ||
      reg.hosts.has(host) ||
      reg.names.has(nameKey(c.name)) ||
      knownIds.has(id) ||
      seenThisRun.has(id)
    ) {
      continue;
    }
    seenThisRun.add(id);

    // Sanitize enums.
    const level = (LEVELS as string[]).includes(c.level) ? (c.level as CompetitionLevel) : "national";
    const tier = (TIERS as string[]).includes(c.tier) ? (c.tier as CompetitionTier) : "accessible";
    const category = (CATEGORIES as string[]).includes(c.category)
      ? (c.category as CompetitionCategory)
      : "competition";
    const fields =
      c.fields === "all"
        ? ("all" as const)
        : (c.fields.filter((f) => (FACULTY_VALUES as string[]).includes(f)) as FacultyValue[]);
    if (fields !== "all" && fields.length === 0) continue;

    // URL alive check — a dead official site disqualifies the candidate.
    let alive = false;
    try {
      const res = await fetch(c.url, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(10_000),
      });
      alive = res.ok;
    } catch {
      alive = false;
    }
    if (!alive) {
      console.warn(`[discover] dropping ${id}: official URL not reachable (${c.url})`);
      continue;
    }

    // Date verification: re-extract the deadline from the official page
    // itself. The search-derived date is never trusted on its own.
    let deadline: string | null = null;
    let window = c.event_window;
    let confirmed = false;
    let evidence = "";

    const scraped = await scrapeCompetitionDeadline(c.url, c.name);
    if (scraped && isValidISODate(scraped.deadline)) {
      const d = daysFromToday(scraped.deadline);
      if (d >= 0 && d <= 430) {
        deadline = scraped.deadline;
        window = scraped.window || window;
        confirmed = true;
        evidence = `Deadline ${scraped.deadline} extracted from the official page (${d} days out).`;
      } else {
        evidence = `Official page yielded ${scraped.deadline}, rejected (${d} days from today — out of range).`;
      }
    }
    if (!confirmed) {
      // Fall back to the search-claimed date as an UNCONFIRMED estimate.
      if (c.deadline && isValidISODate(c.deadline) && daysFromToday(c.deadline) >= 0 && daysFromToday(c.deadline) <= 430) {
        deadline = c.deadline;
        evidence = evidence || `Search-claimed deadline ${c.deadline}; could not confirm on the official page.`;
      } else {
        evidence = evidence || "No verifiable deadline found; dates will show as not yet announced.";
      }
    }

    out.push({
      id,
      name: c.name,
      url: c.url,
      fields,
      level,
      category,
      tier,
      deadline,
      event_window: window,
      blurb: c.blurb.slice(0, 200),
      eligibility: c.eligibility ? c.eligibility.slice(0, 200) : null,
      date_confirmed: confirmed,
      date_evidence: evidence,
      source,
      region,
      city: region ? c.city : null, // a city only makes sense on a local row
    });
  }

  return out;
}

/** All names the search prompt should treat as already known. */
export function knownCompetitionNames(extra: string[]): string[] {
  return [...COMPETITIONS.map((c) => c.name), ...extra];
}
