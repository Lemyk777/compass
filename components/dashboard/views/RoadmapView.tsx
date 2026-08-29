"use client";

import { useEffect, useState } from "react";
import {
  roadmapModule,
  useToday,
  useWarmModule,
} from "@/lib/data/use-opportunity-plan";
import { Card } from "@/components/report/Section";
import { GapAnalysis } from "@/components/report/GapAnalysis";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { PageHeader } from "@/components/dashboard/states";
import { COUNTRY_CONTENT } from "@/lib/data/country-content";
import { InteractiveRoadmap } from "@/components/roadmap/InteractiveRoadmap";
// TYPE-ONLY, and that is load-bearing. `roadmap.ts` reaches `key-dates.ts` for
// `buildStudyPlan`, and key-dates builds a lookup map over the whole ~2,700-row
// catalog at module load — so it cannot be tree-shaken, and a runtime import
// here put the catalog in the INITIAL bundle of four dashboard routes and their
// four demo twins. Measured at 27–28 kB each. `buildRoadmap` is loaded through
// a dynamic `import()` below instead, exactly as the three matching views load
// `buildExtracurriculars`.
import type { Roadmap } from "@/lib/data/roadmap";
import { useT } from "@/lib/i18n/client";

// The Roadmap merges the old "Action plan" (gap analysis) and "Timeline" into a
// single, runway-aware story: how much time you have → what that means → a
// phased, date-anchored plan built from it.
export function RoadmapView() {
  const t = useT();
  const { analysis, profileMeta, basePath, liveDates } = useDashboard();

  // "today" depends on the visitor's clock, so resolve it on the client to avoid
  // a hydration mismatch. Until then, render nothing date-dependent. The hook
  // also starts fetching `roadmap` (which reaches the catalog, and is why this
  // import is dynamic at all) from mount, in the same tick — it used to
  // wait for this state to land and force a second render first.
  const today = useToday();
  // Start fetching `roadmap` (which reaches the catalog, and is why this import
  // is dynamic at all) on mount rather than after `today` lands and forces a
  // second render. See useWarmModule.
  useWarmModule(roadmapModule);

  // The roadmap is deterministic (dates + profile facts), so it renders BEFORE
  // any analysis exists — the "grow with us" mode for younger students. Without
  // an analysis there are no target schools or AI actions yet: the plan anchors
  // to the graduation-year cycle and carries SAT sittings + confirmed
  // competitions; the personalized layers join in once the analysis runs.
  //
  // The student's actual target schools per country — the roadmap resolves each
  // one's real, verified deadline (US via app-deadlines, others via the
  // hand-verified intl-deadlines dataset). Per-country reads come from the
  // content registry (lib/data/country-content.ts).
  // Built in an effect off a dynamic import, so the catalog `roadmap.ts` pulls
  // in is a separate async chunk rather than this route's initial JS. The plan
  // is null for one paint, which the skeleton below already handled — it was
  // null until `today` resolved anyway.
  //
  // `targets` is derived INSIDE the effect on purpose: it builds a fresh array
  // every render, so as a dependency it would re-run this on every paint.
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  useEffect(() => {
    if (!today) return;
    let cancelled = false;
    const uniq = (a: string[]) => [...new Set(a.filter(Boolean))];
    const targets = analysis
      ? COUNTRY_CONTENT.map((c) => ({
          code: c.code,
          universities: uniq(c.universities(analysis)),
        })).filter((t) => t.universities.length > 0)
      : [];
    roadmapModule().then((m) => {
      if (cancelled) return;
      setRoadmap(
        m.buildRoadmap({
          today,
          graduationYear: profileMeta.graduationYear,
          faculties: profileMeta.faculties,
          satScore: profileMeta.satScore,
          homeCountry: profileMeta.homeCountry,
          targets,
          planActions: analysis?.timeline ?? [],
          liveSatSittings: liveDates.satSittings,
          liveCompetitions: liveDates.competitions,
        }),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [
    today,
    analysis,
    profileMeta.graduationYear,
    profileMeta.faculties,
    profileMeta.satScore,
    profileMeta.homeCountry,
    liveDates.satSittings,
    liveDates.competitions,
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("report.roadmapTitle")}
        hint={t("report.roadmapHint")}
      />

      {/* Pre-analysis nudge: the dated skeleton is here, the personalized
          layers (target-school deadlines, AI actions, levers) need the run. */}
      {!analysis && (
        <Card>
          <p className="text-sm leading-relaxed text-ink-soft">
            <span className="font-medium text-ink">
              This is your date-anchored skeleton plan.
            </span>{" "}
            <a
              href={basePath}
              className="font-medium text-accent-ink hover:underline"
            >
              Run the analysis
            </a>{" "}
            to fold in your target schools&rsquo; real deadlines and a
            personalized action list.
          </p>
        </Card>
      )}

      {/* Highest-impact levers — the "what moves the needle" summary, kept from
          the old Action-plan view. The phased roadmap below sequences these. */}
      {analysis && analysis.gap_analysis.length > 0 && (
        <Card>
          <h2 className="mb-1 text-base font-semibold text-ink">
            Your highest-impact levers
          </h2>
          <p className="mb-4 text-sm text-ink-soft">
            Ranked by how much they lift your standing. The plan below schedules
            them against your real deadlines.
          </p>
          <GapAnalysis items={analysis.gap_analysis} />
        </Card>
      )}

      {roadmap ? (
        <InteractiveRoadmap
          roadmap={roadmap}
          today={today!}
          basePath={basePath}
          showExtraSections={true}
        />
      ) : (
        <div className="h-64 animate-pulse rounded-3xl border border-line bg-card" />
      )}

      <p className="text-center text-xs text-ink-faint">
        Dates are indicative, so always confirm on the official site before you
        rely on them.
      </p>
    </div>
  );
}
