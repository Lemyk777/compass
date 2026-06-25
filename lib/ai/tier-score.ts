// PROTOTYPE — deterministic, tiered scoring for the holistic factors.
//
// Demonstrates the CollegeVine-style approach we agreed on: a student is placed
// into a discrete TIER by an explicit, published rule, and the score is derived
// from the tier by a fixed table — never an arbitrary number. Every point is
// fully arguable: each factor returns the RULE that fired and the EVIDENCE (the
// student's own hours/roles/awards) that triggered it.
//
// Where a factor is genuinely subjective (narrative authenticity), the tier here
// is a structured PROXY; in production the AI refines just that classification —
// it still never emits the number. The number always comes from tier → table.

import { gpaToPercent, type Activity, type Honor, type Grades, type Tests } from "@/lib/types";

export type Factor =
  | "academics"
  | "test_scores"
  | "course_rigor"
  | "leadership"
  | "extracurricular_depth"
  | "awards"
  | "narrative_fit";
export type Tier = 1 | 2 | 3 | 4;

export type ArguedScore = {
  factor: Factor;
  tier: Tier;
  tierName: string;
  score: number;
  rule: string; // the published rule that fired
  evidence: string[]; // the student's own data that triggered it
  proxy?: boolean; // true where the AI would refine the classification
};

// Tier → score (fixed midpoints). Same tier ⇒ same number, always.
const SOFT_SCORE: Record<Tier, number> = { 1: 9, 2: 7, 3: 5, 4: 2.5 };
const AWARD_SCORE: Record<Tier, number> = { 1: 9.5, 2: 8, 3: 6, 4: 3.5 };

const LEADER_RE = /\b(found|founder|president|captain|chair|lead|director|head|editor[- ]in[- ]chief|ceo)\b/i;
// Top, ownership-level titles that carry weight on their own — credited even
// when the student leaves the hours fields blank (intake doesn't force them).
const SENIOR_RE = /\b(found|founder|president|captain|chair|director|editor[- ]in[- ]chief|ceo)\b/i;
const WORK_RE = /\b(work|job|family|store|business|employ|intern)\b/i;

// Effective weeks/year: if the student gave weekly hours but left weeks blank,
// assume a school year (~30 wk) instead of silently zeroing the whole activity
// (the old `?? 0` floored any half-filled row to 0 hrs/yr).
const DEFAULT_WEEKS = 30;
const effWeeks = (a: Activity) =>
  a.weeks_per_year ?? ((a.hours_per_week ?? 0) > 0 ? DEFAULT_WEEKS : 0);
const hrsYr = (a: Activity) => (a.hours_per_week ?? 0) * effWeeks(a);
// Did the student actually report a weekly time commitment? Missing hours must
// NOT be read as "zero commitment" — it just means we score on role + years.
const hoursKnown = (a: Activity) => (a.hours_per_week ?? 0) > 0;
const isSenior = (a: Activity) =>
  SENIOR_RE.test(a.position ?? "") || SENIOR_RE.test(a.description ?? "");
const years = (a: Activity) => a.grades?.length ?? 0;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
// Factor scores live on the integer 0–10 rubric scale, so keep them whole — a
// 1-decimal blend like 8.4 read as out of place next to the other (integer)
// factors on the scorecard.
const roundScore = (n: number) => Math.round(n);
// Display tier from a 0–10 score, so an arguable rule still maps to a tier band.
const tierFromScore = (s: number): Tier => (s >= 8.5 ? 1 : s >= 7 ? 2 : s >= 5 ? 3 : 4);

