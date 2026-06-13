"use client";

import { forwardRef } from "react";
import type { Analysis } from "@/lib/ai/schema";
import { OverallGauge } from "@/components/charts/OverallGauge";
import { RadarScorecard } from "@/components/charts/RadarScorecard";
import { FactorBars } from "@/components/charts/FactorBars";
import { Logo } from "@/components/ui/Logo";

// The signature element (§9): gauge + radar + factor bars. This is the hero,
// and the thing students screenshot — hence the forwarded ref + branding.
export const Scorecard = forwardRef<
  HTMLDivElement,
  { analysis: Analysis; name?: string | null }
>(function Scorecard({ analysis, name }, ref) {
  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-2xl border border-line bg-card shadow-lift"
    >
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <Logo className="text-ink" />
        <span className="text-xs text-ink-faint">
          {name ? `${name}'s standing` : "Your standing"}
        </span>
      </div>

      <div className="grid gap-2 p-5 sm:grid-cols-[200px_1fr] sm:gap-4">
        <div className="flex flex-col items-center justify-center">
          <OverallGauge score={analysis.overall_score} />
          <p className="mt-2 text-center text-xs text-ink-faint">
            Overall competitiveness
          </p>
        </div>
        <div className="min-w-0">
          <RadarScorecard factors={analysis.factors} />
        </div>
      </div>

      <div className="border-t border-line px-5 py-5">
        <FactorBars factors={analysis.factors} />
      </div>
    </div>
  );
});
