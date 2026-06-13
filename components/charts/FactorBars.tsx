"use client";

import type { Factor } from "@/lib/ai/schema";

// Per-factor bars with notes. The user's own scores → accent fill.
export function FactorBars({ factors }: { factors: Factor[] }) {
  return (
    <ul className="space-y-3.5">
      {factors.map((f) => (
        <li key={f.key}>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium text-ink">{f.label}</span>
            <span data-num className="text-sm font-semibold text-ink">
              {f.score}
              <span className="text-ink-faint">/10</span>
            </span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-line"
            role="meter"
            aria-valuenow={f.score}
            aria-valuemin={0}
            aria-valuemax={10}
            aria-label={`${f.label}: ${f.score} out of 10`}
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-700 ease-out"
              style={{ width: `${f.score * 10}%` }}
            />
          </div>
          {f.note && (
            <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
              {f.note}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
