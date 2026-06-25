// Deterministic, data-driven university recommendations. Given a student
// profile, rank OUR university dataset by how well each school fits THIS student
// — their fields of study, academic strength, and aid needs — and return a
// balanced short-list (reach / target / safety) that ISN'T already on their
// target list.
//
// This replaces asking the AI model to pick recommendations from memory (which
// was unverifiable and varied run to run). Same profile → same recommendations,
// at zero model tokens. The model now always returns recommended_schools: [].

import type { StudentProfileInput } from "@/lib/types";
import type { FacultyValue } from "@/lib/data/faculties";
import {
  UNIVERSITIES,
  FIELD_STRENGTHS,
  findUniversity,
  type University,
} from "@/lib/data/universities";
import {
  academicIndexFromProfile,
  estimateSchoolLikelihood,
  isInternationalApplicant,
} from "@/lib/ai/empirical";
import type { RecommendedSchool, Tier } from "@/lib/ai/schema";

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

// Plain-English faculty labels for the recommendation prose. The `why` text is
// stored as-is (like model output) and intentionally not translated.
const FACULTY_LABEL: Record<FacultyValue, string> = {
  engineering: "Engineering",
  computer_science: "Computer Science",
  business_economics: "Business & Economics",
  natural_sciences: "Natural Sciences",
  humanities_social: "Humanities & Social Sciences",
  medicine_health: "Medicine & Health",
  law: "Law",
  arts_design: "Arts & Design",
};

// Field strength for a school in a field we haven't explicitly rated: more
// selective schools are broadly stronger, so scale gently with selectivity
// (~5 at open-admit, ~7.4 at the most selective).
function baselineFieldStrength(uni: University): number {
  return 5 + (1 - uni.acceptance_rate) * 2.5;
}

function fieldStrength(uni: University, faculty: FacultyValue): number {
  return FIELD_STRENGTHS[uni.id]?.[faculty] ?? baselineFieldStrength(uni);
}

// Best match across the student's chosen faculties, plus which faculty it was.
function bestFieldMatch(
  uni: University,
  faculties: FacultyValue[]
): { score: number; faculty: FacultyValue | null } {
  if (!faculties.length) return { score: baselineFieldStrength(uni), faculty: null };
  let best: { score: number; faculty: FacultyValue | null } = { score: -1, faculty: null };
  for (const f of faculties) {
    const s = fieldStrength(uni, f);
    if (s > best.score) best = { score: s, faculty: f };
  }
  return best;
}

// How friendly the school is to international financial aid, read from the
// curated note. 0 (none) … 1 (need-blind). Only consulted when needs_aid.
function aidFriendliness(uni: University): number {
  const n = uni.notes_international.toLowerCase();
  if (n.includes("need-blind")) return 1;
  if (n.includes("meets full need")) return 0.8;
  if (n.includes("generous")) return 0.75;
  if (n.includes("merit")) return 0.6;
  if (/\b(limited|few|competitive)\b/.test(n)) return 0.3;
  return 0.5;
}

// Academic fit (0–10): how close the student's index sits to the school's
// admitted SAT band. Peaks when the student is at/above the band midpoint.
function academicFit(uni: University, index: number): number {
  if (!uni.sat_p25 || !uni.sat_p75 || uni.sat_p75 <= uni.sat_p25) return 6;
  const toIndex = (sat: number) => clamp(((sat - 400) / (1600 - 400)) * 100, 0, 100);
  const mid = (toIndex(uni.sat_p25) + toIndex(uni.sat_p75)) / 2;
  const spread = Math.max(2, (toIndex(uni.sat_p75) - toIndex(uni.sat_p25)) / 1.35);
  const z = clamp((index - mid) / spread, -2.5, 2.5);
  return clamp(6 + z * 1.6, 0, 10);
}

// Don't recommend a school the student sits far BELOW academically. A reach is
// fine ("worthwhile aim"), but pitching an elite school to someone well under
// its admitted 25th percentile is dishonest — academicFit < this means the
// student is roughly >1.5 bands below p25, so we drop it from recommendations.
const MIN_REC_FIT = 3;

const TIER_RANK: Record<Tier, number> = { reach: 0, target: 1, likely: 2 };

