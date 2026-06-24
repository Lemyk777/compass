// Deterministic, data-driven per-school admission likelihood — computed in code
// at request time, costing ZERO model tokens. This replaces the AI's holistic
// guess at likelihood_low/high with numbers grounded in real admissions outcomes.
//
// Two tiers (mirrors the data-pipeline Layer-2 engine, deep-eval.ts):
//   1. EMPIRICAL — a per-school logistic curve P(admit)=sigmoid(a + b·index/100)
//      fitted offline from collected outcomes (lib/data/admit-model.json, built
//      by `npm run build:model`). Used when we observed enough applications.
//   2. HEURISTIC — a fallback logistic keyed to the school's own acceptance rate,
//      used for schools we lack data for. Still fully deterministic.
//
// Same profile → same numbers, run to run. Regenerate the model artifact after
// `npm run clean:real` and the app picks up the improved curves with no code change.

import type { StudentProfileInput } from "@/lib/types";
import type { University } from "@/lib/data/universities";
import type { Tier, Confidence } from "@/lib/ai/schema";
import admitModel from "@/lib/data/admit-model.json";

type SchoolModel = { a: number; b: number; n: number; admits: number };
const MODEL = admitModel as unknown as {
  _minSamples: number;
  schools: Record<string, SchoolModel>;
};
const MIN_SAMPLES = MODEL._minSamples ?? 8;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const sigmoid = (x: number) => 1 / (1 + Math.exp(-clamp(x, -30, 30)));
const logit = (p: number) => Math.log(clamp(p, 1e-4, 1 - 1e-4) / (1 - clamp(p, 1e-4, 1 - 1e-4)));
const satToIndex = (sat: number) => clamp(((sat - 400) / (1600 - 400)) * 100, 0, 100);

/**
 * Academic index (0–100): one comparable yardstick across curricula, identical
 * to the data-pipeline definition so the app and the fitted model agree.
 */
export function academicIndexFromProfile(profile: StudentProfileInput): number {
  const g = profile.grades ?? {};
  const t = profile.tests ?? {};

  let gradesScore: number | null = null;
  if (g.ib_total != null) gradesScore = clamp(((g.ib_total - 24) / (45 - 24)) * 100, 0, 100);
  else if (g.gpa != null) gradesScore = g.gpa <= 4 ? (g.gpa / 4) * 100 : clamp(g.gpa, 0, 100);
  else if (g.national_percent != null) gradesScore = clamp(g.national_percent, 0, 100);

  let testScore: number | null = null;
  if (t.SAT) testScore = clamp(((t.SAT - 400) / (1600 - 400)) * 100, 0, 100);
  else if (t.ACT) testScore = clamp(((t.ACT - 1) / (36 - 1)) * 100, 0, 100);

  const rigorMultiplier =
    profile.curriculum === "IB" || profile.curriculum === "A-Level"
      ? 1.0
      : profile.curriculum === "US-GPA" || profile.curriculum === "national"
        ? 0.97
        : 0.95;

  const comps: { v: number; w: number }[] = [];
  if (gradesScore != null) comps.push({ v: gradesScore, w: 0.6 });
  if (testScore != null) comps.push({ v: testScore, w: 0.4 });
  const base = comps.length
    ? comps.reduce((s, c) => s + c.v * c.w, 0) / comps.reduce((s, c) => s + c.w, 0)
    : 50; // no academic signal → neutral midpoint

  return Math.round(clamp(base * rigorMultiplier, 0, 100));
}

function tierOf(pct: number): Tier {
  return pct < 20 ? "reach" : pct < 55 ? "target" : "likely";
}

export type LikelihoodEstimate = {
  likelihood_low: number;
  likelihood_high: number;
  tier: Tier;
  confidence: Confidence;
  source: "empirical" | "heuristic";
  sampleSize: number;
};

/** Turn a point admit probability into a displayed band + tier + confidence. */
function toEstimate(prob: number, source: "empirical" | "heuristic", n: number): LikelihoodEstimate {
  const pct = clamp(prob * 100, 0, 100);
  // Wider band when we trust the point estimate less (fewer samples / heuristic).
  const halfWidth = source === "empirical" ? clamp(22 - n * 0.25, 6, 22) : 18;
  const confidence: Confidence =
    source === "heuristic" ? "low" : n >= 40 ? "high" : n >= 15 ? "medium" : "low";
  return {
    likelihood_low: Math.round(clamp(pct - halfWidth, 0, 100)),
    likelihood_high: Math.round(clamp(pct + halfWidth, 0, 100)),
    tier: tierOf(pct),
    confidence,
    source,
    sampleSize: n,
  };
}

/**
 * Per-school likelihood for one target school.
 *
 *  base LEVEL — empirical admit curve when we have enough observed applications;
 *               otherwise a deterministic acceptance-rate heuristic.
 *  stat TILT  — shift the base by how the applicant's academic index compares to
 *               the school's published admitted SAT band (p25–p75). This is what
 *               makes a stronger applicant rank higher than a weaker one even
 *               while the raw curve's own slope is still flat on sparse data. The
 *               tilt fades out as the empirical curve gains real slope (|b|), so
 *               it never double-counts once `clean:real` sharpens the model.
 */
export function estimateSchoolLikelihood(uni: University, index: number): LikelihoodEstimate {
  const m = MODEL.schools[uni.id];
  let baseProb: number;
  let source: "empirical" | "heuristic";
  let n: number;
  let slope: number;
  if (m && m.n >= MIN_SAMPLES) {
    baseProb = sigmoid(m.a + m.b * (index / 100));
    source = "empirical";
    n = m.n;
    slope = m.b;
  } else {
    // More selective schools have a higher 50%-chance index (~60 open → ~95 single-digit).
    const threshold = clamp(60 + (1 - uni.acceptance_rate) * 35, 60, 95);
    baseProb = sigmoid((index - threshold) / 7);
    source = "heuristic";
    n = 0;
    slope = 0;
  }

  let prob = baseProb;
  if (uni.sat_p25 && uni.sat_p75 && uni.sat_p75 > uni.sat_p25) {
    const idxP25 = satToIndex(uni.sat_p25);
    const idxP75 = satToIndex(uni.sat_p75);
    const mid = (idxP25 + idxP75) / 2;
    const spread = Math.max(2, (idxP75 - idxP25) / 1.35); // p25–p75 ≈ 1.35σ
    const z = clamp((index - mid) / spread, -3, 3);
    // Full tilt when the curve has no slope of its own; tapers to 0 by |b|≈2.
    const tiltK = 0.6 * clamp(1 - Math.abs(slope) / 2, 0, 1);
    prob = sigmoid(logit(baseProb) + tiltK * z);
  }

  return toEstimate(prob, source, n);
}
