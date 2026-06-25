"use client";

import { GapAnalysis } from "@/components/report/GapAnalysis";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { NoAnalysisYet, PageHeader } from "@/components/dashboard/states";
import { useT } from "@/lib/i18n/client";

export function PlanView() {
  const t = useT();
  const { analysis } = useDashboard();
  if (!analysis) return <NoAnalysisYet />;

  return (
    <div className="space-y-5">
      <PageHeader title={t("report.gapTitle")} hint={t("report.gapHint")} />
      {analysis.gap_analysis.length > 0 ? (
        <GapAnalysis items={analysis.gap_analysis} />
      ) : (
        <p className="text-sm text-ink-soft">{t("dash.noPlan")}</p>
      )}
    </div>
  );
}
