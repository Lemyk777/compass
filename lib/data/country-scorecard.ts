// Per-country scorecard weighting. The student's seven factor scores describe
// the student and never change — but how much each one MATTERS depends on the
// country's admission logic. The US is holistic (essays/activities count);
// Italian state admission is score-based (SAT cut-offs decide it, essays don't),
// and affordability via DSU matters. So each destination gets its own weights,
// its own overall, and its own emphasis on the scorecard.

import { RUBRIC } from "@/lib/rubric";
import type { DestinationCode } from "@/lib/data/destinations";
import type { Factor } from "@/lib/ai/schema";

// Pseudo-factor: Italy's DSU financial fit, scored separately from the 7
// profile factors (lives on the analysis as italy_financial_fit_score).
export const FINANCIAL_FIT_KEY = "financial_fit";

type WeightMap = Record<string, number>;

// Weights need NOT sum to 1 — countryOverall normalizes by the weights used.
export const COUNTRY_SCORECARD_WEIGHTS: Record<DestinationCode, WeightMap> = {
  // Holistic: mirror the founder-tuned RUBRIC exactly.
  US: Object.fromEntries(RUBRIC.map((f) => [f.key, f.weight])),
  // Score-based: the SAT cut-off is the gate; essays/activities barely count;
  // DSU affordability is a real factor.
  IT: {
    test_scores: 0.42,
    academics: 0.24,
    course_rigor: 0.14,
    [FINANCIAL_FIT_KEY]: 0.16,
    awards: 0.02,
    leadership: 0.01,
    extracurricular_depth: 0.005,
    narrative_fit: 0.005,
  },
  // Academically meritocratic + interview-based: grades/tests dominate, with
  // extracurriculars/leadership standing in for interview readiness. Essays/
  // narrative barely count in HK admission, so narrative_fit is weighted 0 here
  // — it's hidden from the scorecard (below the 0.05 "matters" threshold) AND
  // excluded from the overall, so display and score agree. Its old 0.04 is
  // folded into awards, which does move the HK read (competitive programmes +
  // scholarships).
  HK: {
    academics: 0.34,
    test_scores: 0.2,
    course_rigor: 0.16,
    extracurricular_depth: 0.1,
    leadership: 0.1,
    awards: 0.1,
    narrative_fit: 0,
  },
  // Not yet tuned — fall back to an even, holistic blend.
  KR: {},
  CN: {},
  CA: {},
};

export function countryWeights(country: DestinationCode): WeightMap {
  const w = COUNTRY_SCORECARD_WEIGHTS[country];
  if (w && Object.keys(w).length) return w;
  return Object.fromEntries(RUBRIC.map((f) => [f.key, 1 / RUBRIC.length]));
}

/** Country-weighted 0–100 overall from the 0–10 factor scores (+ financial fit). */
export function countryOverall(
  country: DestinationCode,
  factors: { key: string; score: number }[],
  financialFit?: number
): number {
  const weights = countryWeights(country);
  let sum = 0;
  let wsum = 0;
  for (const f of factors) {
    const w = weights[f.key] ?? 0;
    sum += f.score * w;
    wsum += w;
  }
  const fw = weights[FINANCIAL_FIT_KEY] ?? 0;
  if (fw > 0 && financialFit != null) {
    sum += financialFit * fw;
    wsum += fw;
  }
  return wsum > 0 ? Math.round((sum / wsum) * 10) : 0;
}

/** Factors ordered by how much they matter for this country (highest first). */
export function factorsByCountryRelevance<T extends { key: string }>(
  country: DestinationCode,
  factors: T[]
): T[] {
  const weights = countryWeights(country);
  return [...factors].sort(
    (a, b) => (weights[b.key] ?? 0) - (weights[a.key] ?? 0)
  );
}

/** Whether a factor carries meaningful weight for this country (else dimmed). */
export function factorMattersForCountry(
  country: DestinationCode,
  key: string
): boolean {
  return (countryWeights(country)[key] ?? 0) >= 0.05;
}

/**
 * Hong Kong scorecard factors: a grades-first set the way HK international
 * admission actually reads a profile — Academics, Test score and Course rigor as
 * the spine, plus ONE combined "Achievements" axis instead of three separate
 * extracurricular/leadership/awards bars. Within achievements, olympiads /
 * competitions / awards count most (weight 0.5), then research / activity depth
 * (0.3), then general leadership (0.2) — the same blend the rankings board uses.
 * This is why the HK radar is a quadrilateral, not a hexagon. Narrative is
 * dropped entirely (no essay-driven holistic read in HK).
 */
export function hkScorecardFactors(factors: Factor[]): Factor[] {
  const byKey = new Map(factors.map((f) => [f.key, f]));
  const score = (key: string) => byKey.get(key)?.score ?? 0;
  const achievementScore = Math.max(
    0,
    Math.min(
      10,
      0.5 * score("awards") +
        0.3 * score("extracurricular_depth") +
        0.2 * score("leadership")
    )
  );
  const achievements: Factor = {
    key: "hk_achievements",
    label: "Achievements",
    score: achievementScore,
    rubric_tier: "",
    reasoning: [
      byKey.get("awards"),
      byKey.get("extracurricular_depth"),
      byKey.get("leadership"),
    ]
      .flatMap((f) => f?.reasoning ?? [])
      .slice(0, 4),
    note: "Your combined record. In HK this is the tie-breaker once grades and tests are in range — olympiads, competitions and awards weigh most, then research and activities, then leadership.",
  };
  return [
    byKey.get("academics"),
    byKey.get("test_scores"),
    byKey.get("course_rigor"),
    achievements,
  ].filter((f): f is Factor => f != null);
}
