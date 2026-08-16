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
//      URL, claimed deadline, eligibility). The search runs at an ANGLE that
//      rotates — see SEARCH_ANGLES — because asking one broad question about a
//      field returns the same famous six names however often you ask it.
//   2. Dedup + screening (lib/discovery/screen.ts) against the code registry
//      and known DB rows, then against the candidate's own page: a listing
//      site, a programme whose page says it ended, an eligibility rule no
//      student passes. This is the step that makes review cheap — a candidate
//      arrives with the page already read and the evidence quoted.
//   3. DATE VERIFICATION: we re-extract the deadline from that same official
//      page with the existing scrapeCompetitionDeadline() guardrail pattern.
//      Only a page-sourced, future, in-range date is marked date_confirmed — a
//      date the model merely claimed from search results never is. Unconfirmed
//      dates render as "Dates not yet announced", never a countdown.

import Anthropic from "@anthropic-ai/sdk";
import { FACULTY_LABEL, FACULTY_VALUES, type FacultyValue } from "@/lib/data/faculties";
import type { LocalTarget } from "@/lib/data/geo";
import {
  COMPETITION_CATEGORIES,
  COMPETITION_LEVELS,
  COMPETITION_TIERS,
  COMPETITIONS,
  type CompetitionCategory,
  type CompetitionLevel,
  type CompetitionTier,
} from "@/lib/data/key-dates";
import {
  buildRegistryIndex,
  dropReason,
  screenCandidate,
  shouldDrop,
  type RegistryEntry,
  type RegistryIndex,
  type ScreenWarning,
} from "@/lib/discovery/screen";
import {
  fetchPageText,
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
  /** What screening found on the candidate's own page — see screen.ts. */
  warnings: ScreenWarning[];
};

