"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { OverallGauge } from "@/components/charts/OverallGauge";
import { RadarScorecard } from "@/components/charts/RadarScorecard";
import { ButtonLink } from "@/components/ui/Button";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import {
  CountryTabs,
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/dashboard/states";
import {
  countryOverall,
  factorsByCountryRelevance,
  factorMattersForCountry,
} from "@/lib/data/country-scorecard";
import { useT } from "@/lib/i18n/client";

export function Overview() {
  const t = useT();
  const {
    analysis,
    name,
    hasProfile,
    loading,
    error,
    runAnalysis,
    canAnalyze,
    basePath,
    country,
  } = useDashboard();

  // Honor ?analyze=1 (set when onboarding hands off) — run once on mount.
  const searchParams = useSearchParams();
  const autoAnalyze = searchParams.get("analyze") === "1";
  const started = useRef(false);
  useEffect(() => {
    if (autoAnalyze && !analysis && hasProfile && canAnalyze && !started.current) {
      started.current = true;
      runAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={runAnalysis} hasProfile={hasProfile} />;
  if (!analysis) return <EmptyState hasProfile={hasProfile} onRun={runAnalysis} />;

  const overall = countryOverall(
    country,
    analysis.factors,
    analysis.italy_financial_fit_score
  );
  const italyFin = country === "IT" ? analysis.italy_financial_fit_score : undefined;

  // Top factors for the compact bar list — relevant ones for the country first.
  const topFactors = factorsByCountryRelevance(country, analysis.factors)
    .filter((f) => factorMattersForCountry(country, f.key))
    .slice(0, 4);

  const greeting = name ? `${t("dash.hello")}, ${name}` : t("dash.hello");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">{greeting}</h1>
          <p className="mt-1 text-sm text-ink-soft">{t("dash.yourStanding")}</p>
        </div>
        <CountryTabs />
      </div>

      {/* Two cards on one row, equal height. */}
      <div className="grid items-stretch gap-5 lg:grid-cols-2">
        {/* Spider chart */}
        <section className="flex flex-col rounded-2xl border border-line bg-card p-6 shadow-card">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
            {t("dash.yourStanding")}
          </h2>
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full">
              <RadarScorecard factors={analysis.factors} italyFinancialFitScore={italyFin} />
            </div>
          </div>
        </section>

        {/* Gauge + factor bars + CTA */}
        <section className="flex flex-col rounded-2xl border border-line bg-card p-6 shadow-card">
          <div className="flex flex-1 flex-col items-center gap-5 sm:flex-row sm:items-center">
            <div className="flex flex-col items-center">
              <OverallGauge score={overall} />
            </div>
            <ul className="w-full flex-1 space-y-3.5">
              {topFactors.map((f) => {
                // Factor scores are whole numbers on the 0–10 rubric; round so a
                // stored decimal (e.g. 8.4) reads like the rest (8) — both the
                // number and the bar width.
                const shown = Math.round(f.score);
                return (
                  <li key={f.key}>
                    <div className="mb-1 flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium text-ink">{f.label}</span>
                      <span data-num className="text-sm font-semibold text-ink">
                        {shown}
                        <span className="text-ink-faint">/10</span>
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-line">
                      <div
                        className="h-full rounded-full bg-accent transition-[width] duration-700 ease-out"
                        style={{ width: `${shown * 10}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          <ButtonLink href={`${basePath}/standing`} variant="subtle" className="mt-6 w-full">
            {t("dash.seeFull")}
          </ButtonLink>
        </section>
      </div>

      {/* Wide call to action → admission odds */}
      <ButtonLink
        href={`${basePath}/odds`}
        variant="subtle"
        className="!h-auto w-full justify-start gap-5 rounded-2xl !px-6 py-6 text-left"
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent text-white">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
        <span className="flex-1">
          <span className="block text-xs font-medium uppercase tracking-wide text-ink-faint">
            {t("dash.firstStep")}
          </span>
          <span className="mt-0.5 block text-lg font-semibold text-ink">
            {t("dash.oddsCta")}
          </span>
          <span className="mt-0.5 block text-sm text-ink-soft">{t("dash.oddsTime")}</span>
        </span>
        <span className="text-ink-faint">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </span>
      </ButtonLink>
    </div>
  );
}
