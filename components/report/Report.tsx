"use client";

import { useRef, useState } from "react";
import type { Analysis } from "@/lib/ai/schema";
import { Scorecard } from "@/components/report/Scorecard";
import { Section, Card } from "@/components/report/Section";
import { LikelihoodGauge } from "@/components/charts/LikelihoodGauge";
import { SchoolComparison } from "@/components/charts/SchoolComparison";
import { Benchmarks } from "@/components/report/Benchmarks";
import { GapAnalysis } from "@/components/report/GapAnalysis";
import { Recommendations } from "@/components/report/Recommendations";
import { Timeline } from "@/components/report/Timeline";
import { ItalyBreakdown } from "@/components/report/ItalyBreakdown";
import { Button } from "@/components/ui/Button";
import { DESTINATIONS, type DestinationCode } from "@/lib/data/destinations";
import { useT } from "@/lib/i18n/client";

export function Report({
  analysis,
  name,
}: {
  analysis: Analysis;
  name?: string | null;
}) {
  const t = useT();
  const scorecardRef = useRef<HTMLDivElement>(null);

  // Which destinations actually have content to show. The general scorecard
  // applies to everyone; each country's admission odds live in their own
  // section, switchable via the selector when more than one is present.
  const hasUS = analysis.schools.length > 0;
  const hasItaly = (analysis.italy_programs?.length ?? 0) > 0;
  const tabs: DestinationCode[] = [];
  if (hasUS) tabs.push("US");
  if (hasItaly) tabs.push("IT");

  const [active, setActive] = useState<DestinationCode>("US");
  const activeTab: DestinationCode | null = tabs.length
    ? tabs.includes(active)
      ? active
      : tabs[0]
    : null;

  return (
    <div className="space-y-8">
      {/* Hero scorecard + share — the country-agnostic profile strength. */}
      <div className="space-y-3">
        <Scorecard ref={scorecardRef} analysis={analysis} name={name} />
        <ShareButton score={analysis.overall_score} />
        <p className="text-center text-xs text-ink-faint">
          {t("report.estimate")}
        </p>
      </div>

      {/* Admission odds, cleanly separated per destination country. */}
      {activeTab && (
        <div className="space-y-5">
          {tabs.length > 1 ? (
            <div className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-ink">
                  {t("report.destTitle")}
                </h2>
                <p className="mt-0.5 text-sm text-ink-soft">
                  {t("report.destHint")}
                </p>
              </div>
              <DestinationTabs
                tabs={tabs}
                active={activeTab}
                onChange={setActive}
              />
            </div>
          ) : (
            <CountryHeader code={activeTab} />
          )}

          <div className="space-y-8">
            {activeTab === "US" && <UsOdds analysis={analysis} />}
            {activeTab === "IT" && <ItalyOdds analysis={analysis} />}
          </div>
        </div>
      )}

      {/* General plan — applies across every destination. */}
      {analysis.gap_analysis.length > 0 && (
        <Section title={t("report.gapTitle")} hint={t("report.gapHint")}>
          <GapAnalysis items={analysis.gap_analysis} />
        </Section>
      )}

      {analysis.timeline.length > 0 && (
        <Section title={t("report.timelineTitle")} hint={t("report.timelineHint")}>
          <Card>
            <Timeline blocks={analysis.timeline} />
          </Card>
        </Section>
      )}

      {analysis.summary && (
        <Section title={t("report.summaryTitle")}>
          <Card>
            <p className="text-pretty leading-relaxed text-ink-soft">
              {analysis.summary}
            </p>
          </Card>
        </Section>
      )}
    </div>
  );
}

// ── Destination selector (the "выборка") ─────────────────────────────────────
function DestinationTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: DestinationCode[];
  active: DestinationCode;
  onChange: (code: DestinationCode) => void;
}) {
  const t = useT();
  return (
    <div className="inline-flex rounded-xl border border-line bg-card p-1">
      {tabs.map((code) => {
        const d = DESTINATIONS.find((x) => x.code === code);
        if (!d) return null;
        const on = code === active;
        return (
          <button
            key={code}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(code)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:focus-ring ${
              on ? "bg-accent text-white" : "text-ink-soft hover:text-ink"
            }`}
          >
            <span aria-hidden="true">{d.flag}</span>
            {t(d.labelKey)}
          </button>
        );
      })}
    </div>
  );
}

function CountryHeader({ code }: { code: DestinationCode }) {
  const t = useT();
  const d = DESTINATIONS.find((x) => x.code === code);
  if (!d) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xl" aria-hidden="true">
        {d.flag}
      </span>
      <h2 className="text-lg font-semibold tracking-tight text-ink">
        {t(d.labelKey)}
      </h2>
    </div>
  );
}

// ── US admission odds (AI) ───────────────────────────────────────────────────
function UsOdds({ analysis }: { analysis: Analysis }) {
  const t = useT();
  return (
    <>
      {analysis.schools.length > 0 && (
        <Section title={t("report.schoolsTitle")} hint={t("report.schoolsHint")}>
          <div className="grid gap-3 sm:grid-cols-2">
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
    </>
  );
}

// ── Italy admission odds (deterministic) ─────────────────────────────────────
function ItalyOdds({ analysis }: { analysis: Analysis }) {
  const t = useT();
  if (!analysis.italy_programs?.length) return null;
  return (
    <Section title={t("report.italyTitle")} hint={t("report.italyHint")}>
      <ItalyBreakdown programs={analysis.italy_programs} />
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
      // user cancelled share — no-op
    }
  }

  return (
    <Button variant="subtle" className="w-full" onClick={share}>
      {copied ? t("report.copied") : t("report.share")}
    </Button>
  );
}
