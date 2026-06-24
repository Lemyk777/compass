"use client";

import type { Factor } from "@/lib/ai/schema";

// Per-factor bars with notes. The user's own scores → accent fill.
// `mutedKeys` identifies factors that carry little weight for the selected country.
// We completely hide these factors to keep the scorecard minimal (e.g. Italy only shows 3).
export function FactorBars({
  factors,
  mutedKeys,
}: {
  factors: Factor[];
  mutedKeys?: Set<string>;
}) {
  return (
    <ul className="space-y-4">
      {factors.map((f) => {
        // Hide irrelevant factors for clean UI (Progressive Disclosure)
        if (mutedKeys?.has(f.key)) return null;

        return (
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
            
            {/* Accordion for reasoning and tier */}
            <details className="mt-2 group">
              <summary className="text-xs font-medium text-accent cursor-pointer select-none list-none hover:opacity-80 transition-opacity">
                <span className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100">
                  <svg 
                    className="w-3 h-3 transition-transform duration-200 group-open:rotate-90" 
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Score details
                </span>
              </summary>
              <div className="mt-2.5 pl-4 border-l-2 border-line/50 space-y-2">
                {f.rubric_tier && (
                  <p className="text-[11px] font-semibold text-ink-soft uppercase tracking-wide">
                    Tier: {f.rubric_tier}
                  </p>
                )}
                {f.reasoning && f.reasoning.length > 0 && (
                  <ul className="list-none space-y-1.5">
                    {f.reasoning.map((r, idx) => (
                      <li key={idx} className="text-xs text-ink-faint flex items-start gap-2">
                        <span className="text-accent/50 mt-0.5">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {f.note && (
                  <p className="text-xs italic leading-relaxed text-ink-soft bg-card-surface/50 rounded-md p-2 border border-line/30">
                    Takeaway: {f.note}
                  </p>
                )}
              </div>
            </details>
          </li>
        );
      })}
    </ul>
  );
}
