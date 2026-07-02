"use client";

import { forwardRef } from "react";
import dynamic from "next/dynamic";
import type { Analysis } from "@/lib/ai/schema";
import { FactorBars } from "@/components/charts/FactorBars";

// The gauge and radar are the Recharts pieces — load them lazily (client-only)
// so Recharts stays out of the standing route's initial bundle. Skeletons reserve
// the exact footprint to avoid layout shift (mirrors the Overview view). FactorBars
// is a lightweight custom SVG, so it stays statically imported.
const OverallGauge = dynamic(
  () => import("@/components/charts/OverallGauge").then((m) => m.OverallGauge),
  {
    ssr: false,
    loading: () => (
      <div className="h-40 w-40 animate-pulse rounded-full bg-line/20 flex items-center justify-center">
        <div className="h-28 w-28 rounded-full bg-card" />
      </div>
    ),
  }
);

const RadarScorecard = dynamic(
  () => import("@/components/charts/RadarScorecard").then((m) => m.RadarScorecard),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full animate-pulse rounded-xl bg-line/20" />
    ),
  }
);
import { Logo } from "@/components/ui/Logo";
import { DESTINATIONS, type DestinationCode } from "@/lib/data/destinations";
import {
  countryOverall,
  factorsByCountryRelevance,
  factorMattersForCountry,
  hkScorecardFactors,
  uaeScorecardFactors,
  krScorecardFactors,
  krLanguageGateScore,
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
  // HK/AE/KR read a profile through their own native factor set (see
  // country-scorecard.ts), so their bars and radar use it — not the US seven.
  const krLanguage =
    country === "KR" ? krLanguageGateScore(analysis.kr_programs) : undefined;
  const nativeSet =
    country === "HK"
      ? hkScorecardFactors(analysis.factors)
      : country === "AE"
        ? uaeScorecardFactors(analysis.factors)
        : country === "KR"
          ? krScorecardFactors(analysis.factors, krLanguage ?? null)
          : null;
  const orderedFactors =
    nativeSet ??
    (country ? factorsByCountryRelevance(country, analysis.factors) : analysis.factors);
  const mutedKeys =
    country && !nativeSet
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
            krLanguageScore={krLanguage}
          />
        </div>
      </div>

      <div className="border-t border-line px-5 py-5">
        <FactorBars factors={orderedFactors} mutedKeys={mutedKeys} />
      </div>
    </div>
  );
});
