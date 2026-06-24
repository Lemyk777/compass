// Deterministic Hong Kong admission analysis engine.
//
// No AI involvement: all reasoning is computed from hard dataset values, so
// there is zero hallucination risk on the HK pathway (mirrors italy-analyze.ts).
//
// HK admission differs from the US and Italy: it is holistic, academically
// meritocratic, and interview-based for the most competitive programmes. There
// is no numeric "guaranteed" branch like Italy's Bando. We therefore:
//   - normalise the candidate onto the IB 45-point scale (SAT is the universal
//     yardstick when the student isn't on IB),
//   - place them against each programme's typical-admitted and lower-boundary
//     index to produce a reach/target/likely band,
//   - treat a required interview as a genuine gate (never "likely" on grades
//     alone),
//   - frame predicted grades as a Conditional Offer, and
//   - flag merit-scholarship range — and keep the read honest and directional.

import { findHkProgram, type HkProgram } from "@/lib/data/hk-universities";
import type { HkProgramAnalysis } from "@/lib/ai/schema";
import {
  computeAchievementSignal,
  type AchievementSignal,
} from "@/lib/ai/achievements";
import type { Activity, Honor } from "@/lib/types";

export type HkGradeStatus = "predicted" | "achieved";

export type HkInputs = {
  ibTotal?: number;
  sat?: number;
  ielts?: number;
  toefl?: number;
  gradeStatus: HkGradeStatus;
  // HK admission is academically meritocratic + interview-based, but a genuine
  // record still matters (interview, competitive programmes, scholarships). We
  // weigh it deterministically from the structured activities/honors.
  activities?: Activity[];
  honors?: Honor[];
};

export function analyzeHkPrograms(
  programIds: string[],
  inputs: HkInputs
): HkProgramAnalysis[] {
  if (!programIds.length) return [];
  const achievements = computeAchievementSignal(inputs.activities, inputs.honors);
  return programIds
    .map((id) => findHkProgram(id))
    .filter((p): p is HkProgram => p != null)
    .map((p) => analyzeOne(p, inputs, achievements));
}

/**
 * How a strong record nudges a HK read. Academics stay dominant: the bonus is
 * capped at +2 on the IB-45 scale, so achievements lift a borderline candidate
 * but never carry a clearly-underqualified one. interviewReady marks a record
 * strong enough that an interview gate is an opportunity, not just a cap.
 */
function achievementEffect(a: AchievementSignal): { bonus: number; interviewReady: boolean } {
  const bonus = a.score >= 8 ? 2 : a.score >= 5 ? 1 : 0;
  return { bonus, interviewReady: a.score >= 7 };
}

// ── Academic index (IB 45-scale) ──────────────────────────────────────────────

function ibFromSat(sat: number): number {
  // Directional alignment: SAT 1100 ≈ IB 24, SAT 1600 ≈ IB 45.
  const ib = 24 + ((sat - 1100) * (45 - 24)) / (1600 - 1100);
  return Math.round(Math.max(20, Math.min(45, ib)));
}

function computeIndex(inputs: HkInputs): {
  index: number;
  source: "ib" | "sat" | "estimate";
} {
  if (inputs.ibTotal != null) return { index: inputs.ibTotal, source: "ib" };
  if (inputs.sat != null) return { index: ibFromSat(inputs.sat), source: "sat" };
  return { index: 33, source: "estimate" }; // neutral midpoint → keep ranges wide
}

// ── English ───────────────────────────────────────────────────────────────────

function ieltsEquivalent(inputs: HkInputs): number | null {
  if (inputs.ielts != null) return inputs.ielts;
  if (inputs.toefl != null) {
    if (inputs.toefl >= 100) return 7;
    if (inputs.toefl >= 79) return 6.5;
    return 6;
  }
  return null;
}

function englishStatus(p: HkProgram, inputs: HkInputs): "meets" | "below" | "unknown" {
  const eq = ieltsEquivalent(inputs);
  if (eq == null) return "unknown";
  return eq >= p.english_ielts ? "meets" : "below";
}

