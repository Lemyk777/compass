// Leaderboard types + pure ranking helpers. Client-safe (no server imports) —
// the actual data fetch (service-role) lives in the rankings page server
// component.

import { krLanguageGateScore } from "@/lib/data/country-scorecard";
//
// One board per destination, switched between in the view. Each board ranks by
// and shows that COUNTRY'S OWN overall (0–100): the US board uses the US
// overall_score, the Italy board the Italy-weighted score, the HK board the
// grades-first HK score (see `overallByCountry`). Each row also carries its own
// factor breakdown (`factors`), which is 3–7 entries depending on the
// profile/country. The view never assumes a fixed set of columns: it renders
// whatever factors a row has, colored by a stable per-factor palette so the
// legend stays consistent.

export type LeaderboardFactor = {
  key: string;
  label: string;
  score: number; // 0–10, our rubric scale
};

// Which destination cohorts a student belongs to. A student can appear on more
// than one board (e.g. applying to both the US and Italy). Derived from the
// analysis content: Italy/HK/UAE/Korea programs present → that country's board.
export type CountryCode = "US" | "IT" | "HK" | "AE" | "KR";

export type LeaderboardRow = {
  userId: string;
  name: string;
  major: string;
  // Default (US) overall, 0–100. Each board shows its OWN country-weighted
  // overall instead — `overallByCountry` carries the Italy/HK numbers so the
  // Italy board ranks on the Italy score (SAT cut-offs + DSU fit) and the HK
  // board on the grades-first HK score, not the US number. Falls back to this.
  overall: number;
  overallByCountry?: Partial<Record<CountryCode, number>>;
  // Default (US) factor breakdown. Each board shows a COUNTRY-NATIVE breakdown —
  // `factorsByCountry` carries the Italy/HK factor sets so the Italy board talks
  // about SAT-vs-cutoff margins and DSU fit instead of US admission factors, and
  // so on.
  factors: LeaderboardFactor[];
  factorsByCountry?: Partial<Record<CountryCode, LeaderboardFactor[]>>;
  // Destination cohorts this student is part of — drives which board(s) they
  // appear on. A student can belong to several (e.g. US + HK).
  countries: CountryCode[];
};

// The boards, in display (toggle) order. Each is a destination cohort with
// its own native breakdown; students are ranked within the cohort by `overall`.
export const LEADERBOARD_COUNTRIES: { code: CountryCode; label: string }[] = [
  { code: "US", label: "United States" },
  { code: "IT", label: "Italy" },
  { code: "HK", label: "Hong Kong" },
  { code: "AE", label: "UAE" },
  { code: "KR", label: "South Korea" },
];

export function countryLabel(code: CountryCode): string {
  return LEADERBOARD_COUNTRIES.find((c) => c.code === code)?.label ?? code;
}

/** Which boards actually have students, in canonical order — drives the toggle. */
export function availableCountries(rows: LeaderboardRow[]): CountryCode[] {
  const present = new Set<CountryCode>();
  for (const r of rows) for (const c of r.countries) present.add(c);
  return LEADERBOARD_COUNTRIES.map((c) => c.code).filter((c) => present.has(c));
}

/** Rows belonging to a given destination cohort, preserving sort order. */
export function rowsForCountry(
  rows: LeaderboardRow[],
  code: CountryCode
): LeaderboardRow[] {
  return rows.filter((r) => r.countries.includes(code));
}

/** The country-native breakdown for a row, falling back to the US factors. */
export function factorsFor(
  row: LeaderboardRow,
  code: CountryCode
): LeaderboardFactor[] {
  return row.factorsByCountry?.[code] ?? row.factors;
}

/** This board's overall for a row (0–100), falling back to the US overall. */
export function overallFor(row: LeaderboardRow, code: CountryCode): number {
  return row.overallByCountry?.[code] ?? row.overall;
}

/**
 * The rows for one board: the country cohort, with each row's `overall` and
 * `factors` swapped to that country's own number/breakdown, then re-ranked by
 * that country overall (a student's US rank and Italy rank differ). The rest of
 * the view (standing, legend, sparkline, breakdown) renders straight off
 * `.overall`/`.factors`, so this is all the country-specific data it needs.
 */
export function boardRows(
  rows: LeaderboardRow[],
  code: CountryCode
): LeaderboardRow[] {
  return rowsForCountry(rows, code)
    .map((r) => ({
      ...r,
      overall: overallFor(r, code),
      factors: factorsFor(r, code),
    }))
    .sort((a, b) => b.overall - a.overall);
}