// ── Leadership ────────────────────────────────────────────────────────────────
// Tier one leadership/work candidate. Returns null when the activity carries no
// leadership or work signal at all. Crucially, a MISSING hours field no longer
// collapses a real role to the floor: when hours are blank we score on role
// seniority + sustained years (capped at Tier 2 — Tier 1 needs evidence of scale).
function leadershipTierFor(a: Activity): ArguedScore | null {
  const led = LEADER_RE.test(a.position ?? "") || LEADER_RE.test(a.description ?? "");
  const work = (a.hours_per_week ?? 0) >= 15 && (WORK_RE.test(a.type ?? "") || WORK_RE.test(a.position ?? "") || WORK_RE.test(a.description ?? ""));
  if (!led && !work) return null;

  const hrs = hrsYr(a), yrs = years(a), known = hoursKnown(a), senior = isSenior(a);
  const ev = [
    `role '${a.position}' at ${a.organization}`,
    known
      ? `${a.hours_per_week ?? 0}h/wk × ${a.weeks_per_year ?? effWeeks(a)}wk = ${hrs} hrs/yr`
      : `hours not provided — scored on role seniority + sustained years`,
    `sustained ${yrs} year(s) (grades ${(a.grades ?? []).join(",") || "—"})`,
  ];
  const out = (tier: Tier, tierName: string, rule: string): ArguedScore => ({
    factor: "leadership", tier, tierName, score: SOFT_SCORE[tier], rule, evidence: ev,
  });

  // Hours blank → fall back to role seniority so a genuine leadership role isn't
  // floored just because the optional hours fields were left empty.
  if (!known) {
    if (senior)
      return out(2, "Tier 2 — clear leadership (hours not given)",
        "Tier 2: an ownership-level title (founder/president/captain/chair/director/editor-in-chief) — credited without hours; Tier 1 requires evidence of scale (hours or impact).");
    return out(3, "Tier 3 — some leadership (hours not given)",
      "Tier 3: a leadership role is present but hours weren't provided and the title isn't ownership-level.");
  }

  // Hours known → commitment-based tiers (unchanged thresholds).
  if ((led && hrs >= 500 && yrs >= 3) || (work && yrs >= 3))
    return out(1, "Tier 1 — exceptional ownership",
      "Tier 1: a led role with ≥500 hrs/yr sustained ≥3 yrs, OR 15+ h/wk real work/family responsibility sustained ≥3 yrs.");
  if ((led && yrs >= 2 && hrs >= 100) || work)
    return out(2, "Tier 2 — clear leadership",
      "Tier 2: a genuine leadership role sustained ≥2 yrs with ≥100 hrs/yr, OR significant (15+ h/wk) work/family responsibility.");
  if (hrs >= 60)
    return out(3, "Tier 3 — some leadership",
      "Tier 3: a leadership role or sustained involvement with ≥60 hrs/yr.");
  return out(4, "Tier 4 — nominal role",
    "Tier 4: a title exists but commitment is < 60 hrs/yr — nominal.");
}

function scoreLeadership(acts: Activity[]): ArguedScore {
  // Evaluate every leadership/work role and keep the best-scoring one, so a
  // strong title with blank hours isn't lost behind a minor role that happens
  // to have hours filled in.
  let best: ArguedScore | null = null;
  for (const a of acts) {
    const r = leadershipTierFor(a);
    if (r && (!best || r.score > best.score)) best = r;
  }
  if (best) return best;
  return { factor: "leadership", tier: 4, tierName: "Tier 4 — participation only", score: SOFT_SCORE[4],
    rule: "Tier 4: no leadership/ownership role; all activities are general membership.",
    evidence: acts.length ? acts.map((a) => `'${a.position}' @ ${a.organization} (${a.hours_per_week ?? 0}h/wk)`) : ["no activities listed"] };
}

