// Deterministic South Korea admission analysis engine.
//
// No AI involvement: all reasoning is computed from hard dataset values, so
// there is zero hallucination risk on the Korea pathway (mirrors hk-analyze.ts,
// italy-analyze.ts and uae-analyze.ts).
//
// Korean undergraduate admission for international students is DOCUMENT-BASED
// and GPA-first: universities screen the transcript, a personal statement /
// study plan and recommendations — there is no entrance exam on this track and
// the SAT is optional almost everywhere. The decisive gate is LANGUAGE: TOPIK
// for Korean-taught programs, IELTS/TOEFL for English-taught ones. We therefore:
//   - use the school GPA as a percent of max (0–100) as the academic index,
//     mapping IB / SAT applicants onto it transparently when there's no GPA,
//   - place the candidate against each program's indicative admitted-GPA band
//     to produce a reach/target/likely band,
//   - treat the language requirement as a REAL gate: a candidate who hasn't
//     shown the required TOPIK/English level is never "likely", because the
//     credential is an eligibility document, not a nice-to-have,
//   - treat a required interview as a genuine gate (never "likely" on grades
//     alone unless the record carries it),
//   - frame predicted grades as a Conditional Offer,
//   - surface the merit-scholarship picture (KAIST's automatic full ride,
//     SKKU's language-linked waivers, admission scholarships elsewhere),
//   - and keep the read honest and directional.

import { findKoreaProgram, type KoreaProgram } from "@/lib/data/korea-universities";
import type { KoreaProgramAnalysis } from "@/lib/ai/schema";
import {
  computeAchievementSignal,
  type AchievementSignal,
} from "@/lib/ai/achievements";
import type { Activity, Honor } from "@/lib/types";

export type KoreaGradeStatus = "predicted" | "achieved";

export type KoreaInputs = {
  gpaPercent?: number; // 0–100 (scale-normalized) — the native Korean index
  ibTotal?: number; // used only when there's no GPA
  sat?: number; // used only when there's no GPA and no IB
  /** TOPIK level (1–6) the student holds, if any — collected in the KR builder. */
  topik?: number;
  ielts?: number;
  toefl?: number;
  gradeStatus: KoreaGradeStatus;
  // Document screening reads the whole file: a real record moves the read
  // (and the scholarship evaluation). Weighed deterministically from the
  // structured activities/honors.
  activities?: Activity[];
  honors?: Honor[];
};

export function analyzeKoreaPrograms(
  programIds: string[],
  inputs: KoreaInputs
): KoreaProgramAnalysis[] {
  if (!programIds.length) return [];
  const achievements = computeAchievementSignal(inputs.activities, inputs.honors);
  return programIds
    .map((id) => findKoreaProgram(id))
    .filter((p): p is KoreaProgram => p != null)
    .map((p) => analyzeOne(p, inputs, achievements));
}

/**
 * How a strong record nudges a Korean document screen. Academics stay dominant:
 * the bonus is capped (in GPA-percent points) so a strong achievement lifts a
 * borderline candidate but never carries a clearly-underqualified one.
 * interviewReady marks a record strong enough that an interview gate is an
 * opportunity, not just a cap.
 */
function achievementEffect(a: AchievementSignal): { bonus: number; interviewReady: boolean } {
  const bonus = a.score >= 8 ? 4 : a.score >= 5 ? 2 : 0;
  return { bonus, interviewReady: a.score >= 7 };
}

// ── Academic index (GPA percent, 0–100) ───────────────────────────────────────

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/**
 * IB total → percent of max. The Korean index is literally "GPA as a percent of
 * the maximum", so the honest mapping is ib/45 — NOT the US empirical rescale
 * ((ib-24)/21), which would read an excellent IB 42 as a mediocre 86%.
 */
function percentFromIb(ib: number): number {
  return Math.round(clamp((ib / 45) * 100, 0, 100));
}

/** SAT → percent; the inverse of the UAE module's GPA→SAT alignment (900 ≈ 60%, 1550 ≈ 100%). */
function percentFromSat(sat: number): number {
  return Math.round(clamp(60 + (sat - 900) * ((100 - 60) / (1550 - 900)), 0, 100));
}

export type KoreaIndexSource = "gpa" | "ib" | "sat" | "estimate";

