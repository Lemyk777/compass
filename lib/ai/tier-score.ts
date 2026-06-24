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

import type { Activity, Honor } from "@/lib/types";

export type Factor = "leadership" | "extracurricular_depth" | "awards" | "narrative_fit";
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
const WORK_RE = /\b(work|job|family|store|business|employ|intern)\b/i;
const hrsYr = (a: Activity) => (a.hours_per_week ?? 0) * (a.weeks_per_year ?? 0);
const years = (a: Activity) => a.grades?.length ?? 0;

// ── Leadership ────────────────────────────────────────────────────────────────
function scoreLeadership(acts: Activity[]): ArguedScore {
  let best: { a: Activity; hrs: number; yrs: number; led: boolean; work: boolean } | null = null;
  for (const a of acts) {
    const led = LEADER_RE.test(a.position ?? "") || LEADER_RE.test(a.description ?? "");
    const work = (a.hours_per_week ?? 0) >= 15 && (WORK_RE.test(a.type ?? "") || WORK_RE.test(a.position ?? "") || WORK_RE.test(a.description ?? ""));
    if ((led || work) && (!best || hrsYr(a) > best.hrs)) best = { a, hrs: hrsYr(a), yrs: years(a), led, work };
  }
  if (!best) {
    return { factor: "leadership", tier: 4, tierName: "Tier 4 — participation only", score: SOFT_SCORE[4],
      rule: "Tier 4: no leadership/ownership role; all activities are general membership.",
      evidence: acts.length ? acts.map((a) => `'${a.position}' @ ${a.organization} (${a.hours_per_week ?? 0}h/wk)`) : ["no activities listed"] };
  }
  const ev = [
    `role '${best.a.position}' at ${best.a.organization}`,
    `${best.a.hours_per_week ?? 0}h/wk × ${best.a.weeks_per_year ?? 0}wk = ${best.hrs} hrs/yr`,
    `sustained ${best.yrs} year(s) (grades ${(best.a.grades ?? []).join(",") || "—"})`,
  ];
  if ((best.led && best.hrs >= 500 && best.yrs >= 3) || (best.work && best.yrs >= 3)) {
    return { factor: "leadership", tier: 1, tierName: "Tier 1 — exceptional ownership", score: SOFT_SCORE[1],
      rule: "Tier 1: a led role with ≥500 hrs/yr sustained ≥3 yrs, OR 15+ h/wk real work/family responsibility sustained ≥3 yrs.", evidence: ev };
  }
  if ((best.led && best.yrs >= 2 && best.hrs >= 100) || best.work) {
    return { factor: "leadership", tier: 2, tierName: "Tier 2 — clear leadership", score: SOFT_SCORE[2],
      rule: "Tier 2: a genuine leadership role sustained ≥2 yrs with ≥100 hrs/yr, OR significant (15+ h/wk) work/family responsibility.", evidence: ev };
  }
  if (best.hrs >= 60) {
    return { factor: "leadership", tier: 3, tierName: "Tier 3 — some leadership", score: SOFT_SCORE[3],
      rule: "Tier 3: a leadership role or sustained involvement with ≥60 hrs/yr.", evidence: ev };
  }
  return { factor: "leadership", tier: 4, tierName: "Tier 4 — nominal role", score: SOFT_SCORE[4],
    rule: "Tier 4: a title exists but commitment is < 60 hrs/yr — nominal.", evidence: ev };
}

// ── Extracurricular depth ─────────────────────────────────────────────────────
function scoreEcDepth(acts: Activity[]): ArguedScore {
  let best: Activity | null = null;
  for (const a of acts) if (!best || hrsYr(a) > hrsYr(best)) best = a;
  const totalHrs = acts.reduce((s, a) => s + hrsYr(a), 0);
  if (!best) {
    return { factor: "extracurricular_depth", tier: 4, tierName: "Tier 4 — none", score: SOFT_SCORE[4],
      rule: "Tier 4: no substantive activities.", evidence: ["no activities listed"] };
  }
  const bh = hrsYr(best), by = years(best);
  const led = LEADER_RE.test(best.position ?? "") || LEADER_RE.test(best.description ?? "");
  const ev = [
    `strongest activity '${best.position}' @ ${best.organization}: ${bh} hrs/yr over ${by} yr(s)`,
    `total commitment across activities: ${totalHrs} hrs/yr`,
  ];
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
