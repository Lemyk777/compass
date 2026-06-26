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
    measures: `9-10 (Tier 1): Top 1-2% of class, maxed out rigor with perfect grades.
7-8 (Tier 2): Top 5-10%, mostly A's, strong rigor but not maxed out.
5-6 (Tier 3): Solid B-average student, standard curriculum with a few honors.
2-4 (Tier 4): C-average, no advanced classes.
0-1 (Tier 5): Below average, struggling academically.`,
  },
  {
    key: "test_scores",
    label: "Test scores",
    weight: 0.15,
    measures: `9-10 (Tier 1): 1550+ SAT / 35+ ACT. Perfect TOEFL/IELTS.
7-8 (Tier 2): 1450-1540 SAT / 33-34 ACT. Excellent English.
5-6 (Tier 3): 1300-1440 SAT / 28-32 ACT. Good English.
2-4 (Tier 4): 1100-1290 SAT / 22-27 ACT. Minimum English requirements met.
0-1 (Tier 5): Below 1100 SAT or test-optional without other strong indicators.`,
  },
  {
    key: "course_rigor",
    label: "Course rigor",
    weight: 0.1,
    measures: `9-10 (Tier 1): Most demanding curriculum available (e.g. full IB Diploma, 10+ APs).
7-8 (Tier 2): Very demanding (many APs/Honors/A-levels).
5-6 (Tier 3): Moderately demanding (some advanced classes).
2-4 (Tier 4): Standard high school curriculum.
0-1 (Tier 5): Below standard or remedial.`,
  },
  {
    key: "leadership",
    label: "Leadership",
    weight: 0.15,
    measures: `10 (Tier 1, elite): Founder/President of a national or global initiative with massive, proven impact.
9 (Tier 1): Ownership-level role (founder/co-founder/president/director/lead organizer) operating at large or cross-border scale with demonstrated, measurable impact — e.g. an international initiative, or dramatically scaling access/participation — even without national prominence.
7-8 (Tier 2): President/captain/founder of a significant regional org or venture OR Significant Family Responsibilities/Work (20+ hrs/wk).
5-6 (Tier 3): Core officer in school clubs OR Moderate Family Responsibilities (10-15 hrs/wk).
2-4 (Tier 4): Active participation in clubs (e.g. 3-5 hrs/wk), minor volunteering. General member.
0-1 (Performative/None): Blank list or resume padding (listing clubs with 1 hr/wk and no impact).`,
  },
  {
    key: "extracurricular_depth",
    label: "Extracurricular depth",
    weight: 0.15,
    measures: `9-10 (Tier 1): Pre-professional level, published research, elite selective summer programs.
7-8 (Tier 2): Sustained focus (3-4 years) in a clear 'spike' area, significant personal projects.
5-6 (Tier 3): Standard school clubs, scattered interests, moderate commitment.
2-4 (Tier 4): Superficial activities, low hours.
0-1 (None): Barely any extracurriculars.`,
  },
  {
    key: "awards",
    label: "Awards & recognition",
    weight: 0.1,
    measures: `10 (Tier 1, elite): Olympiad-medal caliber — IMO/IPhO/IChO medal, Intel ISEF / global grand award. The very top of the international pool.
9 (Tier 1): Genuine international recognition below olympiad-medal level — top placement at a selective international competition, a selective international delegate/representative, or an international award tied to a real outcome (e.g. seed funding, advancing to world finals).
7-8 (Tier 2): National-level recognition — a national award, top placement against a national field, or a national qualifier; strong State/Regional awards.
5-6 (Tier 3): School/Local level awards.
2-4 (Tier 4): Minor recognition (e.g. Honor Roll).
0-1 (None): No awards.`,
  },
  {
    key: "narrative_fit",
    label: "Narrative / fit",
    weight: 0.1,
    measures: `9-10 (Tier 1): A cohesive throughline where the field(s), activities, and goal all point the same direction. Coherence is judged by the throughline, NOT by the number of fields — a focused single-field spike and a tightly INTEGRATED interdisciplinary combo (e.g. CS + Economics aimed at fintech/a startup, where the same projects fuse building and business) score equally here.
7-8 (Tier 2): Clear direction and logical connection between activities and goals, but the story is not yet tightly integrated.
5-6 (Tier 3): Generic but plausible intended major without deep backing evidence.
2-4 (Tier 4): Genuinely scattered across unrelated fields, or goals that contradict the activities.
0-1 (None): Unclear why they are applying to this field.`,
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
