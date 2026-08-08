// Deterministic screening of a discovered candidate — the part of discovery
// that does NOT ask a model anything.
//
// Discovery's real bottleneck was never finding names; it was that every found
// name arrived as an unverified claim, so somebody had to open the page, read
// it, and decide. That review is the expensive step, and it is the step this
// file removes: each candidate arrives with the page already read for the
// failure modes the catalog has actually been burned by, quoted so the verdict
// can be checked without leaving the admin page.
//
// The five that cost us before:
//   • "A live link is not a live programme."  The Goi Peace essay contest
//     answered HTTP 200 while its own page said the contest ended after 2024.
//   • Aggregators and blogs presented as the organiser's site.
//   • A URL that points at the org's homepage rather than the programme.
//   • A US-only entry offered to students in Kazakhstan — the exact wrong
//     recommendation the eligibility gate exists to prevent.
//   • An eligibility sentence whose two brackets parse into a rule no real
//     student passes (the AMC "grade ≤10" trap, live in the catalog for weeks).
//
// Nothing here decides on its own what students see: a `drop` never reaches the
// review queue, a `flag` is queued WITH its quote. The bias is deliberate —
// dropping is silent and unrecoverable, flagging costs a reviewer two seconds.

import { checkEligibility, parseEligibility, plausibleAgeForGrade } from "@/lib/data/eligibility";

export type ScreenCode =
  /** The page itself says the programme has ended. */
  | "discontinued"
  /** A listing site / blog, not the organiser. */
  | "aggregator"
  /** A social or form host standing in for an official site. */
  | "social_only"
  /** Same programme as something already in the catalog or the queue. */
  | "duplicate"
  /** A different page on a site we already carry — usually fine, sometimes not. */
  | "same_site"
  /** The fetched page never mentions the candidate's name. */
  | "name_absent"
  /** The page or the eligibility sentence restricts entry to one country. */
  | "country_locked"
  /** The eligibility sentence parses into a rule no school student passes. */
  | "unreachable_gate"
  /** No eligibility stated at all — the first question a student asks. */
  | "gate_unstated"
  /** What the page says about money, quoted. Evidence for the cost model. */
  | "cost_signal";

export type ScreenSeverity = "drop" | "flag";

export type ScreenWarning = {
  code: ScreenCode;
  severity: ScreenSeverity;
  /** One line a reviewer can act on — quoted from the page wherever possible. */
  detail: string;
};

/** True when a set of warnings disqualifies the candidate outright. */
export function shouldDrop(warnings: ScreenWarning[]): boolean {
  return warnings.some((w) => w.severity === "drop");
}

export function dropReason(warnings: ScreenWarning[]): string | null {
  return warnings.find((w) => w.severity === "drop")?.detail ?? null;
}

// ---------------------------------------------------------------------------
// URL and name keys
// ---------------------------------------------------------------------------

export function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

/**
 * host + path, lowercased, without protocol, query, hash or trailing slash —
 * the key for "this is literally the same page". Query strings are dropped on
 * purpose: `?utm_source=` is not a different opportunity.
 */
export function normalizeUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/+$/, "").toLowerCase();
    return `${u.hostname.replace(/^www\./, "").toLowerCase()}${path}`;
  } catch {
    return null;
  }
}

/** Lowercase alphanumerics only — "John Locke Essay Prize" → "johnlockeessayprize". */
export function nameKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Words that appear in half the catalog and therefore identify nothing. Kept
// short: strip too much and "International Olympiad in Informatics" collapses
// to one token, at which point every informatics contest looks like a duplicate.
const GENERIC_TOKENS = new Set([
  "the", "of", "for", "and", "in", "on", "at", "a", "an",
  "international", "national", "global", "world", "annual", "open",
  "competition", "competitions", "contest", "challenge", "olympiad", "award",
  "awards", "prize", "prizes", "program", "programme", "programs", "programmes",
  "course", "school", "schools", "students", "student", "youth", "junior",
  "young", "high", "summer", "online", "free",
]);

/** Significant, identity-carrying tokens of a name. */
export function nameTokens(name: string): string[] {
  return [
    ...new Set(
      name
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .split(" ")
        .filter((t) => t.length > 1 && !GENERIC_TOKENS.has(t)),
    ),
  ];
}

/**
 * Containment, not Jaccard: how much of the SHORTER name the longer one
 * carries. "John Locke Essay Prize" and "John Locke Institute Essay
 * Competition" share everything that identifies them and differ only in
 * padding — Jaccard scores that 0.67 and misses the duplicate.
 */