// ── Band ──────────────────────────────────────────────────────────────────────

/** Pure academic band, before the interview gate. */
function bandFor(p: HkProgram, index: number): "likely" | "target" | "reach" {
  if (index >= p.typical_ib) return "likely";
  if (index >= p.min_ib) return "target";
  return "reach";
}

function computeScholarship(
  p: HkProgram,
  index: number,
  source: "ib" | "sat" | "estimate"
): "likely_full" | "likely_partial" | "unlikely" | "unknown" {
  if (source === "estimate") return "unknown";
  if (index >= 44) return "likely_full";
  if (index >= p.scholarship_ib_cutoff) return "likely_partial";
  return "unlikely";
}

// ── One programme ─────────────────────────────────────────────────────────────

function analyzeOne(p: HkProgram, inputs: HkInputs, ach: AchievementSignal): HkProgramAnalysis {
  const { index, source } = computeIndex(inputs);
  const { bonus, interviewReady } = achievementEffect(ach);
  // Achievements give a capped lift to the index used for banding/scholarship,
  // while user_index keeps reporting the honest academic index.
  const effectiveIndex = Math.max(20, Math.min(45, index + bonus));

  const rawStatus = bandFor(p, index); // grades alone
  let status = bandFor(p, effectiveIndex); // grades + record
  // The interview is a real gate — strong grades alone never make it "likely",
  // UNLESS the student's record is strong enough to carry the interview.
  if (p.interview_required && status === "likely" && !interviewReady) status = "target";

  const scholarship = computeScholarship(p, effectiveIndex, source);
  const english = englishStatus(p, inputs);
  const conditional_offer = inputs.gradeStatus === "predicted";

  return {
    program_id: p.id,
    university: p.university,
    program_name: p.program_name,
    field: p.field,
    status,
    grade_status: inputs.gradeStatus,
    user_index: index,
    index_source: source,
    min_ib: p.min_ib,
    typical_ib: p.typical_ib,
    interview_required: p.interview_required,
    scholarship,
    english,
    conditional_offer,
    annual_fee_hkd: p.annual_fee_hkd,
    reasoning: buildReasoning(p, { index, source, status, rawStatus, scholarship, english, conditional_offer, ach, interviewReady }),
    roadmap: buildRoadmap(p, conditional_offer),
    notes: p.notes,
  };
}

// ── Reasoning ─────────────────────────────────────────────────────────────────

type Computed = {
  index: number;
  source: "ib" | "sat" | "estimate";
  status: "likely" | "target" | "reach";
  rawStatus: "likely" | "target" | "reach";
  scholarship: "likely_full" | "likely_partial" | "unlikely" | "unknown";
  english: "meets" | "below" | "unknown";
  conditional_offer: boolean;
  ach: AchievementSignal;
  interviewReady: boolean;
};

