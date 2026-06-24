/**
 * Deterministic-scoring sanity check (no ANTHROPIC_API_KEY needed).
 *
 *   node --import tsx scripts/check-scoring.ts
 *
 * Reproduces the reported case — a strong leadership role with the optional
 * hours fields left blank — and prints ALL seven factor scores (6 now computed
 * deterministically in code) plus the per-school likelihood, showing the RAW
 * (survivorship-biased) curve, the acceptance-rate-CALIBRATED number, and the
 * extra international haircut.
 */
import { scoreHolistic, scoreAcademicFactors } from "../lib/ai/tier-score";
import {
  academicIndexFromProfile,
  estimateSchoolLikelihood,
  isInternationalApplicant,
} from "../lib/ai/empirical";
import { findUniversity } from "../lib/data/universities";
import admitModel from "../lib/data/admit-model.json";
import type { StudentProfileInput } from "../lib/types";

const sigmoid = (x: number) => 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, x))));

// Strong leader, NO hours filled in (the exact gap the friend hit).
const profile = {
  country: "Kazakhstan",
  citizenship: "Kazakhstan",
  curriculum: "national",
  intended_major: "Computer Science",
  faculties: ["engineering"],
  grades: { gpa: 3.9 },
  tests: { SAT: 1520, IELTS: 7.5 },
  activities: [
    {
      type: "Computer/Technology",
      position: "Founder & President",
      organization: "National Student Coding League",
      description: "Built and led a nationwide olympiad-prep network across 12 cities.",
      grades: ["9", "10", "11", "12"],
      // hours_per_week / weeks_per_year intentionally omitted
      continue_in_college: true,
    },
  ],
  honors: [
    { title: "National Informatics Olympiad — Gold", levels: ["national"] },
  ],
  target_schools: ["Harvard University"],
} as unknown as StudentProfileInput;

console.log("=== All 7 factor tiers (6 deterministic in code) ===");
const factors = [
  ...scoreAcademicFactors({ grades: profile.grades, tests: profile.tests, curriculum: profile.curriculum || undefined }),
  ...scoreHolistic({
    activities: profile.activities ?? [],
    honors: profile.honors ?? [],
    intended_major: profile.intended_major ?? "",
    faculties: profile.faculties ?? [],
  }).factors,
];
for (const f of factors) {
  console.log(`  ${f.factor.padEnd(22)} ${String(f.score).padStart(4)}/10  ${f.tierName}`);
}

console.log("\n=== Per-school likelihood: RAW vs CALIBRATED vs +INTERNATIONAL ===");
const index = academicIndexFromProfile(profile);
console.log(`  academic index: ${index}  ·  international: ${isInternationalApplicant(profile)}\n`);
const schools = ["harvard", "stanford", "cornell", "duke", "purdue"];
const M = (admitModel as { schools: Record<string, { a: number; b: number; n: number; admits: number }> }).schools;
for (const id of schools) {
  const uni = findUniversity(id);
  if (!uni) continue;
  const m = M[id];
  const raw = m ? sigmoid(m.a + m.b * (index / 100)) * 100 : NaN;
  const dom = estimateSchoolLikelihood(uni, index, { international: false });
  const intl = estimateSchoolLikelihood(uni, index, { international: true });
  console.log(
    `  ${uni.name.padEnd(26)} real=${(uni.acceptance_rate * 100).toFixed(1)}%  rawCurve=${raw.toFixed(0)}%  ` +
      `domestic=${dom.likelihood_low}-${dom.likelihood_high}%  intl=${intl.likelihood_low}-${intl.likelihood_high}% (${intl.tier})`
  );
}
