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
  isInternationalApplicant,
  tierForPct,
  maxDisplayedHigh,
} from "@/lib/ai/empirical";
import { scoreAcademicFactors, scoreAwards, hasRankedAward } from "@/lib/ai/tier-score";
import { recommendUniversities } from "@/lib/data/recommend";
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
 * Per-school likelihood = the AI's holistic read BLENDED with the data-driven
 * estimate from our 2500+ outcome dataset (empirical admit curve, or an
 * acceptance-rate heuristic fallback). Rather than discarding the model's number,
 * we anchor it to real outcomes: the more samples behind the empirical estimate,
 * the more it dominates the blend. A hard ceiling tied to each school's real
 * acceptance rate then makes an over-optimistic guess impossible to display.
 * The model keeps fit_score and the human-readable reason. Schools not in our
 * dataset keep the model's numbers but still get a sanity cap.
 */
export function blendSchoolLikelihoods(
  schools: SchoolLikelihood[],
  profile: StudentProfileInput
): SchoolLikelihood[] {
  const index = academicIndexFromProfile(profile);
  const international = isInternationalApplicant(profile);
  return schools.map((s) => {
    const aiLow = Math.min(s.likelihood_low, s.likelihood_high);
    const aiHigh = Math.max(s.likelihood_low, s.likelihood_high);
    const uni = findUniversity(s.name);

    // School we have no data for: trust the model but cap runaway optimism.
    if (!uni) {
      const high = Math.min(aiHigh, 60);
      return { ...s, likelihood_low: Math.min(aiLow, high), likelihood_high: high };
    }

    const est = estimateSchoolLikelihood(uni, index, { international });

    // Weight on the DATA: heavier when more samples stand behind it.
    const w =
      est.source === "heuristic"
        ? 0.45
        : est.confidence === "high"
          ? 0.82
          : est.confidence === "medium"
            ? 0.68
            : 0.55;
    const aiMid = (aiLow + aiHigh) / 2;
    const empMid = (est.likelihood_low + est.likelihood_high) / 2;
    const mid = w * empMid + (1 - w) * aiMid;
    const half = (est.likelihood_high - est.likelihood_low) / 2;

    const cap = maxDisplayedHigh(uni.acceptance_rate);
    const rawHigh = Math.round(mid + half);
    const high = Math.min(rawHigh, cap);
    // If the ceiling clipped the top, slide the whole band down to keep its
    // width instead of collapsing it flat against the cap.
    const low =
      high < rawHigh
        ? Math.max(0, high - 2 * Math.round(half))
        : Math.max(0, Math.round(mid - half));

    return {
      ...s,
      tier: tierForPct(Math.min(mid, cap)),
      likelihood_low: Math.min(low, high),
      likelihood_high: high,
      confidence: est.confidence,
    };
  });
}

// The factors whose score is OBJECTIVE — derivable from the student's own
// grades/tests/curriculum by an explicit rule. We compute these in code so the
// number is reproducible and fully arguable, instead of trusting the model to do
// (and hide) the arithmetic.
//
// leadership, extracurricular_depth, and narrative_fit are left to the model:
// rigid keyword/threshold formulas mis-scored genuine strong profiles (e.g. a
// 1-year startup co-founder floored to Tier 3, non-English titles, blank hours),
// so the model judges these holistically against the rubric tiers (see the
// prompt's tier instructions).
//
// awards is deterministic when a recognized level exists: it's keyed off the
// structured Common-App honor LEVEL (school..international), which has none of
// the hours/title pitfalls above — so International always scores 9, never
// drifting to 8 run-to-run and never gated behind olympiad medals (the AI used
// to conflate the 9 and 10 tiers and under-score genuine international awards).
// It stays conditional (see applyDeterministicFactors): with no ranked honor we
// keep the model's read, so awards entered as free-text/activities aren't lost.
//
// academics is ALSO conditional: it only overrides the model when real numeric
// grades exist, otherwise the model's read of the free-text grades wins (a rigid
// formula with no numbers wrongly showed "no grades provided → neutral 5.0").
const DETERMINISTIC_FACTORS = new Set([
  "academics",
  "test_scores",
  "course_rigor",
]);

/** True when the student gave a numeric grade the academics formula can score. */
function hasStructuredGrades(profile: StudentProfileInput): boolean {
  const g = profile.grades ?? {};
  return g.ib_total != null || g.gpa != null || g.national_percent != null;
}

/**
 * Replace the model's score for the objective academic factors (academics,
 * test_scores, course_rigor) with the deterministic tier score from the
 * student's profile. Same student → same number, run to run; the reasoning
 * becomes the exact rule + evidence that fired. The holistic factors
 * (leadership, extracurricular_depth, awards, narrative_fit) keep the model's
 * values. academics is conditional: it only overrides the model when real
 * numeric grades exist — otherwise the formula has nothing to score and the
 * model's read of the free-text grades is kept.
 */
function applyDeterministicFactors(
  factors: ModelAnalysis["factors"],
  profile: StudentProfileInput
): ModelAnalysis["factors"] {
  const academic = scoreAcademicFactors({
    grades: profile.grades,
    tests: profile.tests,
    curriculum: profile.curriculum || undefined,
  });
  const byKey = new Map(academic.map((f) => [f.factor as string, f]));
  const gradesKnown = hasStructuredGrades(profile);
  // Awards: deterministic only when the student has a recognized honor level —
  // otherwise (free-text/activity awards) keep the model's holistic read.
  const honors = profile.honors ?? [];
  const awards = hasRankedAward(honors) ? scoreAwards(honors) : null;
  const apply = (
    f: ModelAnalysis["factors"][number],
    s: { score: number; tierName: string; rule: string; evidence: string[] }
  ) => ({
    ...f,
    score: s.score,
    rubric_tier: s.tierName,
    reasoning: [s.rule, ...s.evidence],
    note: s.rule,
  });
  return factors.map((f) => {
    if (f.key === "awards") return awards ? apply(f, awards) : f;
    if (!DETERMINISTIC_FACTORS.has(f.key)) return f;
    // academics needs real numbers; with only free-text grades, keep the
    // model's read instead of flooring to the formula's neutral 5.0.
    if (f.key === "academics" && !gradesKnown) return f;
    const s = byKey.get(f.key);
    if (!s) return f;
    return apply(f, s);
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
    schools: blendSchoolLikelihoods(model.schools, profile),
    // Recommendations are computed deterministically from our dataset (matching
    // the student's fields, academic profile, and aid needs) — the model no
    // longer picks them. Falls back to [] for non-US profiles.
    recommended_schools: recommendUniversities(profile),
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
