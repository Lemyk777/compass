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

// Radar chart of the seven factor scores — the user's own scores in the accent.
export function RadarScorecard({ factors }: { factors: Factor[] }) {
  const data = factors.map((f) => ({
    factor: shortLabel(f.label),
    score: f.score,
  }));

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

function shortLabel(label: string): string {
  return label
    .replace("Extracurricular depth", "Activities")
    .replace("Awards & recognition", "Awards")
    .replace("Narrative / fit", "Narrative")
    .replace("Test scores", "Tests")
    .replace("Course rigor", "Rigor");
}