function computeIndex(inputs: KoreaInputs): { index: number; source: KoreaIndexSource } {
  if (inputs.gpaPercent != null)
    return { index: Math.round(clamp(inputs.gpaPercent, 0, 100)), source: "gpa" };
  if (inputs.ibTotal != null) return { index: percentFromIb(inputs.ibTotal), source: "ib" };
  if (inputs.sat != null) return { index: percentFromSat(inputs.sat), source: "sat" };
  return { index: 82, source: "estimate" }; // neutral midpoint → keep the read rough
}

// ── Language ──────────────────────────────────────────────────────────────────

function ieltsEquivalent(inputs: KoreaInputs): number | null {
  if (inputs.ielts != null) return inputs.ielts;
  if (inputs.toefl != null) {
    if (inputs.toefl >= 100) return 7;
    if (inputs.toefl >= 79) return 6.5;
    if (inputs.toefl >= 61) return 6;
    return 5.5;
  }
  return null;
}

/**
 * "meets" when ANY accepted route is satisfied (TOPIK for Korean-taught,
 * IELTS/TOEFL where the English route exists); "below" when the student showed
 * a credential but none clears the bar; "unknown" when nothing relevant was
 * provided. Language is an eligibility document in Korea, so anything short of
 * "meets" caps the band at "target" in analyzeOne.
 */
function languageStatus(p: KoreaProgram, inputs: KoreaInputs): "meets" | "below" | "unknown" {
  const eq = ieltsEquivalent(inputs);
  const hasTopik = inputs.topik != null && inputs.topik > 0;

  if (p.topik_required != null && hasTopik && (inputs.topik as number) >= p.topik_required)
    return "meets";
  if (p.english_ielts != null && eq != null && eq >= p.english_ielts) return "meets";

  const showedSomething =
    (p.topik_required != null && hasTopik) || (p.english_ielts != null && eq != null);
  return showedSomething ? "below" : "unknown";
}

// ── Band ──────────────────────────────────────────────────────────────────────

/** Pure academic band, before the language/interview gates. */
function bandFor(p: KoreaProgram, index: number): "likely" | "target" | "reach" {
  if (index >= p.typical_gpa_percent) return "likely";
  if (index >= p.min_gpa_percent) return "target";
  return "reach";
}

function computeScholarship(
  p: KoreaProgram,
  index: number,
  status: "likely" | "target" | "reach",
  source: KoreaIndexSource,
  inputs: KoreaInputs
): "likely_full" | "likely_partial" | "unlikely" | "unknown" {
  // KAIST: every admitted international undergraduate receives full tuition +
  // stipend — so any admissible candidate is in full-support territory.
  if (p.auto_full_scholarship) return status === "reach" ? "likely_partial" : "likely_full";
  if (source === "estimate") return "unknown";

  // Language-linked waivers (SKKU-style ladders, TOPIK evaluation points
  // elsewhere): a high TOPIK or IELTS floors the read at partial support.
  const eq = ieltsEquivalent(inputs);
  const languageMerit =
    (inputs.topik != null && inputs.topik >= 5) || (eq != null && eq >= 7.5);

  if (index >= p.scholarship_gpa_cutoff + 4) return "likely_full";
  if (index >= p.scholarship_gpa_cutoff || languageMerit) return "likely_partial";
  return "unlikely";
}

// ── One program ───────────────────────────────────────────────────────────────

function analyzeOne(p: KoreaProgram, inputs: KoreaInputs, ach: AchievementSignal): KoreaProgramAnalysis {
  const { index, source } = computeIndex(inputs);
  const { bonus, interviewReady } = achievementEffect(ach);
  // Achievements give a capped lift to the index used for banding/scholarship,
  // while user_index keeps reporting the honest academic index.
  const effectiveIndex = clamp(index + bonus, 0, 100);

  const language = languageStatus(p, inputs);

  const rawStatus = bandFor(p, index); // grades alone
  let status = bandFor(p, effectiveIndex); // grades + record
  // The language credential is an eligibility document — a candidate who hasn't
  // shown the required TOPIK/English level is never "likely".
  if (language !== "meets" && status === "likely") status = "target";
  // The interview is a real gate — strong grades alone never make it "likely",
  // UNLESS the student's record is strong enough to carry the interview.
  if (p.interview_required && status === "likely" && !interviewReady) status = "target";

  const scholarship = computeScholarship(p, effectiveIndex, status, source, inputs);
  const conditional_offer = inputs.gradeStatus === "predicted";

  return {
    program_id: p.id,
    university: p.university,
    city: p.city,
    program_name: p.program_name,
    field: p.field,
    status,
    grade_status: inputs.gradeStatus,
    user_index: index,
    index_source: source,
    min_gpa_percent: p.min_gpa_percent,
    typical_gpa_percent: p.typical_gpa_percent,
    language_track: p.language_track,
    topik_required: p.topik_required,
    language,
    interview_required: p.interview_required,
    auto_full_scholarship: p.auto_full_scholarship,
    scholarship,
    conditional_offer,
    annual_fee_usd: p.annual_fee_usd,
    reasoning: buildReasoning(p, {
      index,
      source,
      status,
      rawStatus,
      scholarship,
      language,
      conditional_offer,
      ach,
      interviewReady,
      inputs,
    }),
    roadmap: buildRoadmap(p, conditional_offer),
    notes: p.notes,
  };
}

