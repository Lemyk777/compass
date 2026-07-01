// Deterministic Hong Kong admission analysis engine.
//
// No AI involvement: all reasoning is computed from hard dataset values, so
// there is zero hallucination risk on the HK pathway (mirrors italy-analyze.ts).
//
// HONEST INDEX (no fabricated conversion): a candidate is compared in their OWN
// system against the programme's published reference in that SAME system —
//   - IB applicants: their IB total vs the IB band (min_ib / typical_ib),
//   - SAT applicants: their SAT vs the SAT reference (sat_reference ± a
//     competitive margin),
//   - neither: an honest, deliberately-rough estimate.
// We do NOT synthesise an "IB-equivalent" from SAT — HK universities publish real
// IB, A-Level and SAT requirements, so there's no need to invent a cross-walk.
//
// HK admission is holistic and interview-based for the most competitive
// programmes, so there is no numeric "guaranteed" branch: we place the candidate
// into a reach/target/likely band, treat a required interview as a genuine gate,
// frame predicted grades as a Conditional Offer, and flag merit-scholarship range
// — keeping the read honest and directional.

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

// Width (in SAT points) of the competitive band below a programme's reference
// SAT. A transparent ± range around the published typical — NOT a cross-system
// conversion. A SAT within this margin of the reference counts as "in range".
const SAT_BAND = 120;

// Neutral IB midpoint used only when the student gave neither IB nor SAT, so the
// read stays deliberately rough (wide) rather than pretending to a number.
const ESTIMATE_IB = 33;

type Scale = "ib" | "sat" | "estimate";

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
 * How a strong record nudges the read. Academics stay dominant: the bonus is
 * capped and expressed in the candidate's native scale (IB points or SAT points),
 * so achievements lift a borderline candidate but never carry a clearly-
 * underqualified one. interviewReady marks a record strong enough that an
 * interview gate is an opportunity, not just a cap.
 */
function achievementBonus(a: AchievementSignal, scale: Scale): number {
  if (a.score >= 8) return scale === "sat" ? 60 : 2;
  if (a.score >= 5) return scale === "sat" ? 30 : 1;
  return 0;
}

// ── Native academic index ─────────────────────────────────────────────────────

/** The candidate's index in their OWN system — no conversion. */
function pickIndex(inputs: HkInputs): { index: number; scale: Scale } {
  if (inputs.ibTotal != null) return { index: inputs.ibTotal, scale: "ib" };
  if (inputs.sat != null) return { index: inputs.sat, scale: "sat" };
  return { index: ESTIMATE_IB, scale: "estimate" }; // keep ranges wide
}

/** The programme's reference band in the candidate's native scale. */
function bandFor(p: HkProgram, scale: Scale): { min: number; typical: number } {
  if (scale === "sat") {
    return { min: p.sat_reference - SAT_BAND, typical: p.sat_reference };
  }
  return { min: p.min_ib, typical: p.typical_ib }; // ib + estimate read on the IB band
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

/** Reach/target/likely from the index vs the programme's band (same scale). */
function bandStatus(
  index: number,
  band: { min: number; typical: number }
): "likely" | "target" | "reach" {
  if (index >= band.typical) return "likely";
  if (index >= band.min) return "target";
  return "reach";
}

function computeScholarship(
  p: HkProgram,
  index: number,
  scale: Scale
): "likely_full" | "likely_partial" | "unlikely" | "unknown" {
  if (scale === "estimate") return "unknown";
  if (scale === "sat") {
    // Full-tuition entrance scholarships in HK go to the very top admits; partial
    // aid tracks scoring at/above the programme's competitive reference.
    if (index >= 1520) return "likely_full";
    if (index >= p.sat_reference - 30) return "likely_partial";
    return "unlikely";
  }
  // IB scale.
  if (index >= 44) return "likely_full";
  if (index >= p.scholarship_ib_cutoff) return "likely_partial";
  return "unlikely";
}

// ── One programme ─────────────────────────────────────────────────────────────

function analyzeOne(p: HkProgram, inputs: HkInputs, ach: AchievementSignal): HkProgramAnalysis {
  const { index, scale } = pickIndex(inputs);
  const band = bandFor(p, scale);
  const bonus = achievementBonus(ach, scale);
  const interviewReady = ach.score >= 7;
  // Achievements give a capped lift to the index used for banding/scholarship,
  // while user_index keeps reporting the honest academic index.
  const effectiveIndex = index + bonus;

  const rawStatus = bandStatus(index, band); // grades alone
  let status = bandStatus(effectiveIndex, band); // grades + record
  // The interview is a real gate — strong grades alone never make it "likely",
  // UNLESS the student's record is strong enough to carry the interview.
  if (p.interview_required && status === "likely" && !interviewReady) status = "target";

  const scholarship = computeScholarship(p, effectiveIndex, scale);
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
    index_source: scale,
    min_ib: p.min_ib,
    typical_ib: p.typical_ib,
    min_sat: p.sat_reference - SAT_BAND,
    typical_sat: p.sat_reference,
    interview_required: p.interview_required,
    scholarship,
    english,
    conditional_offer,
    annual_fee_hkd: p.annual_fee_hkd,
    reasoning: buildReasoning(p, { index, scale, band, status, rawStatus, scholarship, english, conditional_offer, ach, interviewReady }),
    roadmap: buildRoadmap(p, conditional_offer),
    notes: p.notes,
  };
}

