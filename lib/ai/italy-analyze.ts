// Deterministic Italy admission analysis engine.
//
// No AI involvement: all reasoning is computed from hard database values.
// This eliminates hallucination risk entirely for the Italian pathway.
//
// Two admission branches exist (Forking Architecture):
//   Branch A – Guaranteed Enrollment (has_guaranteed_threshold = true)
//     The program's Bando specifies a SAT threshold. Clearing it secures a
//     seat before the formal ranking opens. No competition at this stage.
//
//   Branch B – Strict Graduatoria (has_guaranteed_threshold = false, or threshold not met)
//     All applicants are ranked by score after the deadline. The top N (quota)
//     claim the Extra-UE seats. A single stronger applicant can shift the cutoff.
//
// Volatility warning: for small quotas (≤ 3 seats), statistics break down.
// The "law of small numbers" means year-on-year swings are unpredictable.
// The engine flags this honestly rather than implying false precision.

import {
  findItalianProgram,
  type ItalianProgram,
} from "@/lib/data/italian-universities";
import { italyApplicationFee } from "@/lib/data/application-fees";
import type { ItalyProgramAnalysis, ItalyDSUFit } from "@/lib/ai/schema";

// DSU income thresholds (approximate ISEE equivalents, EUR/year).
// Real ISEE calculation is complex — this proxy is clearly approximate.
const DSU_STRONG_INCOME = 20000;
const DSU_MODERATE_INCOME = 35000;
const DSU_UNLIKELY_INCOME = 55000;

export function analyzeItalianPrograms(
  programIds: string[],
  userSAT: number | undefined,
  familyIncomeEUR: number | undefined
): ItalyProgramAnalysis[] {
  if (!programIds.length) return [];
  const sat = userSAT ?? 0;

  return programIds
    .map((id) => findItalianProgram(id))
    .filter((p): p is ItalianProgram => p != null)
    .map((program) => analyzeOneProgram(program, sat, familyIncomeEUR));
}

function analyzeOneProgram(
  program: ItalianProgram,
  userSAT: number,
  familyIncomeEUR: number | undefined
): ItalyProgramAnalysis {
  const { admission_branch, status } = determineAdmission(program, userSAT);
  const volatility = computeVolatility(program.extra_ue_quota);
  const dsu_fit = computeDSUFit(
    familyIncomeEUR,
    program.dsu_eligible,
    program.is_private
  );
  const reasoning = buildReasoning(
    program,
    userSAT,
    admission_branch,
    status,
    volatility
  );
  const roadmap = buildRoadmap(program, dsu_fit);

  return {
    program_id: program.id,
    university: program.university,
    program_name: program.program_name,
    city: program.city,
    field: program.field,
    level: program.level,
    language: program.language,
    admission_branch,
    status,
    user_sat: userSAT,
    historical_cutoff: program.historical_sat_cutoff,
    guaranteed_threshold: program.guaranteed_threshold,
    quota: program.extra_ue_quota,
    volatility,
    is_private: program.is_private,
    dsu_eligible: program.dsu_eligible,
    dsu_fit,
    annual_fee_eur: program.annual_fee_eur,
    application_fee_eur: italyApplicationFee(program.is_private),
    reasoning,
    roadmap,
    notes: program.notes,
  };
}

// ─── Admission branch + status ────────────────────────────────────────────────

function determineAdmission(
  program: ItalianProgram,
  userSAT: number
): { admission_branch: "guaranteed" | "graduatoria"; status: ItalyAdmissionStatus } {
  if (program.has_guaranteed_threshold && program.guaranteed_threshold != null) {
    if (userSAT >= program.guaranteed_threshold) {
      return { admission_branch: "guaranteed", status: "guaranteed" };
    }
    // Did not clear threshold — fall through to graduatoria logic,
    // but note that the guaranteed seat is not available.
  }

  // Branch B: Graduatoria
  const diff = userSAT - program.historical_sat_cutoff;
  const volatility = computeVolatility(program.extra_ue_quota);
  let status: ItalyAdmissionStatus;

  if (diff >= 80) {
    // Comfortably above — but small quotas can still surprise.
    status = volatility === "high" ? "target" : "likely";
  } else if (diff >= 0) {
    status = "target";
  } else if (diff >= -80) {
    status = "target"; // borderline — worth applying, but thin margin
  } else {
    status = "reach";
  }

  return { admission_branch: "graduatoria", status };
}

