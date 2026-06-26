// Leaderboard types + pure ranking helpers. Client-safe (no server imports) —
// the actual data fetch (service-role) lives in the rankings page server
// component.
//
// One table for everyone, regardless of destination country. `overall` is the
// analysis overall_score (0–100) — the single cross-country-comparable number,
// so it's what we rank by. Each row also carries its OWN factor breakdown
// (`factors`), which is 3–7 entries depending on the profile/country. The view
// never assumes a fixed set of columns: it renders whatever factors a row has,
// colored by a stable per-factor palette so the legend stays consistent.

export type LeaderboardFactor = {
  key: string;
  label: string;
  score: number; // 0–10, our rubric scale
};

// Which destination cohorts a student belongs to. A student can appear on more
// than one board (e.g. applying to both the US and Italy). Derived from the
// analysis content: Italy/HK programs present → that country's board.
export type CountryCode = "US" | "IT" | "HK";

export type LeaderboardRow = {
  userId: string;
  name: string;
  major: string;
  overall: number;
  factors: LeaderboardFactor[];
  // Destination cohorts this student is part of. The main board shows everyone;
  // the per-country mini-sections filter on this.
  countries: CountryCode[];
};

// The country mini-sections rendered above/below the main board, in order. The
// US cohort is the main board itself, so only IT and HK get their own section.
export const COUNTRY_SECTIONS: { code: CountryCode; label: string; flag: string }[] = [
  { code: "IT", label: "Italy applicants", flag: "🇮🇹" },
  { code: "HK", label: "Hong Kong applicants", flag: "🇭🇰" },
];

/** Rows belonging to a given destination cohort, preserving sort order. */
export function rowsForCountry(
  rows: LeaderboardRow[],
  code: CountryCode
): LeaderboardRow[] {
  return rows.filter((r) => r.countries.includes(code));
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
