"use client";

import { Card } from "@/components/report/Section";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { NoAnalysisYet, PageHeader } from "@/components/dashboard/states";
import { useT } from "@/lib/i18n/client";

export function SummaryView() {
  const t = useT();
  const { analysis } = useDashboard();
  if (!analysis) return <NoAnalysisYet />;

  return (
    <div className="space-y-5">
      <PageHeader title={t("report.summaryTitle")} />
      {analysis.summary ? (
        <Card>
          <p className="text-pretty leading-relaxed text-ink-soft">{analysis.summary}</p>
        </Card>
      ) : (
        <p className="text-sm text-ink-soft">{t("dash.noSummary")}</p>
      )}
    </div>
  );
}
