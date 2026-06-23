// Per-country scorecard weighting. The student's seven factor scores describe
// the student and never change — but how much each one MATTERS depends on the
// country's admission logic. The US is holistic (essays/activities count);
// Italian state admission is score-based (SAT cut-offs decide it, essays don't),
// and affordability via DSU matters. So each destination gets its own weights,
// its own overall, and its own emphasis on the scorecard.

import { RUBRIC } from "@/lib/rubric";
import type { DestinationCode } from "@/lib/data/destinations";

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
  // extracurriculars/leadership standing in for interview readiness.
  HK: {
    academics: 0.34,
    test_scores: 0.2,
    course_rigor: 0.16,
    extracurricular_depth: 0.1,
    leadership: 0.1,
    awards: 0.06,
    narrative_fit: 0.04,
  },
  // Not yet tuned — fall back to an even, holistic blend.
  UK: {},
  DE: {},
  NL: {},
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