type ItalyAdmissionStatus = "guaranteed" | "likely" | "target" | "reach";

// ─── Volatility ───────────────────────────────────────────────────────────────

function computeVolatility(
  quota: number
): "stable" | "moderate" | "high" {
  if (quota >= 10) return "stable";
  if (quota >= 4) return "moderate";
  return "high";
}

// ─── DSU scholarship eligibility ──────────────────────────────────────────────

function computeDSUFit(
  incomeEUR: number | undefined,
  dsu_eligible: boolean,
  is_private: boolean
): ItalyDSUFit {
  if (!dsu_eligible || is_private) return "not_applicable";
  if (incomeEUR == null) return "unknown";
  if (incomeEUR <= DSU_STRONG_INCOME) return "strong";
  if (incomeEUR <= DSU_MODERATE_INCOME) return "moderate";
  if (incomeEUR <= DSU_UNLIKELY_INCOME) return "partial";
  return "unlikely";
}

// ─── Reasoning text ───────────────────────────────────────────────────────────

function buildReasoning(
  p: ItalianProgram,
  userSAT: number,
  branch: "guaranteed" | "graduatoria",
  status: ItalyAdmissionStatus,
  volatility: "stable" | "moderate" | "high"
): string {
  if (branch === "guaranteed" && status === "guaranteed") {
    return (
      `${p.university} uses an Early Admission system (Early Enrollment). ` +
      `Your SAT ${userSAT} clears their guaranteed-admission threshold (${p.guaranteed_threshold}). ` +
      `Under this system there is no ranking competition at this stage — the first ` +
      `applicants to meet the threshold claim seats from the ${p.extra_ue_quota}-seat ` +
      `Extra-UE quota before the main ranking phase even opens. ` +
      `Re-sitting the SAT for a higher score has zero mathematical value here — ` +
      `you have already hit the ceiling. ` +
      `Your next steps: prepare the document package and monitor the portal opening date.`
    );
  }

  const diff = userSAT - p.historical_sat_cutoff;
  const absDiff = Math.abs(diff);
  const quotaStr = `${p.extra_ue_quota} Extra-UE seat${p.extra_ue_quota === 1 ? "" : "s"}`;
  const volatilityNote = volatilityExplanation(p.extra_ue_quota, volatility);

  // Did they fail a guaranteed threshold?
  const thresholdNote =
    p.has_guaranteed_threshold && p.guaranteed_threshold != null
      ? ` (Note: Early Admission threshold is ${p.guaranteed_threshold} — your SAT ${userSAT} does not currently clear it, so you enter the standard ranking.)`
      : "";

  if (status === "likely") {
    return (
      `${p.university} ranks all Extra-UE applicants strictly by score after the deadline ` +
      `(Graduatoria).${thresholdNote} ` +
      `Your SAT ${userSAT} is +${absDiff} points above last year's recorded ` +
      `cutoff (${p.historical_sat_cutoff}), placing you mathematically above that benchmark. ` +
      `You are competing for ${quotaStr}. ` +
      volatilityNote +
      ` Chances are strong — maintain backup options and watch for the portal.`
    );
  }

  if (status === "target" && diff >= 0) {
    return (
      `${p.university} uses a strict merit ranking (Graduatoria).${thresholdNote} ` +
      `Your SAT ${userSAT} is +${absDiff} points above last year's cutoff ` +
      `(${p.historical_sat_cutoff}). You are positioned competitively for ` +
      `${quotaStr}. The margin is positive but not wide. ` +
      volatilityNote +
      ` Keep this as a primary option and secure at least one safety program.`
    );
  }

  if (status === "target" && diff < 0) {
    return (
      `${p.university} ranks applicants by score after the deadline.${thresholdNote} ` +
      `Your SAT ${userSAT} is ${absDiff} points below last year's cutoff ` +
      `(${p.historical_sat_cutoff}). You are in borderline territory for ` +
      `${quotaStr}. ` +
      volatilityNote +
      ` A retake improving your SAT by ${absDiff + 30}+ points would flip your position ` +
      `to above-threshold. Apply with a backup.`
    );
  }

  // reach
  return (
    `${p.university} selects via strict merit ranking (Graduatoria).${thresholdNote} ` +
    `Your SAT ${userSAT} is ${absDiff} points below last year's recorded ` +
    `cutoff (${p.historical_sat_cutoff}). With ${quotaStr}, ` +
    `this is a reach at your current score. ` +
    `An SAT improvement of ${absDiff + 50}+ points would make your application competitive. ` +
    `Include this as an aspirational option alongside stronger targets.`
  );
}

