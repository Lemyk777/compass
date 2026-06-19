"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import type { Factor } from "@/lib/ai/schema";
import { ACCENT } from "@/lib/tiers";

type RadarScorecardProps = {
  factors: Factor[];
  // When set, radar enters Italy mode: only Academics + Tests + Financial Fit shown.
  italyFinancialFitScore?: number;
};

export function RadarScorecard({
  factors,
  italyFinancialFitScore,
}: RadarScorecardProps) {
  const isItalyMode = italyFinancialFitScore != null;

  const data = isItalyMode
    ? buildItalyRadarData(factors, italyFinancialFitScore)
    : factors.map((f) => ({ factor: shortLabel(f.label), score: f.score }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="var(--line)" />
        <PolarAngleAxis
          dataKey="factor"
          tick={{ fill: "var(--ink-soft)", fontSize: 11 }}
        />
        <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
        <Radar
          dataKey="score"
          stroke={ACCENT}
          fill={ACCENT}
          fillOpacity={0.22}
          strokeWidth={2}
          isAnimationActive={false}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

function buildItalyRadarData(
  factors: Factor[],
  financialFitScore: number
): { factor: string; score: number }[] {
  const byKey = new Map(factors.map((f) => [f.key, f.score]));
  return [
    { factor: "Academics", score: byKey.get("academics") ?? 0 },
    { factor: "Test Scores", score: byKey.get("test_scores") ?? 0 },
    { factor: "Financial Fit", score: financialFitScore },
  ];
}

function shortLabel(label: string): string {
  return label
    .replace("Extracurricular depth", "Activities")
    .replace("Awards & recognition", "Awards")
    .replace("Narrative / fit", "Narrative")
    .replace("Test scores", "Tests")
    .replace("Course rigor", "Rigor");
}
