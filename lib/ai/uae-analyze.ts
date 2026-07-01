// Deterministic United Arab Emirates admission analysis engine.
//
// No AI involvement: all reasoning is computed from hard dataset values, so
// there is zero hallucination risk on the UAE pathway (mirrors hk-analyze.ts and
// italy-analyze.ts).
//
// UAE undergraduate admission is grades-first and SAT-driven for international
// applicants: most universities admit on high-school GPA + SAT + an English
// certificate, with interviews reserved for the most selective seats (NYU Abu
// Dhabi's Candidate Weekend, direct-entry Medicine MMIs) and generous merit aid.
// We therefore:
//   - use the SAT (1600 scale) as the academic index (mapping from GPA when the
//     student hasn't sat the SAT),
//   - place the candidate against each programme's typical-admitted and lower-
//     boundary SAT to produce a reach/target/likely band,
//   - treat a required interview as a genuine gate (never "likely" on scores
//     alone unless the record carries it),
//   - frame predicted grades as a Conditional Offer,
//   - surface merit-scholarship range (and need-blind full-need aid at NYUAD),
//   - and keep the read honest and directional.

import { findUaeProgram, type UaeProgram } from "@/lib/data/uae-universities";
import type { UaeProgramAnalysis } from "@/lib/ai/schema";
import {
  computeAchievementSignal,
  type AchievementSignal,
} from "@/lib/ai/achievements";
import type { Activity, Honor } from "@/lib/types";

export type UaeGradeStatus = "predicted" | "achieved";

export type UaeInputs = {
  sat?: number;
  gpaPercent?: number; // 0–100 (scale-normalized), used only when there's no SAT
  ielts?: number;
  toefl?: number;
  gradeStatus: UaeGradeStatus;
  // UAE admission is grades-first, but a real record still matters (holistic
  // review at NYUAD, interviews, merit scholarships). We weigh it deterministically
  // from the structured activities/honors.
  activities?: Activity[];
  honors?: Honor[];
};

export function analyzeUaePrograms(
  programIds: string[],
  inputs: UaeInputs
): UaeProgramAnalysis[] {
  if (!programIds.length) return [];
  const achievements = computeAchievementSignal(inputs.activities, inputs.honors);
  return programIds
    .map((id) => findUaeProgram(id))
    .filter((p): p is UaeProgram => p != null)
    .map((p) => analyzeOne(p, inputs, achievements));
}

/**
 * How a strong record nudges a UAE read. Academics stay dominant: the bonus is
 * capped so a strong achievement lifts a borderline candidate but never carries a
 * clearly-underqualified one. It matters most at NYUAD (holistic, need-blind) and
 * for interview/scholarship seats. Bonus is expressed on the SAT scale.
 * interviewReady marks a record strong enough that an interview gate is an
 * opportunity, not just a cap.
 */
function achievementEffect(a: AchievementSignal): { bonus: number; interviewReady: boolean } {
  const bonus = a.score >= 8 ? 60 : a.score >= 5 ? 30 : 0;
  return { bonus, interviewReady: a.score >= 7 };
}

// ── Academic index (SAT 1600-scale) ───────────────────────────────────────────

function satFromGpaPercent(percent: number): number {
  // Directional alignment: 60% ≈ SAT 900, 100% ≈ SAT 1550.
  const sat = 900 + (percent - 60) * ((1550 - 900) / (100 - 60));
  return Math.round(Math.max(800, Math.min(1600, sat)));
}

function computeIndex(inputs: UaeInputs): {
  index: number;
  source: "sat" | "gpa" | "estimate";
} {
  if (inputs.sat != null) return { index: inputs.sat, source: "sat" };
  if (inputs.gpaPercent != null)
    return { index: satFromGpaPercent(inputs.gpaPercent), source: "gpa" };
  return { index: 1200, source: "estimate" }; // neutral midpoint → keep ranges wide
}

// ── English ───────────────────────────────────────────────────────────────────

function ieltsEquivalent(inputs: UaeInputs): number | null {
  if (inputs.ielts != null) return inputs.ielts;
  if (inputs.toefl != null) {
    if (inputs.toefl >= 100) return 7;
    if (inputs.toefl >= 79) return 6.5;
    if (inputs.toefl >= 61) return 6;
    return 5.5;
  }
  return null;
}

function englishStatus(p: UaeProgram, inputs: UaeInputs): "meets" | "below" | "unknown" {
  const eq = ieltsEquivalent(inputs);
  if (eq == null) return "unknown";
  return eq >= p.english_ielts ? "meets" : "below";
}