// Stable, accessible categorical palette — one hue per factor, ~3:1+ on white
// so the thin bars stay legible (WCAG graphical-object contrast). Colors never
// depend on country, so the same factor reads the same everywhere on the board.
export const FACTOR_COLORS: Record<string, string> = {
  academics: "#4263eb", // indigo
  test_scores: "#1098ad", // cyan
  course_rigor: "#0ca678", // teal
  leadership: "#7048e8", // violet
  extracurricular_depth: "#f59f00", // amber
  awards: "#e64980", // pink
  narrative_fit: "#e8590c", // orange
  // Italy-native factors (green family, echoing the flag).
  it_academic: "#0ca678", // teal-green
  it_security: "#2f9e44", // green
  it_finance: "#f59f00", // amber (money)
  // Hong Kong board reuses the academics/test/rigor hues for its spine and adds
  // one combined achievements bar (the tie-breaker).
  hk_achievements: "#e64980", // pink
  // UAE board: grades-first spine + one combined achievements bar (stands in for
  // the holistic/interview seats). Same hue as the HK equivalent — same meaning.
  ae_achievements: "#e64980", // pink
  // Korea board: document-screen spine + the language gate + a combined
  // document-strength bar (awards + record + personal-statement fit).
  kr_language: "#1098ad", // cyan (a credential, like a test)
  kr_achievements: "#e64980", // pink
};
export const FACTOR_FALLBACK_COLOR = "#868e96"; // any future/unknown factor key

export function factorColor(key: string): string {
  return FACTOR_COLORS[key] ?? FACTOR_FALLBACK_COLOR;
}

// Canonical display order (matches the rubric's importance ordering). Used to
// keep the sparkline, legend, and expanded breakdown consistent across rows.
export const FACTOR_ORDER = [
  "academics",
  "test_scores",
  "course_rigor",
  "leadership",
  "extracurricular_depth",
  "awards",
  "narrative_fit",
  // Italy-native (only ever appear together on the Italy board).
  "it_academic",
  "it_security",
  "it_finance",
  // Hong Kong board: academics/test_scores/course_rigor spine + this combined
  // achievements bar.
  "hk_achievements",
  // UAE board: same spine + its combined achievements bar.
  "ae_achievements",
  // Korea board: academics/course_rigor spine + language gate + document strength.
  "kr_language",
  "kr_achievements",
] as const;

function orderIndex(key: string): number {
  const i = FACTOR_ORDER.indexOf(key as (typeof FACTOR_ORDER)[number]);
  return i < 0 ? FACTOR_ORDER.length : i;
}

/** Sort a factor list into the canonical display order (unknown keys last). */
export function orderFactors<T extends { key: string }>(factors: T[]): T[] {
  return [...factors].sort((a, b) => orderIndex(a.key) - orderIndex(b.key));
}

/**
 * Union of factor keys present across rows, in canonical order — drives the
 * single shared color legend above the board.
 */
export function legendFactors(
  rows: LeaderboardRow[]
): { key: string; label: string }[] {
  const seen = new Map<string, string>();
  for (const r of rows) {
    for (const f of r.factors) if (!seen.has(f.key)) seen.set(f.key, f.label);
  }
  return orderFactors(
    [...seen.entries()].map(([key, label]) => ({ key, label }))
  );
}

export type Standing = {
  rank: number;
  total: number;
  topPct: number;
  current: LeaderboardRow;
  focus: { label: string; score: number; topAvg: number; topK: number } | null;
};

/** Where the current user sits, plus the weakest factor vs. the top cohort. */
export function computeStanding(
  rows: LeaderboardRow[],
  currentUserId: string | null
): Standing | null {
  const idx = rows.findIndex((r) => r.userId === currentUserId);
  if (idx < 0) return null;
  const current = rows[idx];
  const total = rows.length;
  const rank = idx + 1;
  const topPct = Math.min(100, Math.max(1, Math.round((rank / total) * 100)));

  // Weakest of the current user's OWN factors (works for any 3–7 set).
  let focus: Standing["focus"] = null;
  if (current.factors.length) {
    const weakest = current.factors.reduce((lo, f) =>
      f.score < lo.score ? f : lo
    );
    const topK = Math.max(1, Math.ceil(total * 0.1));
    const top = rows.slice(0, topK);
    // Average the same factor among the top cohort (only those who have it).
    const peers = top
      .map((r) => r.factors.find((f) => f.key === weakest.key)?.score)
      .filter((s): s is number => s != null);
    const topAvg = peers.length
      ? Math.round(peers.reduce((s, v) => s + v, 0) / peers.length)
      : weakest.score;
    focus = { label: weakest.label, score: weakest.score, topAvg, topK };
  }

  return { rank, total, topPct, current, focus };
}

// ── Country-native factor breakdowns ──────────────────────────────────────────
// Every board ranks by the same `overall`, but each shows factors that mean
// something for THAT country's admissions. These are derived deterministically
// from the (already deterministic) Italy/HK program analyses — no AI, same
// profile → same bars. Inputs are typed as the subset of fields we read so the
// full ItalyProgramAnalysis / HkProgramAnalysis objects pass straight through.

const clamp10 = (x: number) => Math.max(0, Math.min(10, x));
const mean = (xs: number[]) =>
  xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length : 0;

type ItalyFactorInput = {
  user_sat: number;
  historical_cutoff: number;
  status: string;
};

/**
 * Italy board factors: how the student's SAT clears the cutoffs, how secure
 * their admission is across their picked programs, and DSU financial fit.
 */