// ── Extracurricular depth ─────────────────────────────────────────────────────
function scoreEcDepth(acts: Activity[]): ArguedScore {
  // Pick the "spine" activity by hours, but fall back to sustained years so that
  // when no hours are filled in we still surface the longest-running activity
  // rather than an arbitrary first row.
  const rank = (a: Activity) => hrsYr(a) * 1000 + years(a);
  let best: Activity | null = null;
  for (const a of acts) if (!best || rank(a) > rank(best)) best = a;
  const totalHrs = acts.reduce((s, a) => s + hrsYr(a), 0);
  const anyHoursKnown = acts.some(hoursKnown);
  if (!best) {
    return { factor: "extracurricular_depth", tier: 4, tierName: "Tier 4 — none", score: SOFT_SCORE[4],
      rule: "Tier 4: no substantive activities.", evidence: ["no activities listed"] };
  }
  const bh = hrsYr(best), by = years(best);
  const led = LEADER_RE.test(best.position ?? "") || LEADER_RE.test(best.description ?? "");
  const ev = [
    anyHoursKnown
      ? `strongest activity '${best.position}' @ ${best.organization}: ${bh} hrs/yr over ${by} yr(s)`
      : `strongest activity '${best.position}' @ ${best.organization}: ${by} yr(s), hours not provided`,
    anyHoursKnown
      ? `total commitment across activities: ${totalHrs} hrs/yr`
      : `${acts.length} activit(ies) listed; depth judged on sustained years`,
  ];

  // No hours anywhere → judge depth by sustained years / breadth instead of
  // flooring everyone who skipped the optional hours fields. Capped at Tier 2:
  // Tier 1 ("genuine spike") needs the ≥300 hrs/yr evidence.
  if (!anyHoursKnown) {
    if (by >= 3 && (led || best.continue_in_college)) {
      return { factor: "extracurricular_depth", tier: 2, tierName: "Tier 2 — sustained focus (hours not given)", score: SOFT_SCORE[2],
        rule: "Tier 2: a clear, sustained (≥3 yr) focus that is led or continues into college — credited without hours; Tier 1 requires ≥300 hrs/yr evidence.", evidence: ev };
    }
    if (by >= 2 || acts.length >= 3) {
      return { factor: "extracurricular_depth", tier: 3, tierName: "Tier 3 — moderate (hours not given)", score: SOFT_SCORE[3],
        rule: "Tier 3: real involvement (a multi-year activity or several activities) but hours weren't provided.", evidence: ev };
    }
    return { factor: "extracurricular_depth", tier: 4, tierName: "Tier 4 — shallow / scattered", score: SOFT_SCORE[4],
      rule: "Tier 4: only a single, short activity and no hours given.", evidence: ev };
  }

  if (by >= 3 && bh >= 300 && (led || best.continue_in_college)) {
    return { factor: "extracurricular_depth", tier: 1, tierName: "Tier 1 — genuine spike", score: SOFT_SCORE[1],
      rule: "Tier 1: a sustained (≥3 yr) high-commitment (≥300 hrs/yr) activity that is led or carries tangible output.", evidence: ev };
  }
  if (by >= 2 && bh >= 150) {
    return { factor: "extracurricular_depth", tier: 2, tierName: "Tier 2 — sustained focus", score: SOFT_SCORE[2],
      rule: "Tier 2: a clear, sustained (≥2 yr) focus with ≥150 hrs/yr.", evidence: ev };
  }
  if (totalHrs >= 120) {
    return { factor: "extracurricular_depth", tier: 3, tierName: "Tier 3 — moderate", score: SOFT_SCORE[3],
      rule: "Tier 3: real but not spiked involvement — ≥120 hrs/yr total.", evidence: ev };
  }
  return { factor: "extracurricular_depth", tier: 4, tierName: "Tier 4 — shallow / scattered", score: SOFT_SCORE[4],
    rule: "Tier 4: low total commitment (< 120 hrs/yr) across activities.", evidence: ev };
}

// ── Awards ────────────────────────────────────────────────────────────────────
const AWARD_TIER: Record<string, Tier> = { international: 1, national: 2, "state/regional": 3, state: 3, regional: 3, school: 4, local: 4 };
function scoreAwards(honors: Honor[]): ArguedScore {
  let top: Tier | null = null;
  let topLevel = "none";
  let topTitle = "";
  for (const h of honors) for (const lv of h.levels ?? []) {
    const t = AWARD_TIER[lv.toLowerCase()];
    if (t && (top === null || t < top)) { top = t; topLevel = lv; topTitle = h.title; }
  }
  if (top === null) {
    return { factor: "awards", tier: 4, tierName: "Tier 4 — none", score: 1,
      rule: "No awards listed at any level (school < state/regional < national < international).", evidence: honors.length ? ["awards listed without a recognized level"] : ["no honors listed"] };
  }
  return { factor: "awards", tier: top, tierName: `Tier ${top} — ${topLevel}-level`, score: AWARD_SCORE[top],
    rule: "Scored by the HIGHEST level of recognition, not the count (Intl=T1, National=T2, State/Regional=T3, School=T4).",
    evidence: [`top award: '${topTitle}' (${topLevel})`] };
}

