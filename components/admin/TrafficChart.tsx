"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ACCENT } from "@/lib/tiers";

/**
 * Arrivals over time, split by whether we had seen the person before.
 *
 * The split is the point. A bar chart of "visitors" tells you a number went up
 * and nothing else; the same number made of mostly-new people is a marketing
 * result, and made of mostly-returning people is a product result, and those
 * two require opposite next moves. Returning sits on the bottom of the stack in
 * the strong colour because it is the half that compounds.
 *
 * Pageviews ride along as a line on the right axis, so a day where few people
 * read a lot is visibly different from a day where many people read one page.
 */

// Series colours go through the palette so the chart follows the theme. `NEW`
// was a fixed pale blue that vanished into a light card and `VIEWS` was the
// light theme's ink-faint, which on a dark chart is barely above the surface.
const RETURNING = ACCENT;
const NEW = "rgb(var(--accent) / 0.55)";
const VIEWS = "rgb(var(--ink-faint))";

export type ChartRow = {
  label: string;
  newVisitors: number;
  returningVisitors: number;
  views: number;
};

const AXIS = {
  tick: { fill: "rgb(var(--ink-faint))", fontSize: 10 },
  tickLine: false,
  axisLine: false,
} as const;

export function TrafficChart({ data }: { data: ChartRow[] }) {
  // Long ranges get sparse labels — 90 date stamps overlap into a grey band.
  const every = data.length > 45 ? 6 : data.length > 20 ? 2 : 0;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <ComposedChart data={data} margin={{ left: -22, right: -18, top: 8, bottom: 0 }}>
        <CartesianGrid stroke="rgb(var(--line))" vertical={false} />
        <XAxis dataKey="label" {...AXIS} interval={every} minTickGap={4} />
        <YAxis allowDecimals={false} width={34} {...AXIS} />
        <YAxis
          yAxisId="views"
          orientation="right"
          allowDecimals={false}
          width={34}
          {...AXIS}
        />
        <Tooltip
          cursor={{ fill: "rgba(16,25,43,0.04)" }}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid rgb(var(--line))",
            fontSize: 12,
          }}
        />
        <Legend
          verticalAlign="top"
          height={28}
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, color: "rgb(var(--ink-soft))" }}
        />
        <Bar
          dataKey="returningVisitors"
          name="Returning"
          stackId="v"
          fill={RETURNING}
          isAnimationActive={false}
        />
        <Bar
          dataKey="newVisitors"
          name="New"
          stackId="v"
          fill={NEW}
          radius={[3, 3, 0, 0]}
          isAnimationActive={false}
        />
        <Line
          yAxisId="views"
          type="monotone"
          dataKey="views"
          name="Pages viewed"
          stroke={VIEWS}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
