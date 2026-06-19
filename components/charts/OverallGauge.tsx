"use client";

import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { useCountUp } from "@/lib/useCountUp";
import { ACCENT } from "@/lib/tiers";
import { useT } from "@/lib/i18n/client";

// The overall-score gauge — a 270° radial arc (Recharts radial primitive) with
// the number counting up once on load.
export function OverallGauge({ score }: { score: number }) {
  const t = useT();
  const animated = useCountUp(score);
  const data = [{ name: "score", value: score, fill: ACCENT }];

  const band =
    score >= 80
      ? t("band.exceptional")
      : score >= 65
        ? t("band.competitive")
        : score >= 50
          ? t("band.solid")
          : t("band.developing");

  return (
    <div className="relative mx-auto aspect-square w-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="76%"
          outerRadius="100%"
          barSize={14}
          data={data}
          startAngle={225}
          endAngle={-45}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            background={{ fill: "var(--line)" }}
            dataKey="value"
            cornerRadius={8}
            angleAxisId={0}
            isAnimationActive
            animationDuration={900}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span
          data-num
          className="font-display text-5xl font-semibold leading-none text-ink"
        >
          {animated}
        </span>
        <span className="mt-1 text-xs text-ink-faint">{t("report.outOf")}</span>
        <span className="mt-1.5 text-sm font-medium text-accent">{band}</span>
      </div>
    </div>
  );
}
