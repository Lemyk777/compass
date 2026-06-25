"use client";

import { Timeline } from "@/components/report/Timeline";
import { Card } from "@/components/report/Section";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { NoAnalysisYet, PageHeader } from "@/components/dashboard/states";
import { useT } from "@/lib/i18n/client";

export function TimelineView() {
  const t = useT();
  const { analysis } = useDashboard();
  if (!analysis) return <NoAnalysisYet />;

  return (
    <div className="space-y-5">
      <PageHeader title={t("report.timelineTitle")} hint={t("report.timelineHint")} />
      {analysis.timeline.length > 0 ? (
        <Card>
          <Timeline blocks={analysis.timeline} />
        </Card>
      ) : (
        <p className="text-sm text-ink-soft">{t("dash.noTimeline")}</p>
      )}
    </div>
  );
}
