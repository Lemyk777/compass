"use client";

import type { Benchmark } from "@/lib/ai/schema";
import { ACCENT } from "@/lib/tiers";

// Benchmark markers: the student's value plotted against each school's
// admitted mid-50% (p25–p75) range.
export function Benchmarks({ benchmarks }: { benchmarks: Benchmark[] }) {
  if (!benchmarks.length) return null;

  // Shared scale across rows for visual comparability.
  const all = benchmarks.flatMap((b) => [b.admit_p25, b.admit_p75, b.student_value]);
  const min = Math.min(...all);
  const max = Math.max(...all);
  const pad = (max - min) * 0.12 || 10;
  const lo = min - pad;
  const hi = max + pad;
  const pct = (v: number) => ((v - lo) / (hi - lo)) * 100;

  return (
    <ul className="space-y-4">
      {benchmarks.map((b, i) => {
        const inRange = b.student_value >= b.admit_p25 && b.student_value <= b.admit_p75;
        const above = b.student_value > b.admit_p75;
        return (
          <li key={i}>
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium text-ink">{b.school}</span>
              <span data-num className="text-xs text-ink-soft">
                {b.metric} {b.student_value} · mid {b.admit_p25}–{b.admit_p75}
              </span>
            </div>
            <div className="relative h-7">
              {/* admitted range band */}
              <div
                className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-line"
                style={{
                  left: `${pct(b.admit_p25)}%`,
                  width: `${pct(b.admit_p75) - pct(b.admit_p25)}%`,
                }}
              />
              {/* student marker */}
              <div
                className="absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                style={{ left: `${Math.max(2, Math.min(98, pct(b.student_value)))}%` }}
              >
                <span
                  className="h-4 w-4 rounded-full border-2 border-white shadow"
                  style={{ backgroundColor: ACCENT }}
                />
              </div>
            </div>
            <p className="mt-0.5 text-xs text-ink-faint">
              {inRange
                ? "You're inside the admitted range."
                : above
                  ? "You're above the admitted mid-range — a strength."
                  : "You're below the admitted mid-range here."}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
