"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { Analysis } from "@/lib/ai/schema";
import { Section, Card } from "@/components/report/Section";
import { LikelihoodGauge } from "@/components/charts/LikelihoodGauge";

// The comparison bar chart is the only Recharts component on this page. Load it
// lazily (client-only) so Recharts stays out of the odds route's initial bundle;
// the skeleton reserves height to avoid layout shift when it swaps in.
const SchoolComparison = dynamic(
  () => import("@/components/charts/SchoolComparison").then((m) => m.SchoolComparison),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full animate-pulse rounded-xl bg-line/20" />
    ),
  }
);
import { Benchmarks } from "@/components/report/Benchmarks";
import { Recommendations } from "@/components/report/Recommendations";
import { ItalyBreakdown } from "@/components/report/ItalyBreakdown";
import { HkBreakdown } from "@/components/report/HkBreakdown";
import { UaeBreakdown } from "@/components/report/UaeBreakdown";
import { KoreaBreakdown } from "@/components/report/KoreaBreakdown";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { CountryTabs, EmptyCountryList, NoAnalysisYet, PageHeader } from "@/components/dashboard/states";
import { LockedSection } from "@/components/dashboard/LockedSection";
import { OddsTeaser, OddsArt } from "@/components/dashboard/LockedTeasers";
import { useT } from "@/lib/i18n/client";

export function OddsView() {
  const t = useT();
  const { analysis, country, basePath } = useDashboard();
  if (!analysis) return <NoAnalysisYet />;

  // No college list yet → tease the section behind a lock + promo pop-up.
  // Country tabs now reflect the student's chosen destinations (so the standing
  // shows every selected country), so gate this on actual school/program
  // content rather than the tab count.
  const hasCollegeList =
    analysis.schools.length > 0 ||
    (analysis.italy_programs?.length ?? 0) > 0 ||
    (analysis.hk_programs?.length ?? 0) > 0 ||
    (analysis.uae_programs?.length ?? 0) > 0 ||
    (analysis.kr_programs?.length ?? 0) > 0;
  if (!hasCollegeList) {
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
      {country === "AE" && <UaeOdds analysis={analysis} />}
      {country === "KR" && <KoreaOdds analysis={analysis} />}
    </div>
  );
}

function UsOdds({ analysis }: { analysis: Analysis }) {
  const t = useT();
  const { profileMeta } = useDashboard();

  // "today" depends on the visitor's clock; resolve it on the client so the
  // deadline countdowns don't cause a hydration mismatch.
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => setToday(new Date()), []);

  if (analysis.schools.length === 0) return <EmptyCountryList code="US" />;
  return (
    <div className="space-y-8">
      {analysis.schools.length > 0 && (
        <Section title={t("report.schoolsTitle")} hint={t("report.schoolsHint")}>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {analysis.schools.map((s) => (
              <LikelihoodGauge
                key={s.name}
                school={s}
                today={today}
                graduationYear={profileMeta.graduationYear}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-faint">
            Deadlines are dated to your graduation year and indicative — always
            confirm the exact date on each school&apos;s official admissions
            site. <span className="font-medium text-ink-soft">Binding</span> =
            Early Decision: if admitted you must enrol and withdraw other
            applications.
          </p>
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
  if (!analysis.italy_programs?.length) return <EmptyCountryList code="IT" />;
  return (
    <Section title={t("report.italyTitle")} hint={t("report.italyHint")}>
      <ItalyBreakdown programs={analysis.italy_programs} />
    </Section>
  );
}

function HkOdds({ analysis }: { analysis: Analysis }) {
  const t = useT();
  if (!analysis.hk_programs?.length) return <EmptyCountryList code="HK" />;
  return (
    <Section title={t("report.hkTitle")} hint={t("report.hkHint")}>
      <HkBreakdown programs={analysis.hk_programs} />
    </Section>
  );
}

function UaeOdds({ analysis }: { analysis: Analysis }) {
  const t = useT();
  if (!analysis.uae_programs?.length) return <EmptyCountryList code="AE" />;
  return (
    <Section title={t("report.uaeTitle")} hint={t("report.uaeHint")}>
      <UaeBreakdown programs={analysis.uae_programs} />
    </Section>
  );
}

function KoreaOdds({ analysis }: { analysis: Analysis }) {
  const t = useT();
  if (!analysis.kr_programs?.length) return <EmptyCountryList code="KR" />;
  return (
    <Section title={t("report.krTitle")} hint={t("report.krHint")}>
      <KoreaBreakdown programs={analysis.kr_programs} />
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
