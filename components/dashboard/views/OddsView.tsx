"use client";

import type { Analysis } from "@/lib/ai/schema";
import { Section, Card } from "@/components/report/Section";
import { LikelihoodGauge } from "@/components/charts/LikelihoodGauge";
import { SchoolComparison } from "@/components/charts/SchoolComparison";
import { Benchmarks } from "@/components/report/Benchmarks";
import { Recommendations } from "@/components/report/Recommendations";
import { ItalyBreakdown } from "@/components/report/ItalyBreakdown";
import { HkBreakdown } from "@/components/report/HkBreakdown";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { CountryTabs, NoAnalysisYet, PageHeader } from "@/components/dashboard/states";
import { LockedSection } from "@/components/dashboard/LockedSection";
import { OddsTeaser, OddsArt } from "@/components/dashboard/LockedTeasers";
import { useT } from "@/lib/i18n/client";

export function OddsView() {
  const t = useT();
  const { analysis, country, tabs, basePath } = useDashboard();
  if (!analysis) return <NoAnalysisYet />;

  // No college list yet → tease the section behind a lock + promo pop-up.
  if (tabs.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("nav.results")} hint={t("report.schoolsHint")} />
        <LockedSection
          eyebrow={t("nav.results")}
          headline="See your real odds at every school"
          description="Add the universities you're aiming for and Compass scores your admission likelihood at each one — a reach/target/likely read, with a confidence level, built from your profile and real admitted-student data."
          bullets={[
            "Per-school admission-likelihood ranges",
            "Reach / target / likely tiers, side by side",
            "Your scores benchmarked against admitted students",
          ]}
          ctaLabel="Build your college list"
          ctaHref={`${basePath}/college-list`}
          teaser={<OddsTeaser />}
          art={<OddsArt />}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader title={t("nav.results")} hint={t("report.schoolsHint")} />
        <div className="mb-6">
          <CountryTabs />
        </div>
      </div>

      {country === "US" && <UsOdds analysis={analysis} />}
      {country === "IT" && <ItalyOdds analysis={analysis} />}
      {country === "HK" && <HkOdds analysis={analysis} />}
    </div>
  );
}

function UsOdds({ analysis }: { analysis: Analysis }) {
  const t = useT();
  return (
    <div className="space-y-8">
      {analysis.schools.length > 0 && (
        <Section title={t("report.schoolsTitle")} hint={t("report.schoolsHint")}>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {analysis.schools.map((s) => (
              <LikelihoodGauge key={s.name} school={s} />
            ))}
          </div>
        </Section>
      )}
      {analysis.schools.length > 1 && (
        <Section title={t("report.compareTitle")} hint={t("report.compareHint")}>
          <Card>
            <SchoolComparison schools={analysis.schools} />
            <Legend />
          </Card>
        </Section>
      )}
      {analysis.benchmarks.length > 0 && (
        <Section title={t("report.benchTitle")} hint={t("report.benchHint")}>
          <Card>
            <Benchmarks benchmarks={analysis.benchmarks} />
          </Card>
        </Section>
      )}
      {analysis.recommended_schools.length > 0 && (
        <Section title={t("report.recTitle")} hint={t("report.recHint")}>
          <Recommendations schools={analysis.recommended_schools} />
        </Section>
      )}
    </div>
  );
}

function ItalyOdds({ analysis }: { analysis: Analysis }) {
  const t = useT();
  if (!analysis.italy_programs?.length) return null;
  return (
    <Section title={t("report.italyTitle")} hint={t("report.italyHint")}>
      <ItalyBreakdown programs={analysis.italy_programs} />
    </Section>
  );
}

function HkOdds({ analysis }: { analysis: Analysis }) {
  const t = useT();
  if (!analysis.hk_programs?.length) return null;
  return (
    <Section title={t("report.hkTitle")} hint={t("report.hkHint")}>
      <HkBreakdown programs={analysis.hk_programs} />
    </Section>
  );
}

function Legend() {
  const t = useT();
  const items = [
    { label: t("tier.likely"), color: "var(--likely)" },
    { label: t("tier.target"), color: "var(--target)" },
    { label: t("tier.reach"), color: "var(--reach)" },
  ];
  return (
    <div className="mt-3 flex flex-wrap gap-4 border-t border-line pt-3">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5 text-xs text-ink-soft">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}
