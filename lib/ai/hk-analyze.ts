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

export type HkGradeStatus = "predicted" | "achieved";

export type HkInputs = {
  ibTotal?: number;
  sat?: number;
  ielts?: number;
  toefl?: number;
  gradeStatus: HkGradeStatus;
};

export function analyzeHkPrograms(
  programIds: string[],
  inputs: HkInputs
): HkProgramAnalysis[] {
  if (!programIds.length) return [];
  return programIds
    .map((id) => findHkProgram(id))
    .filter((p): p is HkProgram => p != null)
    .map((p) => analyzeOne(p, inputs));
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

function computeStatus(p: HkProgram, index: number): "likely" | "target" | "reach" {
  let s: "likely" | "target" | "reach";
  if (index >= p.typical_ib) s = "likely";
  else if (index >= p.min_ib) s = "target";
  else s = "reach";
  // The interview is a real gate — strong grades alone never make it "likely".
  if (p.interview_required && s === "likely") s = "target";
  return s;
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

function analyzeOne(p: HkProgram, inputs: HkInputs): HkProgramAnalysis {
  const { index, source } = computeIndex(inputs);
  const status = computeStatus(p, index);
  const scholarship = computeScholarship(p, index, source);
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
    reasoning: buildReasoning(p, { index, source, status, scholarship, english, conditional_offer }),
    roadmap: buildRoadmap(p, conditional_offer),
    notes: p.notes,
  };
}

// ── Reasoning ─────────────────────────────────────────────────────────────────

type Computed = {
  index: number;
  source: "ib" | "sat" | "estimate";
  status: "likely" | "target" | "reach";
  scholarship: "likely_full" | "likely_partial" | "unlikely" | "unknown";
  english: "meets" | "below" | "unknown";
  conditional_offer: boolean;
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
    ? ` This programme interviews shortlisted applicants, so the interview — not grades alone — decides the outcome; that is why even strong grades sit no higher than "target" here.`
    : "";

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
    interviewLine +
    offerLine +
    scholarshipLine +
    englishLine +
    ` HK admission is holistic, so treat this as a directional read — not a guarantee.`
  );
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