// ── Reasoning ─────────────────────────────────────────────────────────────────

type Computed = {
  index: number;
  scale: Scale;
  band: { min: number; typical: number };
  status: "likely" | "target" | "reach";
  rawStatus: "likely" | "target" | "reach";
  scholarship: "likely_full" | "likely_partial" | "unlikely" | "unknown";
  english: "meets" | "below" | "unknown";
  conditional_offer: boolean;
  ach: AchievementSignal;
  interviewReady: boolean;
};

function buildReasoning(p: HkProgram, c: Computed): string {
  // Everything is phrased in the candidate's native system — never a fabricated
  // IB-equivalent for a SAT applicant.
  const sourceNote =
    c.scale === "ib"
      ? `Your IB total of ${c.index}`
      : c.scale === "sat"
        ? `Your SAT of ${c.index}`
        : `Without an IB total or SAT we've assumed a neutral read, so this is deliberately rough`;

  const typLabel = c.scale === "ib" ? `~${c.band.typical}/45` : `~${c.band.typical}`;
  const minLabel = c.scale === "ib" ? `~${c.band.min}` : `~${c.band.min}`;

  const placement =
    c.scale === "estimate"
      ? ``
      : c.index >= c.band.typical
        ? ` is at or above this programme's competitive level (${typLabel})`
        : c.index >= c.band.min
          ? ` is between the lower boundary (${minLabel}) and the competitive level (${typLabel})`
          : ` is below the lower boundary for serious contention (${minLabel})`;

  const bandLine =
    c.status === "likely"
      ? `On academics you are a strong, likely candidate for ${p.university} ${p.program_name}.`
      : c.status === "target"
        ? `${p.university} ${p.program_name} is a realistic target — competitive, but in range.`
        : `${p.university} ${p.program_name} is a reach at your current standing.`;

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
      ? ` At your standing you are in full-tuition entrance-scholarship territory (awarded automatically with the offer — no separate application).`
      : c.scholarship === "likely_partial"
        ? ` You are within range of a partial entrance scholarship, which HK universities consider automatically; a higher score raises the award.`
        : c.scholarship === "unlikely"
          ? ` A merit scholarship is unlikely at this level — they are reserved for the very top admits.`
          : "";

  const englishLine =
    c.english === "below"
      ? ` Heads up: your English score is below this programme's typical bar (IELTS ${p.english_ielts}); raise it before applying.`
      : c.english === "unknown"
        ? ` Add an IELTS/TOEFL score (IELTS ${p.english_ielts}+ expected) so we can confirm the English requirement.`
        : "";

  return (
    `${bandLine} ${sourceNote}${placement}.` +
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
    "Entrance scholarships are considered automatically from your application — there is no separate form; a stronger academic record raises the award."
  );

  steps.push(
    "After you receive an offer, apply for a student visa via the university (the No-Objection / IANG framework); start 6–8 weeks before term."
  );

  return steps;
}
