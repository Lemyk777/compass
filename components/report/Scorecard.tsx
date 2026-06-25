"use client";

import { forwardRef } from "react";
import type { Analysis } from "@/lib/ai/schema";
import { OverallGauge } from "@/components/charts/OverallGauge";
import { RadarScorecard } from "@/components/charts/RadarScorecard";
import { FactorBars } from "@/components/charts/FactorBars";
import { Logo } from "@/components/ui/Logo";
import { DESTINATIONS, type DestinationCode } from "@/lib/data/destinations";
import {
  countryOverall,
  factorsByCountryRelevance,
  factorMattersForCountry,
} from "@/lib/data/country-scorecard";
import { useT } from "@/lib/i18n/client";

// The signature element (§9): gauge + radar + factor bars. This is the hero,
// and the thing students screenshot — hence the forwarded ref + branding.
//
// When `country` is set, the scorecard is computed FOR that destination: the
// overall is re-weighted by the country's admission logic, the factor bars are
// reordered by relevance (and the irrelevant ones dimmed), and the radar enters
// Italy mode only for Italy. Same factor scores, country-specific emphasis.
export const Scorecard = forwardRef<
  HTMLDivElement,
  { analysis: Analysis; name?: string | null; country?: DestinationCode | null }
>(function Scorecard({ analysis, name, country }, ref) {
  const t = useT();

  const overall = country
    ? countryOverall(country, analysis.factors, analysis.italy_financial_fit_score)
    : analysis.overall_score;
  const orderedFactors = country
    ? factorsByCountryRelevance(country, analysis.factors)
    : analysis.factors;
  const mutedKeys = country
    ? new Set(
        analysis.factors
          .filter((f) => !factorMattersForCountry(country, f.key))
          .map((f) => f.key)
      )
    : undefined;
  const italyFinancialFitScore =
    country === "IT" ? analysis.italy_financial_fit_score : undefined;

  const standingLabel = name
    ? `${t("report.standingPrefix")}${name}${t("report.standingSuffix")}`
    : t("report.yourStanding");
  const countryLabel = country
    ? t(DESTINATIONS.find((d) => d.code === country)?.labelKey ?? "")
    : "";

  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-2xl border border-line bg-card shadow-lift"
    >
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <Logo className="text-ink" />
        <span className="text-xs text-ink-faint">{standingLabel}</span>
      </div>

      <div className="grid gap-2 p-5 sm:grid-cols-[200px_1fr] sm:gap-4">
        <div className="flex flex-col items-center justify-center">
          <OverallGauge score={overall} />
          <p className="mt-2 text-center text-xs text-ink-faint">
            {t("report.overall")}
          </p>
          {country && (
            <p className="mt-0.5 text-center text-[0.7rem] font-medium text-accent">
              {t("report.weightedFor")} {countryLabel}
            </p>
          )}
        </div>
        <div className="min-w-0">
          <RadarScorecard
            factors={analysis.factors}
            italyFinancialFitScore={italyFinancialFitScore}
            country={country}
          />
        </div>
      </div>

      <div className="border-t border-line px-5 py-5">
        <FactorBars factors={orderedFactors} mutedKeys={mutedKeys} />
      </div>
    </div>
  );
});