// ── Reasoning ─────────────────────────────────────────────────────────────────

type Computed = {
  index: number;
  source: KoreaIndexSource;
  status: "likely" | "target" | "reach";
  rawStatus: "likely" | "target" | "reach";
  scholarship: "likely_full" | "likely_partial" | "unlikely" | "unknown";
  language: "meets" | "below" | "unknown";
  conditional_offer: boolean;
  ach: AchievementSignal;
  interviewReady: boolean;
  inputs: KoreaInputs;
};

function buildReasoning(p: KoreaProgram, c: Computed): string {
  const sourceNote =
    c.source === "gpa"
      ? `Your school GPA (~${c.index}% of max)`
      : c.source === "ib"
        ? `Your IB total maps to ~${c.index}% on the transcript scale Korean screens read`
        : c.source === "sat"
          ? `Your SAT maps to ~${c.index}% on the transcript scale — a rough stand-in, since Korean screens read the school GPA itself`
          : `Without grades we've assumed a neutral index (~${c.index}%), so this read is deliberately rough`;

  const placement =
    c.index >= p.typical_gpa_percent
      ? `is at or above the typical admitted level (~${p.typical_gpa_percent}%)`
      : c.index >= p.min_gpa_percent
        ? `is between the lower boundary (~${p.min_gpa_percent}%) and the typical admitted level (~${p.typical_gpa_percent}%)`
        : `is below the lower boundary for serious contention (~${p.min_gpa_percent}%)`;

  const bandLine =
    c.status === "likely"
      ? `On the document screen you are a strong, likely candidate for ${p.university} ${p.program_name}.`
      : c.status === "target"
        ? `${p.university} ${p.program_name} is a realistic target — competitive, but in range.`
        : `${p.university} ${p.program_name} is a reach at your current record.`;

  const languageLine = buildLanguageLine(p, c);
  const achLine = achievementLine(p, c);

  const interviewLine = p.interview_required
    ? c.interviewReady && c.status === "likely"
      ? ` This university interviews shortlisted international applicants; your record positions you well, though the interview still finalises the outcome.`
      : ` This university interviews shortlisted international applicants, so the interview — not documents alone — finalises the outcome.`
    : "";

  const offerLine = c.conditional_offer
    ? ` Because your grades are predicted, a strong application would lead to a Conditional Offer — confirmed once you actually achieve those grades and graduate.`
    : "";

  const scholarshipLine =
    c.scholarship === "likely_full"
      ? p.auto_full_scholarship
        ? ` Every admitted KAIST international undergraduate receives full tuition plus a monthly stipend — admission IS the scholarship.`
        : ` At your level you are in full-tuition merit-scholarship territory — Korean admission scholarships are decided from the same document screen, with no separate application.`
      : c.scholarship === "likely_partial"
        ? p.auto_full_scholarship
          ? ` If admitted, KAIST covers full tuition plus a stipend for every international undergraduate.`
          : ` You are within range of a partial admission scholarship, decided automatically from the document screen; a stronger record — or a higher TOPIK/IELTS — raises the award.`
        : c.scholarship === "unlikely"
          ? ` A merit scholarship is unlikely at this level — the larger awards go to the top of the admitted pool.`
          : "";

  return (
    `${bandLine} ${sourceNote} ${placement}.` +
    languageLine +
    achLine +
    interviewLine +
    offerLine +
    scholarshipLine +
    ` Korean international admission is a whole-file document screen, so treat this as a directional read — not a guarantee.`
  );
}

