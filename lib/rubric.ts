// Scoring rubric (§8). These v1 default weights live in ONE place so the
// founder can tune them without touching prompt logic. Each factor is scored
// 0–10 by the model; the overall score (0–100) is a weighted blend.
//
// FOUNDER: tune these weights here. They must sum to 1.0.

export type FactorKey =
  | "academics"
  | "test_scores"
  | "course_rigor"
  | "leadership"
  | "extracurricular_depth"
  | "awards"
  | "narrative_fit";

export type RubricFactor = {
  key: FactorKey;
  label: string;
  weight: number; // 0–1, all weights sum to 1.0
  measures: string;
};

export const RUBRIC: RubricFactor[] = [
  {
    key: "academics",
    label: "Academics",
    weight: 0.25,
    measures:
      "Grades normalized across the student's curriculum vs. selective-US expectations.",
  },
  {
    key: "test_scores",
    label: "Test scores",
    weight: 0.15,
    measures:
      "SAT/ACT (and English proficiency for internationals) relative to target-school mid-ranges.",
  },
  {
    key: "course_rigor",
    label: "Course rigor",
    weight: 0.1,
    measures:
      "Difficulty of the chosen curriculum/subjects (IB HL, A-Levels, APs).",
  },
  {
    key: "leadership",
    label: "Leadership",
    weight: 0.15,
    measures: "Depth and authenticity of leadership roles, not titles alone.",
  },
  {
    key: "extracurricular_depth",
    label: "Extracurricular depth",
    weight: 0.15,
    measures:
      "Sustained, focused involvement over scattered activities.",
  },
  {
    key: "awards",
    label: "Awards & recognition",
    weight: 0.1,
    measures:
      "Level (school → regional → national → international) and selectivity.",
  },
  {
    key: "narrative_fit",
    label: "Narrative / fit",
    weight: 0.1,
    measures:
      "Coherence of the student's story and fit with intended major.",
  },
];

// Sanity check at module load: weights must sum to 1.0 (within rounding).
const weightSum = RUBRIC.reduce((s, f) => s + f.weight, 0);
if (Math.abs(weightSum - 1) > 0.001) {
  // eslint-disable-next-line no-console
  console.warn(
    `[rubric] weights sum to ${weightSum}, expected 1.0 — overall score will be skewed.`
  );
}

/** Compute the 0–100 overall from per-factor 0–10 scores, for cross-checking the model. */
export function computeOverall(
  scores: Record<FactorKey, number>
): number {
  const blended = RUBRIC.reduce(
    (sum, f) => sum + (scores[f.key] ?? 0) * f.weight,
    0
  );
  return Math.round(blended * 10); // 0–10 weighted → 0–100
}