export function italyFactors(
  programs: ItalyFactorInput[],
  financialFit: number | undefined
): LeaderboardFactor[] {
  if (!programs.length) return [];
  // Avg SAT margin vs. last year's cutoff, mapped onto the 0–10 rubric scale:
  // on the line ≈ 5, ~+200 → 10, ~−200 → 0.
  const avgDiff = mean(programs.map((p) => p.user_sat - p.historical_cutoff));
  const academic = clamp10(5 + avgDiff / 40);
  const statusPts: Record<string, number> = {
    guaranteed: 10,
    likely: 8,
    target: 5,
    reach: 2,
  };
  const security = mean(programs.map((p) => statusPts[p.status] ?? 5));
  return [
    { key: "it_academic", label: "Academic margin", score: Math.round(academic) },
    { key: "it_security", label: "Admission odds", score: Math.round(security) },
    { key: "it_finance", label: "Financial fit", score: Math.round(financialFit ?? 5) },
  ];
}

function scoreByKey(
  factors: LeaderboardFactor[],
  key: string,
  fallback = 5
): number {
  return factors.find((f) => f.key === key)?.score ?? fallback;
}

/**
 * Hong Kong board factors. HK international admission is grades-first: a GPA +
 * standardized-test (SAT / A-Level / IB) spine, with a combined achievements bar
 * as the tie-breaker that separates applicants clustered at the same scores.
 * Within achievements, olympiads/competitions/awards count most, then research /
 * EC depth, then general leadership — so we weight `awards` heaviest. Derived
 * from the profile factors (not the programs), so it works for any applicant.
 *
 * Sources: HKU, HKUST ("significant prizes and awards (if any)") and CUHK (OEA —
 * Other Experiences and Achievements in Competitions/Activities) admissions pages.
 */
export function hkFactors(profileFactors: LeaderboardFactor[]): LeaderboardFactor[] {
  if (!profileFactors.length) return [];
  const achievements = clamp10(
    0.5 * scoreByKey(profileFactors, "awards") +
      0.3 * scoreByKey(profileFactors, "extracurricular_depth") +
      0.2 * scoreByKey(profileFactors, "leadership")
  );
  return [
    { key: "academics", label: "Academics", score: Math.round(scoreByKey(profileFactors, "academics")) },
    { key: "test_scores", label: "Test score", score: Math.round(scoreByKey(profileFactors, "test_scores")) },
    { key: "course_rigor", label: "Course rigor", score: Math.round(scoreByKey(profileFactors, "course_rigor")) },
    { key: "hk_achievements", label: "Achievements", score: Math.round(achievements) },
  ];
}

/**
 * UAE board factors. UAE admission is grades-first and SAT-driven (see
 * lib/ai/uae-analyze.ts), with a combined achievements bar standing in for the
 * holistic/interview seats (NYUAD Candidate Weekend, Medicine MMIs) and merit
 * scholarships — the same blend the UAE odds engine weighs deterministically.
 */
export function uaeFactors(profileFactors: LeaderboardFactor[]): LeaderboardFactor[] {
  if (!profileFactors.length) return [];
  const achievements = clamp10(
    0.5 * scoreByKey(profileFactors, "awards") +
      0.3 * scoreByKey(profileFactors, "extracurricular_depth") +
      0.2 * scoreByKey(profileFactors, "leadership")
  );
  return [
    { key: "test_scores", label: "Test score", score: Math.round(scoreByKey(profileFactors, "test_scores")) },
    { key: "academics", label: "Academics", score: Math.round(scoreByKey(profileFactors, "academics")) },
    { key: "course_rigor", label: "Course rigor", score: Math.round(scoreByKey(profileFactors, "course_rigor")) },
    { key: "ae_achievements", label: "Achievements", score: Math.round(achievements) },
  ];
}

type KoreaFactorInput = { language: string };

/**
 * Korea board factors. Korean international admission is a document-based,
 * GPA-first screen (see lib/ai/korea-analyze.ts): the transcript is the spine,
 * the language credential (TOPIK/English) is a hard eligibility gate, and the
 * rest of the file — awards, record and the personal statement — is where the
 * screen is won. Language readiness comes from the same helper the scorecard
 * radar uses (krLanguageGateScore), so the board and the radar agree.
 */
export function krFactors(
  profileFactors: LeaderboardFactor[],
  programs: KoreaFactorInput[]
): LeaderboardFactor[] {
  if (!profileFactors.length) return [];
  const language = krLanguageGateScore(programs) ?? 4;
  const documents = clamp10(
    0.4 * scoreByKey(profileFactors, "awards") +
      0.3 * scoreByKey(profileFactors, "extracurricular_depth") +
      0.3 * scoreByKey(profileFactors, "narrative_fit")
  );
  return [
    { key: "academics", label: "Academics", score: Math.round(scoreByKey(profileFactors, "academics")) },
    { key: "course_rigor", label: "Course rigor", score: Math.round(scoreByKey(profileFactors, "course_rigor")) },
    { key: "kr_language", label: "Language gate", score: Math.round(language) },
    { key: "kr_achievements", label: "Document strength", score: Math.round(documents) },
  ];
}