// ── Band ──────────────────────────────────────────────────────────────────────

/** Pure academic band, before the interview gate. */
function bandFor(p: UaeProgram, index: number): "likely" | "target" | "reach" {
  if (index >= p.typical_sat) return "likely";
  if (index >= p.min_sat) return "target";
  return "reach";
}

function computeScholarship(
  p: UaeProgram,
  index: number,
  status: "likely" | "target" | "reach",
  source: "sat" | "gpa" | "estimate"
): "likely_full" | "likely_partial" | "unlikely" | "unknown" {
  // NYU Abu Dhabi is need-blind and meets 100% of demonstrated need; admits are
  // also considered for full-ride merit — so any admissible candidate is in
  // full-support territory.
  if (p.need_blind) return status === "reach" ? "likely_partial" : "likely_full";
  if (source === "estimate") return "unknown";
  if (index >= p.scholarship_sat_cutoff + 70) return "likely_full";
  if (index >= p.scholarship_sat_cutoff) return "likely_partial";
  return "unlikely";
}

// ── One programme ─────────────────────────────────────────────────────────────

function analyzeOne(p: UaeProgram, inputs: UaeInputs, ach: AchievementSignal): UaeProgramAnalysis {
  const { index, source } = computeIndex(inputs);
  const { bonus, interviewReady } = achievementEffect(ach);
  // Achievements give a capped lift to the index used for banding/scholarship,
  // while user_index keeps reporting the honest academic index.
  const effectiveIndex = Math.max(800, Math.min(1600, index + bonus));

  const rawStatus = bandFor(p, index); // scores alone
  let status = bandFor(p, effectiveIndex); // scores + record
  // The interview is a real gate — strong scores alone never make it "likely",
  // UNLESS the student's record is strong enough to carry the interview.
  if (p.interview_required && status === "likely" && !interviewReady) status = "target";

  const scholarship = computeScholarship(p, effectiveIndex, status, source);
  const english = englishStatus(p, inputs);
  const conditional_offer = inputs.gradeStatus === "predicted";

  return {
    program_id: p.id,
    university: p.university,
    emirate: p.emirate,
    program_name: p.program_name,
    field: p.field,
    status,
    grade_status: inputs.gradeStatus,
    user_index: index,
    index_source: source,
    min_sat: p.min_sat,
    typical_sat: p.typical_sat,
    interview_required: p.interview_required,
    need_blind: p.need_blind,
    scholarship,
    english,
    conditional_offer,
    annual_fee_usd: p.annual_fee_usd,
    reasoning: buildReasoning(p, { index, source, status, rawStatus, scholarship, english, conditional_offer, ach, interviewReady }),
    roadmap: buildRoadmap(p, conditional_offer),
    notes: p.notes,
  };
}

// ── Reasoning ─────────────────────────────────────────────────────────────────

type Computed = {
  index: number;
  source: "sat" | "gpa" | "estimate";
  status: "likely" | "target" | "reach";
  rawStatus: "likely" | "target" | "reach";
  scholarship: "likely_full" | "likely_partial" | "unlikely" | "unknown";
  english: "meets" | "below" | "unknown";
  conditional_offer: boolean;
  ach: AchievementSignal;
  interviewReady: boolean;
};

