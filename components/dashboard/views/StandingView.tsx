"use client";

import { useState } from "react";
import { Scorecard } from "@/components/report/Scorecard";
import { Button } from "@/components/ui/Button";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { CountryTabs, NoAnalysisYet, PageHeader } from "@/components/dashboard/states";
import { countryOverall } from "@/lib/data/country-scorecard";
import { useT } from "@/lib/i18n/client";

export function StandingView() {
  const t = useT();
  const { analysis, name, country, tabs } = useDashboard();
  if (!analysis) return <NoAnalysisYet />;

  const activeTab = tabs.length ? country : null;
  const shareScore = activeTab
    ? countryOverall(activeTab, analysis.factors, analysis.italy_financial_fit_score)
    : analysis.overall_score;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader title={t("nav.standing")} hint={t("dash.basedOn")} />
        <div className="mb-6">
          <CountryTabs />
        </div>
      </div>
      <Scorecard analysis={analysis} name={name} country={activeTab} />
      <ShareButton score={shareScore} />
      <p className="text-center text-xs text-ink-faint">{t("report.estimate")}</p>
    </div>
  );
}

function ShareButton({ score }: { score: number }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = typeof window !== "undefined" ? window.location.origin : "";
    const text = `I scored ${score}/100 on my Compass university competitiveness scorecard.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "My Compass scorecard", text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // user cancelled — no-op
    }
  }
  return (
    <Button variant="subtle" className="w-full" onClick={share}>
      {copied ? t("report.copied") : t("report.share")}
    </Button>
  );
}
