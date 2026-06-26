"use client";

import { CostBreakdown } from "@/components/report/CostBreakdown";
import { analysisHasCountry, useDashboard } from "@/components/dashboard/DashboardContext";
import { CountryTabs, EmptyCountryList, NoAnalysisYet, PageHeader } from "@/components/dashboard/states";
import { LockedSection } from "@/components/dashboard/LockedSection";
import { CostsTeaser, CostsArt } from "@/components/dashboard/LockedTeasers";
import { useT } from "@/lib/i18n/client";

export function CostsView() {
  const t = useT();
  const { analysis, country, basePath } = useDashboard();
  if (!analysis) return <NoAnalysisYet />;

  // No college list yet → tease the section behind a lock + promo pop-up.
  // Country tabs now reflect the student's chosen destinations, so gate this on
  // actual school/program content rather than the tab count.
  const hasCollegeList =
    analysis.schools.length > 0 ||
    (analysis.italy_programs?.length ?? 0) > 0 ||
    (analysis.hk_programs?.length ?? 0) > 0;
  if (!hasCollegeList) {
    return (
      <div className="space-y-5">
        <PageHeader title={t("nav.costs")} hint={t("report.costApprox")} />
        <LockedSection
          eyebrow={t("nav.costs")}
          headline="Know what it costs before you apply"
          description="Add your target universities and Compass adds up the one-time application fees per school and per country — so there are no surprises when it's time to hit submit."
          bullets={[
            "Per-school application fees",
            "A clear total to apply, by country",
            "Spot the free-to-apply schools instantly",
          ]}
          ctaLabel="Build your college list"
          ctaHref={`${basePath}/college-list`}
          teaser={<CostsTeaser />}
          art={<CostsArt />}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader title={t("nav.costs")} hint={t("report.costApprox")} />
        <div className="mb-6">
          <CountryTabs />
        </div>
      </div>
      {analysisHasCountry(analysis, country) ? (
        <CostBreakdown analysis={analysis} country={country} />
      ) : (
        <EmptyCountryList code={country} />
      )}
    </div>
  );
}
