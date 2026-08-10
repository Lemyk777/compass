"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { SchoolLikelihood } from "@/lib/ai/schema";
import { ChartFigure } from "@/components/charts/ChartFigure";
import { TIER_HEX } from "@/lib/tiers";

// Sorted comparison of target schools by mid-point admission likelihood,
// coloured by tier. Highest odds first.
export function SchoolComparison({ schools }: { schools: SchoolLikelihood[] }) {
  const data = [...schools]
    .map((s) => ({
      name: shorten(s.name),
      full: s.name,
      mid: Math.round((s.likelihood_low + s.likelihood_high) / 2),
      low: s.likelihood_low,
      high: s.likelihood_high,
      tier: s.tier,
    }))
    .sort((a, b) => b.mid - a.mid);

  const height = Math.max(140, data.length * 46);

  return (
    // The range matters more than the bar, and the bar only draws the midpoint —
    // so the list states low–high as well, which is the honest figure and the
    // one the tooltip gives a sighted reader on hover.
    <ChartFigure
      label="Admission likelihood by school, highest first."
      rows={data.map((d) => ({
        name: d.full,
        value: `${d.low} to ${d.high} per cent, ${d.tier}`,
      }))}
    >
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 0, right: 16, top: 4, bottom: 4 }}
        >
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fill: "rgb(var(--ink-faint))", fontSize: 11 }}
            tickFormatter={(v) => `${v}%`}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={96}
            tick={{ fill: "rgb(var(--ink-soft))", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(16,25,43,0.04)" }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid rgb(var(--line))",
              fontSize: 12,
            }}
            formatter={(_v, _n, p) => [
              `${p.payload.low}–${p.payload.high}% (mid ${p.payload.mid}%)`,
              p.payload.full,
            ]}
          />
          <Bar
            dataKey="mid"
            radius={[0, 6, 6, 0]}
            isAnimationActive
            animationDuration={700}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={TIER_HEX[d.tier]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFigure>
  );
}

function shorten(name: string): string {
  return name
    .replace("University of ", "U. ")
    .replace(", Ann Arbor", "")
    .replace(" University", "")
    .replace("Massachusetts Institute of Technology", "MIT");
}