export function nameSimilarity(a: string, b: string): number {
  const ta = nameTokens(a);
  const tb = nameTokens(b);
  if (ta.length === 0 || tb.length === 0) return 0;
  const setB = new Set(tb);
  const shared = ta.filter((t) => setB.has(t)).length;
  return shared / Math.min(ta.length, tb.length);
}

/** Shared significant tokens — the guard against one-token coincidences. */
function sharedTokenCount(a: string, b: string): number {
  const setB = new Set(nameTokens(b));
  return nameTokens(a).filter((t) => setB.has(t)).length;
}

// ---------------------------------------------------------------------------
// Dedup against what we already carry
// ---------------------------------------------------------------------------

export type RegistryEntry = { id: string; name: string; url: string };

export type RegistryIndex = {
  ids: Set<string>;
  nameKeys: Set<string>;
  urls: Set<string>;
  /** host → the names we already carry on it, for the same-site check. */
  byHost: Map<string, string[]>;
  names: string[];
};

export function buildRegistryIndex(entries: RegistryEntry[]): RegistryIndex {
  const index: RegistryIndex = {
    ids: new Set(),
    nameKeys: new Set(),
    urls: new Set(),
    byHost: new Map(),
    names: [],
  };
  for (const e of entries) {
    index.ids.add(e.id);
    index.nameKeys.add(nameKey(e.name));
    index.names.push(e.name);
    const u = normalizeUrl(e.url);
    if (u) index.urls.add(u);
    const h = hostOf(e.url);
    if (h) index.byHost.set(h, [...(index.byHost.get(h) ?? []), e.name]);
  }
  return index;
}

// Two names count as the same programme at 0.75 containment AND two shared
// tokens. The second condition is what stops "Informatics Olympiad" and
// "Informatics Olympiad Kazakhstan" — a global contest and a national one —
// from collapsing into each other on a single surviving token.
const DUP_SIMILARITY = 0.75;

/**
 * Is this candidate something we already have?
 *
 * The old rule dropped anything whose HOST matched a catalog entry, which
 * quietly made whole platforms undiscoverable: one edX course in the catalog
 * meant no edX course could ever be found again, and the same for Coursera,
 * Hack Club and every university running more than one programme. A host match
 * is now evidence, not a verdict — it disqualifies only when the names agree
 * too, and otherwise ships as a `same_site` flag for the reviewer.
 */
export function screenDedup(
  candidate: { id: string; name: string; url: string },
  index: RegistryIndex,
): ScreenWarning[] {
  const warnings: ScreenWarning[] = [];

  if (index.ids.has(candidate.id) || index.nameKeys.has(nameKey(candidate.name))) {
    // "Known" covers the catalog, the pending queue AND everything already
    // rejected — a candidate an admin has turned down must never come back
    // round on the next run and be reviewed twice.
    return [{ code: "duplicate", severity: "drop", detail: `already known — "${candidate.name}"` }];
  }

  const url = normalizeUrl(candidate.url);
  if (url && index.urls.has(url)) {
    return [{ code: "duplicate", severity: "drop", detail: `same page as an entry we already carry (${url})` }];
  }

  const twin = index.names.find(
    (n) => nameSimilarity(candidate.name, n) >= DUP_SIMILARITY && sharedTokenCount(candidate.name, n) >= 2,
  );
  if (twin) {
    return [{ code: "duplicate", severity: "drop", detail: `looks like "${twin}", which we already carry` }];
  }

  const host = hostOf(candidate.url);
  const onHost = host ? index.byHost.get(host) : undefined;
  if (onHost && onHost.length > 0) {
    warnings.push({
      code: "same_site",
      severity: "flag",
      detail: `same site as ${onHost.slice(0, 2).join(", ")}${onHost.length > 2 ? ` +${onHost.length - 2}` : ""} — check it is a different programme`,
    });
  }

  return warnings;
}

// ---------------------------------------------------------------------------
// The host itself
// ---------------------------------------------------------------------------

// Listing sites and blog platforms. Each of these republishes other people's
// opportunities, so a link to one is a link to a middleman: the dates rot, the
// page outlives the programme, and the student cannot check anything. The
// organiser's own domain is the only acceptable "official page".
const AGGREGATOR_HOSTS = [
  "opportunitydesk.org", "opportunitiesforafricans.com", "youthop.com", "oyaop.com",
  "opportunitiesforyouth.org", "afterschoolafrica.com", "scholarshipscorner.website",
  "scholarshipregion.com", "scholars4dev.com", "mladiinfo.eu", "scholarship-positions.com",
  "unigo.com", "scholarships.com", "fastweb.com", "collegevine.com", "niche.com",
  "medium.com", "blogspot.com", "wordpress.com", "substack.com", "notion.site",
  "reddit.com", "quora.com", "linkedin.com", "pinterest.com", "wikipedia.org",
];