// ── Academic factors (deterministic) ──────────────────────────────────────────
// These mirror lib/rubric.ts and reuse the SAME academic-index formulas that
// drive the empirical admit model (lib/ai/empirical.ts), so a student's
// academics factor and their admit chances are derived from one consistent
// number instead of a separate AI guess. 0–100 sub-scores → 0–10 factor scores.

/** Grade standing (0–100) across curricula, identical to academicIndexFromProfile. */
function gradesScore100(g: Partial<Grades>): number | null {
  if (g.ib_total != null) return clamp(((g.ib_total - 24) / (45 - 24)) * 100, 0, 100);
  if (g.gpa != null) return gpaToPercent(g.gpa, g.gpa_scale);
  if (g.national_percent != null) return clamp(g.national_percent, 0, 100);
  return null;
}
/** Standardized-test strength (0–100) from SAT/ACT. */
function testScore100(t: Tests): number | null {
  if (t.SAT) return clamp(((t.SAT - 400) / (1600 - 400)) * 100, 0, 100);
  if (t.ACT) return clamp(((t.ACT - 1) / (36 - 1)) * 100, 0, 100);
  return null;
}
/** Curriculum demand → 0–10 (most demanding curricula carry full weight). */
function rigorScore10(curriculum?: string): number {
  return curriculum === "IB" ? 9
    : curriculum === "A-Level" ? 8
    : curriculum === "US-GPA" || curriculum === "national" ? 6
    : 4;
}

function scoreAcademics(g: Partial<Grades>, curriculum?: string): ArguedScore {
  const gs = gradesScore100(g);
  const gradesSub = gs == null ? 5 : clamp(gs / 10, 0, 10); // neutral 5 when no grades
  const rs = rigorScore10(curriculum);
  const score = roundScore(clamp(gradesSub * 0.7 + rs * 0.3, 0, 10)); // grades 70% + rigor 30%
  const label = g.ib_total != null ? `IB ${g.ib_total}/45`
    : g.gpa != null ? `GPA ${g.gpa}`
    : g.national_percent != null ? `${g.national_percent}th percentile`
    : "no grades provided";
  return {
    factor: "academics", tier: tierFromScore(score), score,
    tierName: `Academics ${score}/10 (grade index ${gs == null ? "—" : Math.round(gs)}/100)`,
    rule: "Deterministic: grade standing (0–100 academic index) weighted 70% + curriculum demand 30%, on the published rubric scale.",
    evidence: [`grades: ${label} → ${gs == null ? "neutral 5.0" : gradesSub.toFixed(1)}/10`, `curriculum '${curriculum || "unknown"}' → rigor ${rs}/10`],
  };
}

function scoreTestScores(t: Tests): ArguedScore {
  const ts = testScore100(t);
  const stdSub = ts == null ? null : clamp(ts / 10, 0, 10);
  const englishSub = t.IELTS != null ? clamp(((t.IELTS - 5) / (9 - 5)) * 10, 0, 10)
    : t.TOEFL != null ? clamp(((t.TOEFL - 60) / (120 - 60)) * 10, 0, 10)
    : null;
  const englishLabel = t.IELTS != null ? `IELTS ${t.IELTS}` : t.TOEFL != null ? `TOEFL ${t.TOEFL}` : "not given";
  let score: number, rule: string, evidence: string[];
  if (stdSub != null) {
    const es = englishSub ?? 5; // neutral when no English score
    score = roundScore(clamp(stdSub * 0.75 + es * 0.25, 0, 10));
    rule = "Deterministic: standardized band (SAT/ACT → 0–100) weighted 75% + English proficiency 25%.";
    evidence = [`standardized ${t.SAT ? `SAT ${t.SAT}` : `ACT ${t.ACT}`} → ${stdSub.toFixed(1)}/10`, `English ${englishLabel}${englishSub == null ? " (neutral 5.0)" : ` → ${englishSub.toFixed(1)}/10`}`];
  } else if (englishSub != null) {
    // Test-optional: only English to go on — credited but capped (no aptitude signal).
    score = roundScore(clamp(Math.min(englishSub, 6) * 0.7 + 1, 0, 6));
    rule = "Deterministic: no SAT/ACT (test-optional) — scored on English proficiency only, capped at 6 (no aptitude signal to credit).";
    evidence = [`no SAT/ACT submitted`, `English ${englishLabel} → ${englishSub.toFixed(1)}/10`];
  } else {
    score = 2;
    rule = "Deterministic: no standardized scores submitted — minimal credit (rubric's test-optional-without-indicators band).";
    evidence = ["no SAT/ACT and no English test on file"];
  }
  return { factor: "test_scores", tier: tierFromScore(score), tierName: `Test scores ${score}/10`, score, rule, evidence };
}

