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
import {
  analyzeItalianPrograms,
  computeFinancialFitScore,
} from "@/lib/ai/italy-analyze";
import { analyzeHkPrograms } from "@/lib/ai/hk-analyze";
import {
  academicIndexFromProfile,
  estimateSchoolLikelihood,
} from "@/lib/ai/empirical";
import { scoreHolistic } from "@/lib/ai/tier-score";
import type { SchoolLikelihood } from "@/lib/ai/schema";

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
 * Replace the model's GUESSED per-school likelihood range with a deterministic,
 * data-driven estimate (empirical admit curve, or an acceptance-rate heuristic
 * fallback). The model keeps the qualitative parts it's good at — fit_score and
 * the human-readable reason — while the numbers come from real outcomes in code.
 * Schools not in our university dataset keep the model's original numbers.
 */
export function applyEmpiricalLikelihoods(
  schools: SchoolLikelihood[],
  profile: StudentProfileInput
): SchoolLikelihood[] {
  const index = academicIndexFromProfile(profile);
  return schools.map((s) => {
    const uni = findUniversity(s.name);
    if (!uni) return s;
    const est = estimateSchoolLikelihood(uni, index);
    return {
      ...s,
      tier: est.tier,
      likelihood_low: est.likelihood_low,
      likelihood_high: est.likelihood_high,
      confidence: est.confidence,
    };
  });
}

// The holistic factors whose score is OBJECTIVE — derivable from the student's
// own hours/roles/award levels by an explicit rule. We compute these in code so
// the number is reproducible and fully arguable, instead of trusting the model
// to do (and hide) the arithmetic. narrative_fit is intentionally NOT here: the
// rubric leaves that subjective classification to the model.
const DETERMINISTIC_FACTORS = new Set([
  "leadership",
  "extracurricular_depth",
  "awards",
]);

/**
 * Replace the model's score for the objective holistic factors with the
 * deterministic tier score from the student's profile. Same student → same
 * number, run to run; the reasoning becomes the exact rule + evidence that
 * fired. Factors not in DETERMINISTIC_FACTORS (academics, test_scores,
 * course_rigor, narrative_fit) keep the model's values.
 */
function applyDeterministicFactors(
  factors: ModelAnalysis["factors"],
  profile: StudentProfileInput
): ModelAnalysis["factors"] {
  const card = scoreHolistic({
    activities: profile.activities ?? [],
    honors: profile.honors ?? [],
    intended_major: profile.intended_major ?? "",
    faculties: profile.faculties ?? [],
  });
  const byKey = new Map(card.factors.map((f) => [f.factor as string, f]));
  return factors.map((f) => {
    const s = DETERMINISTIC_FACTORS.has(f.key) ? byKey.get(f.key) : undefined;
    if (!s) return f;
    return {
      ...f,
      score: s.score,
      rubric_tier: s.tierName,
      reasoning: [s.rule, ...s.evidence],
      note: s.rule,
    };
  });
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
  const hasItaly =
    (profile.destinations ?? []).includes("IT") &&
    (profile.italy_programs ?? []).length > 0;

  const italyPrograms = hasItaly
    ? analyzeItalianPrograms(
        profile.italy_programs ?? [],
        profile.tests?.SAT,
        profile.italy_family_income
      )
    : undefined;

  const hasHk =
    (profile.destinations ?? []).includes("HK") &&
    (profile.hk_programs ?? []).length > 0;

  const hkPrograms = hasHk
    ? analyzeHkPrograms(profile.hk_programs ?? [], {
        ibTotal: profile.grades?.ib_total,
        sat: profile.tests?.SAT,
        ielts: profile.tests?.IELTS,
        toefl: profile.tests?.TOEFL,
        gradeStatus: profile.hk_grade_status ?? "predicted",
        activities: profile.activities,
        honors: profile.honors,
      })
    : undefined;

  const factors = applyDeterministicFactors(model.factors, profile);

  const full: Analysis = {
    overall_score: computeOverallFromFactors(factors),
    factors,
    schools: applyEmpiricalLikelihoods(model.schools, profile),
    recommended_schools: model.recommended_schools,
    benchmarks: computeBenchmarks(profile),
    gap_analysis: model.gap_analysis,
    timeline: model.timeline,
    summary: model.summary,
    italy_programs: italyPrograms,
    italy_financial_fit_score: hasItaly
      ? computeFinancialFitScore(profile.italy_family_income, true)
      : undefined,
    hk_programs: hkPrograms,
  };
  return sanitizeAnalysis(analysisSchema.parse(full));
}