// Not disqualifying by themselves — a city hackathon in Almaty really is
// announced on Instagram, and a local organiser really does collect entries
// through a Google Form. But a GLOBAL programme with no site of its own is not
// a programme we can stand behind, so scope decides the severity.
const SOCIAL_HOSTS = [
  "facebook.com", "instagram.com", "t.me", "telegram.me", "vk.com",
  "twitter.com", "x.com", "tiktok.com", "docs.google.com", "forms.gle",
];

function hostMatches(host: string, list: string[]): string | null {
  return list.find((h) => host === h || host.endsWith(`.${h}`)) ?? null;
}

export function screenHost(url: string, region: string | null): ScreenWarning[] {
  const host = hostOf(url);
  if (!host) return [{ code: "aggregator", severity: "drop", detail: `unparseable URL: ${url}` }];

  const agg = hostMatches(host, AGGREGATOR_HOSTS);
  if (agg) {
    return [{
      code: "aggregator",
      severity: "drop",
      detail: `${agg} is a listing site, not the organiser — the official page is what a student has to be able to check`,
    }];
  }

  const social = hostMatches(host, SOCIAL_HOSTS);
  if (social) {
    return region
      ? [{ code: "social_only", severity: "flag", detail: `the only address is ${social} — acceptable for a local event, confirm the organiser runs it` }]
      : [{ code: "social_only", severity: "drop", detail: `${social} is not an official site for a programme open worldwide` }];
  }

  return [];
}

// ---------------------------------------------------------------------------
// What the page actually says
// ---------------------------------------------------------------------------

// "The programme is over." Deliberately narrow: "registration has closed" and
// "applications are closed" are the normal state of a healthy competition for
// ten months of the year, and reading those as death would empty the queue.
const DISCONTINUED = [
  /\b(has|have) been discontinued\b/i,
  /\bdiscontinued (after|following|as of|from)\b/i,
  /\bno longer (accepting|running|offered|being (held|offered|run)|held|takes? place)\b/i,
  /\bwill (no longer|not) be (held|running|run|offered|taking place)\b/i,
  /\b(final|last) (edition|year|cycle) of the\b/i,
  /\bconcluded with the \d{4}\b/i,
  /\bcame to an end (after|with|in) (the )?\d{4}\b/i,
  /\b(programme|program|competition|contest|olympiad|award|initiative) (has )?(now )?(ended|been retired|been sunset)\b/i,
  /\bwe (have )?(sadly |regretfully )?(ceased|stopped) (running|offering|operating)\b/i,
];

// Money, quoted rather than judged. `cost` is a first-class field on every
// card and the catalog's rule is that an unverified row says "unknown", never
// "free" — so discovery hands the reviewer the sentence and the reviewer sets
// the model. A hallucinated price is worse than no price.
const FEE_SENTENCE =
  /[^.!?\n]{0,120}(?:entry|registration|application|participation|programme|program|course|tuition)\s*fee[^.!?\n]{0,120}[.!?]?/i;
const PRICE_SENTENCE =
  /[^.!?\n]{0,100}(?:\$|€|£|₸|USD|EUR|GBP|KZT)\s?\d[\d.,]*[^.!?\n]{0,100}[.!?]?/i;
const FREE_SENTENCE =
  /[^.!?\n]{0,100}(?:no (?:entry|registration|application|participation) fee|free (?:of charge|to (?:enter|apply|participate|join))|entry is free|participation is free)[^.!?\n]{0,100}[.!?]?/i;

// One-country locks. The US pattern is separate because it is the one that has
// actually shipped wrong (US-only competitions recommended in Kazakhstan) and
// because "U.S." breaks the generic pattern's word boundaries.
const US_LOCK =
  /\b(?:open (?:only )?to|must be|restricted to|limited to)[^.!?\n]{0,60}\b(?:U\.?S\.?|United States|American)\s+(?:citizens?|residents?|students?|schools?)\b/i;
const COUNTRY_LOCK =
  /\b(?:open only to|restricted to|limited to)\s+(?:citizens|residents|nationals)\s+of\s+([A-Z][\p{L}\s]{2,30})/u;

