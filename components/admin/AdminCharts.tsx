"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";
import { ACCENT } from "@/lib/tiers";
import { useT } from "@/lib/i18n/client";

export function SignupsOverTime({
  data,
}: {
  data: { day: string; count: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
        <XAxis
          dataKey="day"
          tick={{ fill: "var(--ink-faint)", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: "var(--ink-faint)", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          width={28}
        />
        <Tooltip
          cursor={{ fill: "rgba(16,25,43,0.04)" }}
          contentStyle={{ borderRadius: 12, border: "1px solid var(--line)", fontSize: 12 }}
        />
        <Bar dataKey="count" fill={ACCENT} radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SignupsByCountry({
  data,
}: {
  data: { country: string; count: number }[];
}) {
  const t = useT();
  if (!data.length)
    return <p className="text-sm text-ink-faint">{t("admin.noSignups")}</p>;
  const height = Math.max(120, data.length * 34);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ left: 0, right: 16, top: 4, bottom: 4 }}
      >
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fill: "var(--ink-faint)", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="country"
          width={110}
          tick={{ fill: "var(--ink-soft)", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursor={{ fill: "rgba(16,25,43,0.04)" }}
          contentStyle={{ borderRadius: 12, border: "1px solid var(--line)", fontSize: 12 }}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} isAnimationActive={false}>
          {data.map((_, i) => (
            <Cell key={i} fill={ACCENT} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