function volatilityExplanation(
  quota: number,
  volatility: "stable" | "moderate" | "high"
): string {
  if (volatility === "high") {
    return (
      `Critical caveat: with only ${quota} seat${quota === 1 ? "" : "s"}, ` +
      `this system is highly volatile — one applicant with a 30-point higher SAT ` +
      `can shift the cutoff entirely. Historical data here is directional, not predictive.`
    );
  }
  if (volatility === "moderate") {
    return (
      `With ${quota} seats, year-on-year cutoff variation of ±50 SAT points is normal — ` +
      `treat the historical benchmark as a guide, not a guarantee.`
    );
  }
  return (
    `The ${quota}-seat quota gives the statistics reasonable stability — ` +
    `historical cutoffs are a solid benchmark here.`
  );
}

// ─── Roadmap ──────────────────────────────────────────────────────────────────

function buildRoadmap(p: ItalianProgram, dsuFit: ItalyDSUFit): string[] {
  const steps: string[] = [
    "Obtain a Declaration of Value (Dichiarazione di Valore) from the Italian embassy in your country — this is the official recognition of your secondary education. Allow 2–3 months.",
    `Register on the universitaly.it portal and complete the pre-enrollment form before the ${p.university} Bando deadline.`,
    "Prepare an official transcript and have it apostilled / legalized.",
    "Obtain an Italian language certificate (B2 minimum) if the program is Italian-taught, or provide English proficiency evidence (IELTS / TOEFL) for English-taught programs.",
  ];

  if (dsuFit === "strong" || dsuFit === "moderate" || dsuFit === "partial") {
    steps.push(
      "Apply for a DSU (Diritto allo Studio Universitario) scholarship through your regional authority (DSU Lombardia for Milan, Lazio for Rome, etc.). Submit an ISEE Università form via INPS. Deadlines are usually September."
    );
  }

  if (!p.is_private) {
    steps.push(
      "Apply for a student visa (Type D — study) at the Italian consulate in your country once you receive your conditional offer letter. Begin this process at least 90 days before your program starts."
    );
  }

  if (p.is_private) {
    steps.push(
      "Apply through the university's own portal (not universitaly.it). Bocconi has its own scholarship program — apply separately from your admission application."
    );
  }

  return steps;
}

// ─── Financial fit score (for radar chart) ────────────────────────────────────

// Returns a 0–10 score representing how well the student's income profile
// aligns with DSU scholarship eligibility.
export function computeFinancialFitScore(
  familyIncomeEUR: number | undefined,
  hasItalyPrograms: boolean
): number {
  if (!hasItalyPrograms) return 5; // neutral when Italy not selected
  if (familyIncomeEUR == null) return 5; // unknown → neutral

  if (familyIncomeEUR <= 10000) return 10;
  if (familyIncomeEUR <= 20000) return 9;
  if (familyIncomeEUR <= 30000) return 7;
  if (familyIncomeEUR <= 45000) return 5;
  if (familyIncomeEUR <= 60000) return 3;
  return 1;
}
