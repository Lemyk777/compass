"use client";

import dynamic from "next/dynamic";
import { useToday } from "@/lib/data/use-opportunity-plan";
import type { Analysis } from "@/lib/ai/schema";
import { Section, Card } from "@/components/report/Section";
import { LikelihoodGauge } from "@/components/charts/LikelihoodGauge";

// The comparison bar chart is the only Recharts component on this page. Load it
// lazily (client-only) so Recharts stays out of the odds route's initial bundle;
// the skeleton reserves height to avoid layout shift when it swaps in.
const SchoolComparison = dynamic(
  () =>
    import("@/components/charts/SchoolComparison").then(
      (m) => m.SchoolComparison,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full animate-pulse rounded-xl bg-line/20" />
    ),
  },
);
import { Benchmarks } from "@/components/report/Benchmarks";
import { Recommendations } from "@/components/report/Recommendations";
import { COUNTRY_VIEWS } from "@/components/report/country-views";
import {
  analysisHasCountry,
  hasAnyCollegeList,
} from "@/lib/data/country-content";
import type { DestinationCode } from "@/lib/data/destinations";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import {
  CountryTabs,
  EmptyCountryList,
  NoAnalysisYet,
  PageHeader,
} from "@/components/dashboard/states";
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
  if (!hasAnyCollegeList(analysis)) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("nav.results")} hint={t("report.schoolsHint")} />
        <LockedSection
          eyebrow={t("nav.results")}
          headline="See your real odds at every school"
          description="Add the universities you're aiming for and Compass scores your admission likelihood at each one. A reach/target/likely read, with a confidence level, built from your profile and real admitted-student data."
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

      {country === "US" ? (
        <UsOdds analysis={analysis} />
      ) : (
        <CountryOdds analysis={analysis} code={country} />
      )}
    </div>
  );
}

function UsOdds({ analysis }: { analysis: Analysis }) {
  const t = useT();
  const { profileMeta } = useDashboard();

  // "today" depends on the visitor's clock; resolve it on the client so the
  // deadline countdowns don't cause a hydration mismatch. This was the fifth
  // copy of that three-line pair, each with its own comment saying the same
  // thing.
  const today = useToday();

  if (analysis.schools.length === 0) return <EmptyCountryList code="US" />;
  return (
    <div className="space-y-8">
      {analysis.schools.length > 0 && (
        <Section
          title={t("report.schoolsTitle")}
          hint={t("report.schoolsHint")}
        >
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
            Deadlines are dated to your graduation year and indicative, so always
            confirm the exact date on each school&apos;s official admissions
            site. <span className="font-medium text-ink-soft">Binding</span> =
            Early Decision: if admitted you must enrol and withdraw other
            applications.
          </p>
        </Section>
      )}
      {analysis.schools.length > 1 && (
        <Section
          title={t("report.compareTitle")}
          hint={t("report.compareHint")}
        >
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

// Every deterministic (non-US) country renders the same way: an empty-state when
// its list isn't built, otherwise its breakdown inside a titled Section. The copy
// and the breakdown component come from the country-view registry.
function CountryOdds({
  analysis,
  code,
}: {
  analysis: Analysis;
  code: DestinationCode;
}) {
  const t = useT();
  const odds = COUNTRY_VIEWS[code]?.odds;
  if (!odds) return null;
  if (!analysisHasCountry(analysis, code))
    return <EmptyCountryList code={code} />;
  return (
    <Section title={t(odds.titleKey)} hint={t(odds.hintKey)}>
      {odds.render(analysis)}
    </Section>
  );
}

function Legend() {
  const t = useT();
  const items = [
    { label: t("tier.likely"), color: "rgb(var(--likely))" },
    { label: t("tier.target"), color: "rgb(var(--target))" },
    { label: t("tier.reach"), color: "rgb(var(--reach))" },
  ];
  return (
    <div className="mt-3 flex flex-wrap gap-4 border-t border-line pt-3">
      {items.map((i) => (
        <span
          key={i.label}
          className="flex items-center gap-1.5 text-xs text-ink-soft"
        >
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: i.color }}
          />
          {i.label}
        </span>
      ))}
    </div>
  );
}
