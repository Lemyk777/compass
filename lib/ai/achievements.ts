// Deterministic "achievements" signal from a student's Common App activities and
// honors. No AI: it scores the strongest verifiable evidence of distinction so
// country engines (e.g. Hong Kong) can weigh a real record alongside grades —
// exactly the structured part of leadership/awards a human reader infers from
// roles, commitment and award level. Mirrors the data-pipeline deepRubric tiers.

import type { Activity, Honor } from "@/lib/types";

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const round1 = (n: number) => Math.round(n * 10) / 10;

// A genuine leadership/ownership role in the position or its description.
const LEADER_RE =
  /\b(found|founder|president|captain|chair|lead|director|head|editor[- ]in[- ]chief|ceo)\b/i;

// Common App honor levels → distinction rank (highest level wins, not volume).
const AWARD_RANK: Record<string, number> = {
  international: 10,
  national: 8,
  "state/regional": 6,
  state: 6,
  regional: 6,
  school: 4,
  local: 4,
};

export type AchievementSignal = {
  /** 0–10: strongest deterministic evidence of distinction (award OR EC spike). */
  score: number;
  /** Highest award level present (as written), or null. */
  topAwardLevel: string | null;
  /** A sustained, led, high-commitment activity is present. */
  hasSpike: boolean;
  /** Any genuine leadership/ownership role is present. */
  hasLeadership: boolean;
};

/**
 * The student's achievement signal: the better of (a) their top award level and
 * (b) their strongest single extracurricular (commitment + sustain + leadership).
 * Volume is intentionally ignored — one real distinction outweighs a long list.
 */
export function computeAchievementSignal(
  activities: Activity[] = [],
  honors: Honor[] = []
): AchievementSignal {
  // Awards — the single highest level of recognition.
  let topAward = 0;
  let topAwardLevel: string | null = null;
  for (const h of honors) {
    for (const lv of h.levels ?? []) {
      const r = AWARD_RANK[lv.toLowerCase()] ?? 3;
      if (r > topAward) {
        topAward = r;
        topAwardLevel = lv;
      }
    }
  }

  // Extracurriculars — the strongest single activity.
  let bestEc = 0;
  let hasSpike = false;
  let hasLeadership = false;
  for (const a of activities) {
    const hrs = (a.hours_per_week ?? 0) * (a.weeks_per_year ?? 0);
    const led = LEADER_RE.test(a.position ?? "") || LEADER_RE.test(a.description ?? "");
    const sustained = (a.grades?.length ?? 0) >= 3; // spans 3+ grade levels
    if (led) hasLeadership = true;
    let s = clamp(hrs / 200, 0, 4); // up to 4 pts for ~200+ hrs/yr
    if (sustained) s += 2;
    if (led) s += 2;
    s = clamp(s, 0, 8);
    if (s >= 6) hasSpike = true;
    bestEc = Math.max(bestEc, s);
  }

  return {
    score: round1(clamp(Math.max(topAward, bestEc), 0, 10)),
    topAwardLevel,
    hasSpike,
    hasLeadership,
  };
}