function tierPhrase(tier: Tier): string {
  if (tier === "reach") return "a reach for your profile, but a worthwhile aim";
  if (tier === "likely") return "comfortably within reach — a strong safety";
  return "right in your admitted range";
}

function aidPhrase(uni: University): string {
  const a = aidFriendliness(uni);
  if (a >= 0.8) return " Need-blind or meets-full-need for internationals.";
  if (a >= 0.6) return " Offers merit aid for internationals.";
  if (a <= 0.3) return " Note: aid for internationals is limited.";
  return "";
}

type Scored = {
  uni: University;
  tier: Tier;
  acFit: number;
  fitScore: number;
  match: number;
  why: string;
};

/**
 * Rank the dataset for THIS student and return up to `limit` recommendations the
 * student doesn't already target — balanced across reach / target / safety.
 * Returns [] when the student is not applying to the US (no target_schools),
 * mirroring how the rest of the US pathway is gated.
 */
export function recommendUniversities(
  profile: StudentProfileInput,
  limit = 4
): RecommendedSchool[] {
  if (!(profile.target_schools ?? []).length) return [];

  const index = academicIndexFromProfile(profile);
  const international = isInternationalApplicant(profile);
  const needsAid = !!profile.needs_aid;
  const faculties = (profile.faculties ?? []) as FacultyValue[];

  // Exclude schools already on the student's target list.
  const excluded = new Set<string>();
  for (const name of profile.target_schools ?? []) {
    const u = findUniversity(name);
    if (u) excluded.add(u.id);
  }

  const scored: Scored[] = UNIVERSITIES.filter((u) => !excluded.has(u.id)).map((uni) => {
    const est = estimateSchoolLikelihood(uni, index, { international });
    const field = bestFieldMatch(uni, faculties);
    const acFit = academicFit(uni, index);
    const aid = aidFriendliness(uni);

    // What the user sees: a fit score led by field match, nudged by academic fit.
    const fitScore = Math.round(clamp(field.score * 0.75 + acFit * 0.25, 0, 10));

    // Ranking signal: field match dominates; aid matters only if the student
    // needs it. Keeps strong-in-your-field schools at the top of each tier.
    const match = field.score + (needsAid ? aid * 3 : 0);

    const facLabel = field.faculty ? FACULTY_LABEL[field.faculty] : null;
    const lead =
      facLabel && field.score >= 7
        ? `Strong in ${facLabel} — one of your fields. `
        : facLabel
          ? `Covers ${facLabel}, your field. `
          : "";
    const why = `${lead}It's ${tierPhrase(est.tier)}.${needsAid ? aidPhrase(uni) : ""}`.trim();

    return { uni, tier: est.tier, acFit, fitScore, match, why };
  })
    // Only drop REACH schools the student is academically far below — pitching
    // an elite long-shot as a "worthwhile aim" to someone well under its band is
    // dishonest. Targets/safeties are realistic by tier definition, so keep them.
    .filter((s) => s.tier !== "reach" || s.acFit >= MIN_REC_FIT);

  // Balanced short-list: aim for a spread of reach / target / safety.
  const byTier: Record<Tier, Scored[]> = { reach: [], target: [], likely: [] };
  for (const s of scored) byTier[s.tier].push(s);
  for (const t of Object.keys(byTier) as Tier[]) {
    byTier[t].sort((a, b) => b.match - a.match);
  }

  const quota: Record<Tier, number> = { reach: 1, target: 2, likely: 1 };
  const picked: Scored[] = [];
  for (const t of ["reach", "target", "likely"] as Tier[]) {
    picked.push(...byTier[t].slice(0, quota[t]));
  }

  // Backfill toward `limit` from the best remaining, regardless of tier.
  if (picked.length < limit) {
    const chosen = new Set(picked.map((s) => s.uni.id));
    const rest = scored
      .filter((s) => !chosen.has(s.uni.id))
      .sort((a, b) => b.match - a.match);
    picked.push(...rest.slice(0, limit - picked.length));
  }

  return picked
    .slice(0, limit)
    .sort((a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier] || b.match - a.match)
    .map((s) => ({
      name: s.uni.name,
      tier: s.tier,
      fit_score: s.fitScore,
      why: s.why,
    }));
}
