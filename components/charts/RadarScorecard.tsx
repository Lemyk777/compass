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
import {
  factorMattersForCountry,
  hkScorecardFactors,
  uaeScorecardFactors,
  krScorecardFactors,
} from "@/lib/data/country-scorecard";
import type { DestinationCode } from "@/lib/data/destinations";

type RadarScorecardProps = {
  factors: Factor[];
  // When set, radar enters Italy mode: only Academics + Tests + Financial Fit shown.
  italyFinancialFitScore?: number;
  // When set (and not Italy mode), plot the country-NATIVE axes. Without it
  // every country drew all 7 axes, so e.g. Hong Kong (no Narrative & Fit)
  // looked identical to the US. HK/AE/KR each plot the factor set their
  // admission system actually reads (see country-scorecard.ts).
  country?: DestinationCode | null;
  // Korea's language-gate score (0–10, from krLanguageGateScore) — null/absent
  // until the student builds a Korea list; the axis is omitted rather than faked.
  krLanguageScore?: number | null;
};

export function RadarScorecard({
  factors,
  italyFinancialFitScore,
  country,
  krLanguageScore,
}: RadarScorecardProps) {
  const isItalyMode = italyFinancialFitScore != null;
  // HK/AE plot a grades-first quadrilateral (spine + one combined Achievements);
  // KR plots the document-screen set (transcript, rigor, language gate, file).
  // Matches the rankings boards and how each system actually reads a profile.
  const isHkMode = country === "HK" && !isItalyMode;
  const isAeMode = country === "AE" && !isItalyMode;
  const isKrMode = country === "KR" && !isItalyMode;

  const shown = isHkMode
    ? hkScorecardFactors(factors)
    : isAeMode
      ? uaeScorecardFactors(factors)
      : isKrMode
        ? krScorecardFactors(factors, krLanguageScore ?? null)
        : country && !isItalyMode
          ? factors.filter((f) => factorMattersForCountry(country, f.key))
          : factors;

  const data = isItalyMode
    ? buildItalyRadarData(factors, italyFinancialFitScore)
    : shown.map((f) => ({ factor: shortLabel(f.label), score: f.score }));

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
