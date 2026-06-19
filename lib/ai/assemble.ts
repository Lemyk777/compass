import { RUBRIC } from "@/lib/rubric";
import { findUniversity } from "@/lib/data/universities";
import type { StudentProfileInput } from "@/lib/types";
import {
  analysisSchema,
  sanitizeAnalysis,
  type Analysis,
  type Benchmark,
  type ModelAnalysis,
} from "@/lib/ai/schema";

/**
 * Deterministic overall score (0–100) from the model's per-factor scores and
 * the rubric weights. Replaces asking the model to do the weighted-average math
 * (which it could get wrong and which bloated the output).
 */
export function computeOverallFromFactors(
  factors: { key: string; score: number }[]
): number {
  const byKey = new Map(factors.map((f) => [f.key, f.score]));
  const blended = RUBRIC.reduce(
    (sum, f) => sum + (byKey.get(f.key) ?? 0) * f.weight,
    0
  );
  return Math.round(blended * 10); // 0–10 weighted → 0–100
}

/**
 * Deterministic benchmarks from OUR university dataset — the student's SAT vs.
 * each target school's mid-50% range. The model no longer reports these numbers
 * (it used to risk hallucinating p25/p75 different from the dataset).
 */
export function computeBenchmarks(profile: StudentProfileInput): Benchmark[] {
  const sat = profile.tests?.SAT;
  if (!sat || sat <= 0) return [];
  const out: Benchmark[] = [];
  for (const name of profile.target_schools) {
    const uni = findUniversity(name);
    if (!uni || !uni.sat_p25 || !uni.sat_p75) continue;
    out.push({
      school: uni.name,
      metric: "SAT",
      student_value: sat,
      admit_p25: uni.sat_p25,
      admit_p75: uni.sat_p75,
    });
    if (out.length >= 5) break;
  }
  return out;
}

/**
 * Merge the model's qualitative response with the code-computed numbers into
 * the full Analysis the dashboard renders. Validates the assembled object so a
 * stored row always matches the full schema, then sanitizes it.
 */
export function assembleAnalysis(
  model: ModelAnalysis,
  profile: StudentProfileInput
): Analysis {
  const full: Analysis = {
    overall_score: computeOverallFromFactors(model.factors),
    factors: model.factors,
    schools: model.schools,
    recommended_schools: model.recommended_schools,
    benchmarks: computeBenchmarks(profile),
    gap_analysis: model.gap_analysis,
    timeline: model.timeline,
    summary: model.summary,
  };
  return sanitizeAnalysis(analysisSchema.parse(full));
}