/** How the decisive language gate reads for this student. */
function buildLanguageLine(p: KoreaProgram, c: Computed): string {
  const routes: string[] = [];
  if (p.topik_required != null) routes.push(`TOPIK ${p.topik_required}+`);
  if (p.english_ielts != null) routes.push(`IELTS ${p.english_ielts}+ (or TOEFL equivalent)`);
  const bar = routes.join(" or ");

  if (c.language === "meets") {
    return p.language_track === "KR"
      ? ` You meet the language requirement (${bar}) — note that instruction is largely in Korean, so keep building past the minimum.`
      : ` You meet the language requirement (${bar}).`;
  }
  if (c.language === "below") {
    return ` The language requirement (${bar}) is an eligibility document, and your current credential falls short of it — that is why this read is capped at "target" until the requirement is met.`;
  }
  return ` This program requires ${bar} as an eligibility document; we haven't seen that credential yet, so the read stays capped at "target" until it's confirmed.`;
}

/**
 * One sentence on how the student's record moved the read: it can upgrade a
 * grades-only band, reinforce the document screen, or — when thin — flag the gap.
 */
function achievementLine(p: KoreaProgram, c: Computed): string {
  const what = c.ach.topAwardLevel
    ? `${/^[aeiou]/i.test(c.ach.topAwardLevel) ? "an" : "a"} ${c.ach.topAwardLevel.toLowerCase()}-level award`
    : c.ach.hasSpike
      ? "a sustained, led extracurricular"
      : c.ach.hasLeadership
        ? "a genuine leadership role"
        : "your record";

  if (c.ach.score >= 5) {
    if (c.status !== c.rawStatus && c.status !== "target") {
      return ` Your achievements (${what}) lift this from a grades-only "${c.rawStatus}" to "${c.status}" — Korean document screening reads the whole file, and the personal statement/record is where it's won.`;
    }
    if (p.interview_required && c.interviewReady) {
      return ` Your achievements (${what}) position you well for the interview stage.`;
    }
    return ` Your achievements (${what}) strengthen the document screen beyond grades.`;
  }
  return ` Your extracurricular/awards record is thin; in a document-based screen a clear achievement (a regional/national award or a sustained, led project) and a sharp study plan would strengthen the file.`;
}

// ── Roadmap ───────────────────────────────────────────────────────────────────

function buildRoadmap(p: KoreaProgram, conditional: boolean): string[] {
  const lang =
    p.topik_required != null && p.english_ielts != null
      ? `TOPIK ${p.topik_required}+ or IELTS ${p.english_ielts}+`
      : p.topik_required != null
        ? `TOPIK ${p.topik_required}+`
        : `IELTS ${p.english_ielts}+ (or the TOEFL equivalent)`;

  const steps: string[] = [
    `Apply directly through ${p.university}'s international-admission portal — each Korean university runs its own application, with a March (main) and September intake; documents for the March intake are typically due September–October of the previous year.`,
    `Confirm you qualify for the international ("pure foreigner") track: both you and your parents must hold non-Korean citizenship, and your 12 years of schooling must be outside the Korean system.`,
    `Prepare the document file: apostilled transcript and graduation (or expected-graduation) certificate${conditional ? " with predicted grades" : ""}, passports for you and your parents, a personal statement / study plan, and a teacher recommendation.`,
    `Secure the language credential (${lang}) before the document deadline — it is an eligibility requirement, not a nice-to-have.`,
  ];

  if (p.interview_required) {
    steps.push(
      "Shortlisted applicants are interviewed (in person or online) — prepare to discuss your study plan, motivation and subject fundamentals."
    );
  }

  steps.push(
    p.auto_full_scholarship
      ? "There is no separate scholarship form: every admitted international undergraduate receives full tuition plus a monthly stipend."
      : "Admission scholarships are decided from the same document screen — no separate form; a stronger file and a higher TOPIK/IELTS raise the award. Also consider the (separate, very competitive) Global Korea Scholarship (GKS) run by the Korean government."
  );

  steps.push(
    "After the offer, the university issues a Certificate of Admission — use it to apply for the D-2 student visa at the Korean embassy; start 4–8 weeks before term."
  );

  return steps;
}