/** What one search + verification pass produced, for the run report. */
export type VerifyOutcome = {
  rows: CandidateRow[];
  /** Candidates that never reached the queue, and why — never a silent skip. */
  dropped: { name: string; reason: string }[];
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

// These three sanitize the model's enum output, and all three used to be
// hand-written copies of the catalog's own vocabularies. A `CompetitionLevel[]`
// literal is checked for wrong members and never for missing ones, so a new
// level or tier would have been silently rewritten to the fallback here — the
// same hole that lost a whole kind of opportunity its tab in release 3.
const LEVELS = COMPETITION_LEVELS;
const TIERS = COMPETITION_TIERS;

/**
 * Kinds discovery may NOT assign, stated as an exclusion so that adding a kind
 * forces a decision instead of quietly inheriting one.
 *
 * `community` is a place rather than an event and `simulation` names a real
 * employer's exercise — both are curated by hand, and a scraper guessing at
 * either would produce exactly the rows those kinds exist to keep honest.
 */
const NOT_DISCOVERABLE = [
  "community",
  "simulation",
] as const satisfies readonly CompetitionCategory[];

const CATEGORIES: readonly CompetitionCategory[] = COMPETITION_CATEGORIES.filter(
  (c): c is CompetitionCategory =>
    !(NOT_DISCOVERABLE as readonly string[]).includes(c),
);

function daysFromToday(iso: string): number {
  const ms = new Date(iso + "T00:00:00Z").getTime() - Date.now();
  return Math.round(ms / 86_400_000);
}

// ---------------------------------------------------------------------------
// Search angles
// ---------------------------------------------------------------------------

// One broad question per field ("find engineering opportunities for
// international high-school students") returns the same famous half-dozen every
// time it is asked, and after the first run they are all in the known list, so
// the second run returns almost nothing. The fix is not a bigger prompt: it is
// asking a NARROWER question each time. An angle is that question — a slice of
// the field the search has to stay inside, which forces the model past the
// obvious names and into the part of the web where the accessible, online,
// free-or-aided things our students can actually enter are announced.
//
// Rotating these is also what makes a repeat run on the SAME faculty worth
// paying for, which is what the admin's "run it now" button needs to be true.
export type SearchAngle = {
  key: string;
  /** What the admin picks it by. */
  label: string;
  /** The constraint appended to the system prompt. */
  hint: string;
};

export const SEARCH_ANGLES: SearchAngle[] = [
  {
    key: "open_worldwide",
    label: "Online, open worldwide, free or aided",
    hint: "Restrict yourself to things a student can enter ONLINE from any country, where entry is free or a fee waiver / financial aid exists. This is the highest-value slice for our students and the hardest to find, so look past the famous names.",
  },
  {
    key: "olympiad_open",
    label: "Olympiads with open individual registration",
    hint: "Restrict yourself to subject olympiads and exams a student can register for INDIVIDUALLY, without being picked for a national team first. State in `eligibility` whether national selection is required — if it is, leave the item out.",
  },
  {
    key: "research",
    label: "Research, mentorship and student journals",
    hint: "Restrict yourself to research programmes, mentorship schemes and peer-reviewed journals that accept school-age researchers, including remote ones.",
  },
  {
    key: "writing",
    label: "Essay, writing, debate and policy prizes",
    hint: "Restrict yourself to essay prizes, writing contests, debate and policy competitions open to school students — the accessible end of the humanities, law and economics, which the catalog is thinnest in.",
  },
  {
    key: "summer_aided",
    label: "Summer schools with aid or full funding",
    hint: "Restrict yourself to summer schools, camps and academies that are FREE, fully funded, or offer need-based aid to international students. A programme that costs several thousand dollars with no aid is not for this audience — leave it out.",
  },
  {
    key: "build",
    label: "Hackathons, design and maker challenges",
    hint: "Restrict yourself to hackathons, engineering/design challenges, robotics and maker competitions teenagers can enter as individuals or self-formed teams (not only through a school chapter).",
  },
];

export function angleByKey(key: string | null | undefined): SearchAngle | null {
  return SEARCH_ANGLES.find((a) => a.key === key) ?? null;
}

/** Deterministic rotation, so successive scheduled runs ask different questions. */
export function angleForRun(n: number): SearchAngle {
  return SEARCH_ANGLES[((n % SEARCH_ANGLES.length) + SEARCH_ANGLES.length) % SEARCH_ANGLES.length];
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
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 6 }],
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
  angle: SearchAngle = SEARCH_ANGLES[0],
): Promise<{ candidates: RawCandidate[]; query: string }> {
  const label = FACULTY_LABEL[faculty];
  const query = `discover: ${label} · ${angle.label}`;

  const system = [
    `You are a research assistant for a university-admissions guidance tool.`,
    `Task: find real, currently-running academic competitions, olympiads, essay prizes, research fairs, summer programs or challenges in the field of ${label} that INTERNATIONAL high-school students (outside the US) can enter.`,
    ``,
    `THIS SEARCH'S ANGLE — ${angle.label}. ${angle.hint}`,
    ``,
    `Who this is for: school students in Kazakhstan, Uzbekistan, the wider CIS and other countries with no first-tier network. A student in London or Boston is already drowning in options; the point is the student who has to hunt. An opportunity that requires being at a US school, having a teacher-coordinator, or paying several thousand dollars is not useful to them.`,
    ``,
    `Hard requirements — exclude anything that:`,
    `- is restricted to citizens/residents of one country (e.g. "US citizens only"),`,
    `- is a pay-to-win award mill, vanity award, or has no real selection,`,
    `- is for university students or adults only,`,
    `- has ended: check the page says the NEXT edition is running, not that the last one was in 2024,`,
    `- is already in this known list: ${knownNames.join("; ")}.`,
    ``,
    `Use web search to verify each item has a real official website. "url" must be the organizer's own domain — never an aggregator, listing site or blog (opportunitydesk, youthop, scholarships.com, Medium and the like are not acceptable, even when they are the top search result).`,
    ``,
    ...jsonContract([`  "city": null`]),
    ``,
    `Quality over quantity: return at most 8 items you are confident are real and international-friendly. If unsure about an item, leave it out.`,
  ].join("\n");

  const candidates = await runSearch(
    system,
    `Find ${label} opportunities open to international high-school students for the upcoming admissions cycle. Angle: ${angle.label}.`,
    `${faculty}/${angle.key}`,
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
  angle: SearchAngle | null = null,
): Promise<{ candidates: RawCandidate[]; query: string }> {
  const query = `discover-local: ${target.name}${angle ? ` · ${angle.label}` : ""}`;

  const system = [
    `You are a research assistant for a university-admissions guidance tool used by school students in ${target.name}.`,
    `Task: find real, currently-running opportunities INSIDE ${target.name} that school students there can join: national olympiads and their stages, local competitions and hackathons, summer schools, research programs, university-run courses/circles for schoolchildren.`,
    `Search in ${target.searchLanguages} — local opportunities are announced in local languages. Include city-level events in: ${target.cities.join(", ")}.`,
    ...(angle ? [``, `THIS SEARCH'S ANGLE — ${angle.label}. ${angle.hint}`] : []),
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
    `Find current competitions, olympiads, summer schools and programs for school students in ${target.name} (country-wide and in ${target.cities.join(", ")}).${angle ? ` Angle: ${angle.label}.` : ""}`,
    `local:${target.code}${angle ? `/${angle.key}` : ""}`,
  );
  return { candidates, query };
}

// ---------------------------------------------------------------------------
// Step 2+3 — dedup, sanitize, verify dates
// ---------------------------------------------------------------------------

/**
 * Everything we already carry, as dedup input: the curated catalog plus
 * whatever rows the caller read out of the DB (live opportunities AND every
 * candidate ever queued, approved or rejected).
 */
export function discoveryIndex(dbRows: RegistryEntry[] = []): RegistryIndex {
  return buildRegistryIndex([
    ...COMPETITIONS.map((c) => ({ id: c.id, name: c.name, url: c.url })),
    ...dbRows,
  ]);
}

/**
 * Turn raw search output into verified, screened candidate rows.
 *
 * Two things happen to every candidate here, and the order matters: it is
 * screened (dedup, host, page, eligibility — see screen.ts), and only then is
 * its deadline re-extracted from the page we already fetched. A dropped
 * candidate is reported with its reason rather than skipped in silence: "found
 * 6, kept 0" with no explanation is indistinguishable from a broken pipeline,
 * and that ambiguity is what let discovery sit unexamined for a month.
 */
export async function verifyCandidates(
  raw: RawCandidate[],
  index: RegistryIndex,
  source: string,
  // ISO-2 code for local batches ("KZ"); null/omitted for global discovery.
  region: string | null = null,
): Promise<VerifyOutcome> {
  const out: CandidateRow[] = [];
  const dropped: { name: string; reason: string }[] = [];
  const seenThisRun = new Set<string>();

  for (const c of raw) {
    const id = slugify(c.name);
    if (!id) {
      dropped.push({ name: c.name, reason: "name yields no usable id" });
      continue;
    }
    if (seenThisRun.has(id)) continue; // the same item twice in one reply
    seenThisRun.add(id);

    // Sanitize enums.
    const level = (LEVELS as readonly string[]).includes(c.level) ? (c.level as CompetitionLevel) : "national";
    const tier = (TIERS as readonly string[]).includes(c.tier) ? (c.tier as CompetitionTier) : "accessible";
    const category = (CATEGORIES as readonly string[]).includes(c.category)
      ? (c.category as CompetitionCategory)
      : "competition";
    const fields =
      c.fields === "all"
        ? ("all" as const)
        : (c.fields.filter((f) => (FACULTY_VALUES as string[]).includes(f)) as FacultyValue[]);
    if (fields !== "all" && fields.length === 0) {
      dropped.push({ name: c.name, reason: "no recognised field of study" });
      continue;
    }

    // Fetch the official page ONCE: it is the alive check, and its text is what
    // screening reads. (scrapeCompetitionDeadline fetches again for the date —
    // it follows to "key dates"/"apply" pages, which is a different job.)
    const page = await fetchPageText(c.url);
    if (!page.ok) {
      dropped.push({ name: c.name, reason: `official URL not reachable — ${page.detail} (${c.url})` });
      continue;
    }

    // Screening. A `drop` never reaches the queue; a `flag` is queued with its
    // quote so the reviewer decides in seconds instead of opening the page.
    const warnings = screenCandidate(
      { id, name: c.name, url: c.url, eligibility: c.eligibility, region },
      index,
      page.text,
    );
    if (shouldDrop(warnings)) {
      dropped.push({ name: c.name, reason: dropReason(warnings) ?? "screened out" });
      continue;
    }

    // Date verification: re-extract the deadline from the official page
    // itself. The search-derived date is never trusted on its own.
    let deadline: string | null = null;
    let window = c.event_window;
    let confirmed = false;
    let evidence = "";

    const scraped = await scrapeCompetitionDeadline(c.url, c.name);
    if (scraped.ok && isValidISODate(scraped.deadline)) {
      const d = daysFromToday(scraped.deadline);
      if (d >= 0 && d <= 430) {
        deadline = scraped.deadline;
        window = scraped.window || window;
        confirmed = true;
        evidence = `Deadline ${scraped.deadline} extracted from the official page (${d} days out, ${scraped.pagesRead} page(s) read).`;
      } else {
        evidence = `Official page yielded ${scraped.deadline}, rejected (${d} days from today — out of range).`;
      }
    } else if (!scraped.ok) {
      evidence = `Could not confirm on the official page (${scraped.reason}: ${scraped.detail}).`;
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
      warnings,
    });
  }

  return { rows: out, dropped };
}

/** All names the search prompt should treat as already known. */
export function knownCompetitionNames(extra: string[]): string[] {
  return [...COMPETITIONS.map((c) => c.name), ...extra];
}
