"use client";

import type { SchoolLikelihood } from "@/lib/ai/schema";
import { TIER_HEX, TIER_META, CONFIDENCE_LABEL } from "@/lib/tiers";

// Per-school admission-likelihood gauge: a range band (low–high) on a 0–100
// track, coloured by tier. Always a range, never a single number (§7.2).
export function LikelihoodGauge({ school }: { school: SchoolLikelihood }) {
  const color = TIER_HEX[school.tier];
  const meta = TIER_META[school.tier];
  const low = Math.max(0, Math.min(100, school.likelihood_low));
  const high = Math.max(low, Math.min(100, school.likelihood_high));

  return (
    <div className="rounded-2xl border border-line bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[0.95rem] font-semibold leading-tight text-ink">
          {school.name}
        </h3>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium"
          style={{ backgroundColor: meta.soft, color: meta.text }}
        >
          {meta.label}
        </span>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span data-num className="font-display text-xl font-semibold text-ink">
          {low}–{high}%
        </span>
        <span className="text-xs text-ink-faint">{CONFIDENCE_LABEL[school.confidence]}</span>
      </div>

      {/* Range track */}
      <div className="relative mt-2 h-2.5 w-full rounded-full bg-line">
        <div
          className="absolute top-0 h-full rounded-full"
          style={{
            left: `${low}%`,
            width: `${Math.max(2, high - low)}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-ink-faint">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>

      <p className="mt-2.5 text-xs leading-relaxed text-ink-soft">
        {school.reason}
      </p>
    </div>
  );
}
