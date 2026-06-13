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
import { Button } from "@/components/ui/Button";

export function Report({
  analysis,
  name,
}: {
  analysis: Analysis;
  name?: string | null;
}) {
  const scorecardRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-8">
      {/* Hero scorecard + share */}
      <div className="space-y-3">
        <Scorecard ref={scorecardRef} analysis={analysis} name={name} />
        <ShareButton score={analysis.overall_score} />
        <p className="text-center text-xs text-ink-faint">
          This is an estimate — top schools are unpredictable for everyone.
        </p>
      </div>

      {/* Per-school likelihood */}
      {analysis.schools.length > 0 && (
        <Section
          title="Your school list"
          hint="Admission likelihood is always a range, with a confidence level."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {analysis.schools.map((s) => (
              <LikelihoodGauge key={s.name} school={s} />
            ))}
          </div>
        </Section>
      )}

      {/* Comparison */}
      {analysis.schools.length > 1 && (
        <Section
          title="Compared side by side"
          hint="Mid-point likelihood, highest odds first."
        >
          <Card>
            <SchoolComparison schools={analysis.schools} />
            <Legend />
          </Card>
        </Section>
      )}

      {/* Benchmarks */}
      {analysis.benchmarks.length > 0 && (
        <Section
          title="How you compare"
          hint="Your scores against each school's admitted middle 50%."
        >
          <Card>
            <Benchmarks benchmarks={analysis.benchmarks} />
          </Card>
        </Section>
      )}

      {/* Gap analysis */}
      {analysis.gap_analysis.length > 0 && (
        <Section
          title="Your highest-impact moves"
          hint="Ranked by how much they lift your standing."
        >
          <GapAnalysis items={analysis.gap_analysis} />
        </Section>
      )}

      {/* Recommendations */}
      {analysis.recommended_schools.length > 0 && (
        <Section
          title="Schools worth adding"
          hint="Strong fits that aren't on your list yet."
        >
          <Recommendations schools={analysis.recommended_schools} />
        </Section>
      )}

      {/* Timeline */}
      {analysis.timeline.length > 0 && (
        <Section title="What to do next" hint="A plan across the coming months.">
          <Card>
            <Timeline blocks={analysis.timeline} />
          </Card>
        </Section>
      )}

      {/* Summary */}
      {analysis.summary && (
        <Section title="The bottom line">
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

function Legend() {
  const items = [
    { label: "Likely", color: "var(--likely)" },
    { label: "Target", color: "var(--target)" },
    { label: "Reach", color: "var(--reach)" },
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
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = typeof window !== "undefined" ? window.location.origin : "";
    const text = `I scored ${score}/100 on my Compass US-university competitiveness scorecard.`;
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
      {copied ? "Copied to clipboard ✓" : "Share my scorecard"}
    </Button>
  );
}
