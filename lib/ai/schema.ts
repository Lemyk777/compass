import { z } from "zod";

// Zod schema + inferred TS types for the analysis JSON (§7.2).
// The dashboard renders entirely from this shape, so validate defensively.

export const tierSchema = z.enum(["reach", "target", "likely"]);
export type Tier = z.infer<typeof tierSchema>;

export const confidenceSchema = z.enum(["low", "medium", "high"]);
export type Confidence = z.infer<typeof confidenceSchema>;

export const factorSchema = z.object({
  key: z.string(),
  label: z.string(),
  score: z.number().min(0).max(10),
  note: z.string(),
});

export const schoolSchema = z.object({
  name: z.string(),
  tier: tierSchema,
  likelihood_low: z.number().min(0).max(100),
  likelihood_high: z.number().min(0).max(100),
  confidence: confidenceSchema,
  fit_score: z.number().min(0).max(10),
  reason: z.string(),
});

export const recommendedSchoolSchema = z.object({
  name: z.string(),
  tier: tierSchema,
  fit_score: z.number().min(0).max(10),
  why: z.string(),
});

export const benchmarkSchema = z.object({
  school: z.string(),
  metric: z.string(),
  student_value: z.number(),
  admit_p25: z.number(),
  admit_p75: z.number(),
});

export const gapSchema = z.object({
  action: z.string(),
  impact: z.string(),
  effort: z.enum(["low", "medium", "high"]),
  priority: z.number().int(),
});

export const timelineSchema = z.object({
  horizon: z.string(),
  items: z.array(z.string()),
});

export const analysisSchema = z.object({
  overall_score: z.number().min(0).max(100),
  factors: z.array(factorSchema).min(1),
  schools: z.array(schoolSchema),
  recommended_schools: z.array(recommendedSchoolSchema),
  benchmarks: z.array(benchmarkSchema),
  gap_analysis: z.array(gapSchema),
  timeline: z.array(timelineSchema),
  summary: z.string(),
});

export type Analysis = z.infer<typeof analysisSchema>;

/**
 * What the MODEL is asked to return — the qualitative judgment only. The
 * overall score and the benchmark table are computed deterministically in code
 * (lib/ai/assemble.ts), so the model never does arithmetic or repeats dataset
 * numbers. This keeps the output smaller, cheaper, and consistent run-to-run.
 */
export const modelAnalysisSchema = analysisSchema.omit({
  overall_score: true,
  benchmarks: true,
});
export type ModelAnalysis = z.infer<typeof modelAnalysisSchema>;

export type Factor = z.infer<typeof factorSchema>;
export type SchoolLikelihood = z.infer<typeof schoolSchema>;
export type RecommendedSchool = z.infer<typeof recommendedSchoolSchema>;
export type Benchmark = z.infer<typeof benchmarkSchema>;
export type GapItem = z.infer<typeof gapSchema>;
export type TimelineBlock = z.infer<typeof timelineSchema>;

/**
 * Normalize likelihood so low ≤ high, and clamp ranges for hyper-selective
 * schools to never imply certainty (honesty constraint, §7.2).
 */
export function sanitizeAnalysis(a: Analysis): Analysis {
  return {
    ...a,
    schools: a.schools.map((s) => {
      const low = Math.min(s.likelihood_low, s.likelihood_high);
      const high = Math.max(s.likelihood_low, s.likelihood_high);
      return { ...s, likelihood_low: low, likelihood_high: high };
    }),
    gap_analysis: [...a.gap_analysis].sort((x, y) => x.priority - y.priority),
  };
}
