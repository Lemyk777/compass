// Leaderboard types + pure ranking helpers. Client-safe (no server imports) —
// the actual data fetch (service-role) lives in the rankings page server
// component. `overall` is the analysis overall_score (0–100); the four
// dimensions are our rubric factor scores on the same 0–10 scale as the
// Your-standing scorecard.

export type LeaderboardRow = {
  userId: string;
  name: string;
  major: string;
  overall: number;
  academics: number;
  activities: number;
  awards: number;
  leadership: number;
};

export const LEADERBOARD_DIMS = [
  { key: "academics", label: "Academics", color: "var(--accent)" },
  { key: "activities", label: "Activities", color: "var(--likely)" },
  { key: "awards", label: "Awards", color: "var(--target)" },
  { key: "leadership", label: "Leadership", color: "#7c3aed" },
] as const;

export type Standing = {
  rank: number;
  total: number;
  topPct: number;
  current: LeaderboardRow;
  focus: { label: string; score: number; topAvg: number; topK: number } | null;
};

/** Where the current user sits, plus the weakest dimension vs. the top cohort. */
export function computeStanding(
  rows: LeaderboardRow[],
  currentUserId: string | null
): Standing | null {
  const idx = rows.findIndex((r) => r.userId === currentUserId);
  if (idx < 0) return null;
  const current = rows[idx];
  const total = rows.length;
  const rank = idx + 1;
  const topPct = Math.min(100, Math.max(1, Math.round((rank / total) * 100)));

  // Weakest of the four scored dimensions.
  let focus: Standing["focus"] = null;
  const dims = LEADERBOARD_DIMS.map((d) => ({
    label: d.label,
    key: d.key,
    score: current[d.key],
  }));
  const weakest = dims.reduce((lo, d) => (d.score < lo.score ? d : lo), dims[0]);
  const topK = Math.max(1, Math.ceil(total * 0.1));
  const top = rows.slice(0, topK);
  const topAvg = Math.round(
    top.reduce((s, r) => s + r[weakest.key], 0) / top.length
  );
  focus = { label: weakest.label, score: weakest.score, topAvg, topK };

  return { rank, total, topPct, current, focus };
}