function scoreCourseRigor(curriculum?: string): ArguedScore {
  const score = roundScore(rigorScore10(curriculum));
  const label = score >= 9 ? "most demanding (full IB)"
    : score >= 8 ? "very demanding (A-Level)"
    : score >= 6 ? "moderate (national / US-GPA)"
    : "standard / unknown";
  return {
    factor: "course_rigor", tier: tierFromScore(score), score,
    tierName: `Course rigor ${score}/10 — ${label}`,
    rule: "Deterministic: curriculum demand on the published rubric (IB 9 / A-Level 8 / national·US-GPA 6 / other 4).",
    evidence: [`curriculum: '${curriculum || "unknown"}'`],
  };
}

/** The three academic factors, scored deterministically from grades/tests/curriculum. */
export function scoreAcademicFactors(p: {
  grades?: Partial<Grades>;
  tests?: Tests;
  curriculum?: string;
}): ArguedScore[] {
  return [
    scoreAcademics(p.grades ?? {}, p.curriculum),
    scoreTestScores(p.tests ?? {}),
    scoreCourseRigor(p.curriculum),
  ];
}

// ── Narrative fit (proxy — AI refines this one classification) ─────────────────
function scoreNarrative(acts: Activity[], major: string, faculties: string[]): ArguedScore {
  const field = `${major} ${faculties.join(" ")}`.toLowerCase().replace(/_/g, " ");
  const words = Array.from(new Set(field.split(/\s+/).filter((w) => w.length > 3)));
  const blob = acts.map((a) => `${a.position} ${a.organization} ${a.description}`).join(" ").toLowerCase();
  const overlap = words.filter((w) => blob.includes(w));
  const spike = acts.some((a) => years(a) >= 3 && hrsYr(a) >= 200);
  const ev = [`field words: [${words.join(", ") || "—"}]`, `activities mention: [${overlap.join(", ") || "none"}]`, `spike present: ${spike}`];
  let tier: Tier;
  if (overlap.length >= 2 && spike) tier = 1;
  else if (overlap.length >= 1) tier = 2;
  else if (overlap.length >= 1 || acts.length >= 2) tier = 3;
  else tier = 4;
  const names: Record<Tier, string> = { 1: "Tier 1 — coherent spike", 2: "Tier 2 — clear direction", 3: "Tier 3 — generic", 4: "Tier 4 — disjointed" };
  return { factor: "narrative_fit", tier, tierName: names[tier], score: SOFT_SCORE[tier], proxy: true,
    rule: "Proxy: alignment between intended field and what the activities actually show (overlap + presence of a spike). AI refines authenticity/coherence — but never sets the number.",
    evidence: ev };
}

export type Scorecard = {
  factors: ArguedScore[];
  holistic: number; // average of the four holistic factors (0–10)
};

export function scoreHolistic(p: {
  activities: Activity[];
  honors: Honor[];
  intended_major: string;
  faculties: string[];
}): Scorecard {
  const factors = [
    scoreLeadership(p.activities),
    scoreEcDepth(p.activities),
    scoreAwards(p.honors),
    scoreNarrative(p.activities, p.intended_major, p.faculties),
  ];
  const holistic = Math.round((factors.reduce((s, f) => s + f.score, 0) / factors.length) * 10) / 10;
  return { factors, holistic };
}
