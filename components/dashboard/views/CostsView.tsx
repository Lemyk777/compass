"use client";

import { CostBreakdown } from "@/components/report/CostBreakdown";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { CountryTabs, NoAnalysisYet, PageHeader } from "@/components/dashboard/states";
import { useT } from "@/lib/i18n/client";

export function CostsView() {
  const t = useT();
  const { analysis, country, tabs } = useDashboard();
  if (!analysis) return <NoAnalysisYet />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader title={t("nav.costs")} hint={t("report.costApprox")} />
        <div className="mb-6">
          <CountryTabs />
        </div>
      </div>
      {tabs.length === 0 ? (
        <p className="text-sm text-ink-soft">{t("dash.noOdds")}</p>
      ) : (
        <CostBreakdown analysis={analysis} country={country} />
      )}
    </div>
  );
}