function quote(text: string, re: RegExp, max = 180): string | null {
  const m = text.match(re);
  if (!m) return null;
  return m[0].replace(/\s+/g, " ").trim().slice(0, max);
}

/**
 * Read the candidate's own page for the things a reviewer would open it to
 * check. `text` is the cleaned page text (see lib/scraper cleanHtml); an empty
 * one means a JS-rendered or bot-walled site, which is a fact about the page
 * and not about the programme, so it is stated rather than punished.
 */
export function screenPage(
  candidate: { name: string; url: string },
  text: string,
): ScreenWarning[] {
  const warnings: ScreenWarning[] = [];

  if (text.trim().length < 200) {
    return [{
      code: "name_absent",
      severity: "flag",
      detail: "the page returned almost no readable text (JS-rendered or bot-walled) — nothing could be checked on it",
    }];
  }

  for (const re of DISCONTINUED) {
    const q = quote(text, re);
    if (q) {
      warnings.push({
        code: "discontinued",
        severity: "flag",
        detail: `the page may say this has ended: "${q}"`,
      });
      break;
    }
  }

  // Does the page look like it is about this programme at all? Half the
  // significant tokens is enough — organisers rename ("Regeneron ISEF" vs
  // "ISEF") far more often than they link to the wrong site.
  const tokens = nameTokens(candidate.name);
  const haystack = text.toLowerCase();
  const present = tokens.filter((t) => haystack.includes(t)).length;
  if (tokens.length > 0 && present / tokens.length < 0.5) {
    warnings.push({
      code: "name_absent",
      severity: "flag",
      detail: `the page never names "${candidate.name}" — it may be the organisation's homepage rather than the programme`,
    });
  }

  const usLock = quote(text, US_LOCK);
  const countryLock = usLock ? null : quote(text, COUNTRY_LOCK);
  if (usLock || countryLock) {
    warnings.push({
      code: "country_locked",
      severity: "flag",
      detail: `restricted by country: "${usLock ?? countryLock}" — set an explicit gate or reject`,
    });
  }

  const money =
    quote(text, FEE_SENTENCE) ?? quote(text, FREE_SENTENCE) ?? quote(text, PRICE_SENTENCE);
  if (money) {
    warnings.push({ code: "cost_signal", severity: "flag", detail: `money on the page: "${money}"` });
  }

  return warnings;
}

// ---------------------------------------------------------------------------
// The eligibility sentence
// ---------------------------------------------------------------------------

// The audience, as a set of real students: every school year we serve, with the
// age range that year plausibly is. An entry no member of this set can enter is
// either mis-parsed or not for us.
const AUDIENCE_GRADES = [5, 6, 7, 8, 9, 10, 11, 12];

export function screenEligibility(eligibility: string | null | undefined): ScreenWarning[] {
  if (!eligibility || eligibility.trim().length < 3) {
    return [{
      code: "gate_unstated",
      severity: "flag",
      detail: "no eligibility stated — 'can I enter this?' is the first thing a student asks, and an unverified card can't answer it",
    }];
  }

  const gate = parseEligibility(eligibility);
  const reachable = AUDIENCE_GRADES.some(
    (grade) =>
      checkEligibility(gate, { grade, ageRange: plausibleAgeForGrade(grade) }).ok,
  );
  if (!reachable) {
    return [{
      code: "unreachable_gate",
      severity: "flag",
      detail: `"${eligibility.slice(0, 120)}" parses to a rule no school student passes — needs an explicit gate, or it isn't for our audience`,
    }];
  }

  if (gate.countries && gate.countries.length > 0) {
    return [{
      code: "country_locked",
      severity: "flag",
      detail: `the eligibility sentence reads as ${gate.countries.join(", ")}-only`,
    }];
  }

  return [];
}

// ---------------------------------------------------------------------------
// Everything, in one call
// ---------------------------------------------------------------------------

export function screenCandidate(
  candidate: {
    id: string;
    name: string;
    url: string;
    eligibility: string | null;
    region: string | null;
  },
  index: RegistryIndex,
  pageText: string,
): ScreenWarning[] {
  // Order matters only for readability of the drop reason: dedup and host are
  // cheap facts about the candidate, the rest is about the page it points at.
  const warnings = [
    ...screenDedup(candidate, index),
    ...screenHost(candidate.url, candidate.region),
  ];
  if (shouldDrop(warnings)) return warnings;

  return [
    ...warnings,
    ...screenPage(candidate, pageText),
    ...screenEligibility(candidate.eligibility),
  ];
}