function buildReasoning(p: HkProgram, c: Computed): string {
  const sourceNote =
    c.source === "ib"
      ? `Your IB total of ${c.index}`
      : c.source === "sat"
        ? `Your SAT maps to an IB-equivalent of ~${c.index}`
        : `Without grades or an SAT we've assumed a neutral index (~${c.index}), so this read is deliberately rough`;

  const placement =
    c.index >= p.typical_ib
      ? `is at or above the typical admitted index (~${p.typical_ib})`
      : c.index >= p.min_ib
        ? `is between the lower boundary (~${p.min_ib}) and the typical admitted index (~${p.typical_ib})`
        : `is below the lower boundary for serious contention (~${p.min_ib})`;

  const bandLine =
    c.status === "likely"
      ? `On academics you are a strong, likely candidate for ${p.university} ${p.program_name}.`
      : c.status === "target"
        ? `${p.university} ${p.program_name} is a realistic target — competitive, but in range.`
        : `${p.university} ${p.program_name} is a reach at your current index.`;

  const interviewLine = p.interview_required
    ? c.interviewReady && c.status === "likely"
      ? ` This programme interviews shortlisted applicants; your record positions you well, though the interview still finalises the outcome.`
      : ` This programme interviews shortlisted applicants, so the interview — not grades alone — decides the outcome; that is why even strong grades sit no higher than "target" here.`
    : "";

  // How the student's record (deterministic achievement signal) shaped the read.
  const achLine = achievementLine(p, c);

  const offerLine = c.conditional_offer
    ? ` Because your grades are predicted, a strong application would lead to a Conditional Offer — confirmed once you actually achieve those grades.`
    : "";

  const scholarshipLine =
    c.scholarship === "likely_full"
      ? ` At your index you are in full-tuition entrance-scholarship territory (awarded automatically with the offer — no separate application).`
      : c.scholarship === "likely_partial"
        ? ` You are within range of a partial entrance scholarship, which HK universities consider automatically; a higher index raises the award.`
        : c.scholarship === "unlikely"
          ? ` A merit scholarship is unlikely at this index — they are reserved for the very top admits.`
          : "";

  const englishLine =
    c.english === "below"
      ? ` Heads up: your English score is below this programme's typical bar (IELTS ${p.english_ielts}); raise it before applying.`
      : c.english === "unknown"
        ? ` Add an IELTS/TOEFL score (IELTS ${p.english_ielts}+ expected) so we can confirm the English requirement.`
        : "";

  return (
    `${bandLine} ${sourceNote} ${placement}.` +
    achLine +
    interviewLine +
    offerLine +
    scholarshipLine +
    englishLine +
    ` HK admission is holistic, so treat this as a directional read — not a guarantee.`
  );
}

/**
 * One sentence on how the student's record moved the read: it can upgrade a
 * grades-only band, reinforce an interview case, or — when thin — flag the gap.
 */
function achievementLine(p: HkProgram, c: Computed): string {
  const what = c.ach.topAwardLevel
    ? `${/^[aeiou]/i.test(c.ach.topAwardLevel) ? "an" : "a"} ${c.ach.topAwardLevel.toLowerCase()}-level award`
    : c.ach.hasSpike
      ? "a sustained, led extracurricular"
      : c.ach.hasLeadership
        ? "a genuine leadership role"
        : "your record";

  if (c.ach.score >= 5) {
    if (c.status !== c.rawStatus) {
      return ` Your achievements (${what}) lift this from a grades-only "${c.rawStatus}" to "${c.status}" — HK weighs a real record, especially ${p.interview_required ? "at interview" : "for competitive programmes and scholarships"}.`;
    }
    if (p.interview_required && c.interviewReady) {
      return ` Your achievements (${what}) position you well for the interview, which ultimately decides this programme.`;
    }
    return ` Your achievements (${what}) strengthen the application beyond grades.`;
  }
  return ` Your extracurricular/awards record is thin; in HK a clear achievement (a regional/national award or a sustained, led project) would strengthen ${p.interview_required ? "your interview standing" : "competitive-programme and scholarship chances"}.`;
}

// ── Roadmap ───────────────────────────────────────────────────────────────────

function buildRoadmap(p: HkProgram, conditional: boolean): string[] {
  const steps: string[] = [
    `Apply directly through ${p.university}'s international / Non-JUPAS online application — there is no central UCAS-style system for international applicants in Hong Kong.`,
    `Submit your transcript with ${conditional ? "predicted" : "achieved"} grades and an English certificate (IELTS ${p.english_ielts}+ or the TOEFL equivalent).`,
  ];

  if (p.interview_required) {
    steps.push(
      "Prepare for the admission interview — expect subject reasoning and motivation questions; the most competitive programmes run multiple rounds."
    );
  }

  steps.push(
    "Entrance scholarships are considered automatically from your application — there is no separate form; a stronger academic index raises the award."
  );

  steps.push(
    "After you receive an offer, apply for a student visa via the university (the No-Objection / IANG framework); start 6–8 weeks before term."
  );

  return steps;
}