function buildReasoning(p: UaeProgram, c: Computed): string {
  const sourceNote =
    c.source === "sat"
      ? `Your SAT of ${c.index}`
      : c.source === "gpa"
        ? `Your GPA maps to an SAT-equivalent of ~${c.index}`
        : `Without an SAT or GPA we've assumed a neutral index (~${c.index}), so this read is deliberately rough`;

  const placement =
    c.index >= p.typical_sat
      ? `is at or above the typical admitted SAT (~${p.typical_sat})`
      : c.index >= p.min_sat
        ? `is between the lower boundary (~${p.min_sat}) and the typical admitted SAT (~${p.typical_sat})`
        : `is below the lower boundary for serious contention (~${p.min_sat})`;

  const bandLine =
    c.status === "likely"
      ? `On academics you are a strong, likely candidate for ${p.university} ${p.program_name}.`
      : c.status === "target"
        ? `${p.university} ${p.program_name} is a realistic target — competitive, but in range.`
        : `${p.university} ${p.program_name} is a reach at your current index.`;

  const interviewLine = p.interview_required
    ? c.interviewReady && c.status === "likely"
      ? ` This programme interviews shortlisted applicants; your record positions you well, though the interview still finalises the outcome.`
      : ` This programme interviews shortlisted applicants${p.need_blind ? " (a Candidate Weekend)" : p.field === "medicine" ? " (a Multiple Mini-Interview)" : ""}, so the interview — not scores alone — decides the outcome; that is why even strong scores sit no higher than "target" here.`
    : "";

  const achLine = achievementLine(p, c);

  const offerLine = c.conditional_offer
    ? ` Because your grades are predicted, a strong application would lead to a Conditional Offer — confirmed once you actually achieve those grades.`
    : "";

  const scholarshipLine =
    c.scholarship === "likely_full"
      ? p.need_blind
        ? ` NYU Abu Dhabi is need-blind and meets 100% of demonstrated need; at your level you are also in full-ride merit territory.`
        : ` At your index you are in full-tuition merit-scholarship territory — a major reason ${p.university} is such strong value.`
      : c.scholarship === "likely_partial"
        ? p.need_blind
          ? ` NYU Abu Dhabi is need-blind and meets full demonstrated need if you are admitted.`
          : ` You are within range of a partial merit scholarship, considered automatically from your SAT and GPA; a higher index raises the award.`
        : c.scholarship === "unlikely"
          ? ` A merit scholarship is unlikely at this index — the larger awards are reserved for the top admits.`
          : "";

  const englishLine =
    c.english === "below"
      ? ` Heads up: your English score is below this programme's bar (IELTS ${p.english_ielts}); raise it before applying.`
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
    ` UAE admission is grades-first but reviewed in full, so treat this as a directional read — not a guarantee.`
  );
}

/**
 * One sentence on how the student's record moved the read: it can upgrade a
 * scores-only band, reinforce an interview case, or — when thin — flag the gap.
 */
function achievementLine(p: UaeProgram, c: Computed): string {
  const what = c.ach.topAwardLevel
    ? `${/^[aeiou]/i.test(c.ach.topAwardLevel) ? "an" : "a"} ${c.ach.topAwardLevel.toLowerCase()}-level award`
    : c.ach.hasSpike
      ? "a sustained, led extracurricular"
      : c.ach.hasLeadership
        ? "a genuine leadership role"
        : "your record";

  if (c.ach.score >= 5) {
    if (c.status !== c.rawStatus) {
      return ` Your achievements (${what}) lift this from a scores-only "${c.rawStatus}" to "${c.status}" — the UAE's stronger universities review the whole application, especially ${p.interview_required ? "at interview" : "for competitive majors and scholarships"}.`;
    }
    if (p.interview_required && c.interviewReady) {
      return ` Your achievements (${what}) position you well for the interview, which ultimately decides this programme.`;
    }
    return ` Your achievements (${what}) strengthen the application beyond scores.`;
  }
  return ` Your extracurricular/awards record is thin; a clear achievement (a regional/national award or a sustained, led project) would strengthen ${p.interview_required ? "your interview standing" : "competitive-major and scholarship chances"}.`;
}

// ── Roadmap ───────────────────────────────────────────────────────────────────

function buildRoadmap(p: UaeProgram, conditional: boolean): string[] {
  const steps: string[] = [
    `Apply directly through ${p.university}'s online international application — there is no single central application system for international applicants in the UAE.`,
    `Submit your high-school transcript with ${conditional ? "predicted" : "achieved"} grades, your SAT score, and an English certificate (IELTS ${p.english_ielts}+ or the TOEFL equivalent).`,
  ];

  if (p.interview_required) {
    steps.push(
      p.need_blind
        ? "Shortlisted applicants are invited to a Candidate Weekend — prepare for interviews and group activities that probe curiosity, fit and motivation."
        : p.field === "medicine"
          ? "Sit the admission test and prepare for the Multiple Mini-Interview (MMI) — expect ethics, motivation and science-reasoning stations."
          : "Prepare for the admission interview — expect subject-reasoning and motivation questions."
    );
  }

  steps.push(
    p.need_blind
      ? "Merit awards are considered automatically from your application; for need-based aid, submit NYU Abu Dhabi's financial-aid application alongside your admission application."
      : "Merit scholarships are considered automatically from your SAT and high-school GPA — there is usually no separate form; a stronger index raises the award."
  );

  steps.push(
    "After you receive an offer, the university sponsors your UAE student residence visa — start the paperwork 4–8 weeks before term."
  );

  return steps;
}
