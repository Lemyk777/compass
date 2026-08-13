"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/report/Section";
import { GapAnalysis } from "@/components/report/GapAnalysis";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { PageHeader } from "@/components/dashboard/states";
import { formatDate } from "@/lib/data/opportunity-format";
import { COUNTRY_CONTENT } from "@/lib/data/country-content";
import {
  buildRoadmap,
  type Regime,
  type Roadmap,
  type RoadmapAction,
  type RoadmapPhase,
} from "@/lib/data/roadmap";
import { useT } from "@/lib/i18n/client";

// The Roadmap merges the old "Action plan" (gap analysis) and "Timeline" into a
// single, runway-aware story: how much time you have → what that means → a
// phased, date-anchored plan built from it.
export function RoadmapView() {
  const t = useT();
  const { analysis, profileMeta, basePath, liveDates } = useDashboard();

  // "today" depends on the visitor's clock, so resolve it on the client to avoid
  // a hydration mismatch. Until then, render nothing date-dependent.
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => setToday(new Date()), []);

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
  const uniq = (a: string[]) => [...new Set(a.filter(Boolean))];
  const targets = analysis
    ? COUNTRY_CONTENT.map((c) => ({
        code: c.code,
        universities: uniq(c.universities(analysis)),
      })).filter((t) => t.universities.length > 0)
    : [];

  const roadmap = today
    ? buildRoadmap({
        today,
        graduationYear: profileMeta.graduationYear,
        faculties: profileMeta.faculties,
        satScore: profileMeta.satScore,
        homeCountry: profileMeta.homeCountry,
        targets,
        planActions: analysis?.timeline ?? [],
        liveSatSittings: liveDates.satSittings,
        liveCompetitions: liveDates.competitions,
      })
    : null;

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("report.roadmapTitle")}
        hint={t("report.roadmapHint")}
      />

      {roadmap ? (
        <RoadmapHeader roadmap={roadmap} today={today!} basePath={basePath} />
      ) : (
        <div className="h-28 animate-pulse rounded-2xl border border-line bg-card" />
      )}

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
        <RoadmapPhases roadmap={roadmap} />
      ) : (
        <div className="h-40 animate-pulse rounded-2xl border border-line bg-card" />
      )}

      <p className="text-center text-xs text-ink-faint">
        Dates are indicative — always confirm on the official site before you
        rely on them.
      </p>
    </div>
  );
}

const REGIME_ACCENT: Record<Regime, string> = {
  building: "bg-likely-soft text-likely-ink",
  focusing: "bg-accent-soft text-accent-ink",
  sprinting: "bg-target-soft text-target-ink",
  submitting: "bg-reach-soft text-reach-ink",
  unknown: "bg-surface text-ink-soft",
};

function RoadmapHeader({
  roadmap,
  today,
  basePath,
}: {
  roadmap: Roadmap;
  today: Date;
  basePath: string;
}) {
  const accent = REGIME_ACCENT[roadmap.regime];
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-ink">{roadmap.headline}</h2>
        {roadmap.cycleLabel && (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${accent}`}
          >
            {roadmap.cycleLabel}
          </span>
        )}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        {roadmap.subhead}
      </p>

      {roadmap.operativeDeadlineISO ? (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
          <span className="min-w-0 text-sm font-medium text-ink">
            {roadmap.operativeDeadlineLabel} deadline
            {roadmap.deadlines.length > 1 && (
              <span className="mt-0.5 block text-xs font-normal text-ink-faint">
                Your soonest of {roadmap.deadlines.length} — the rest are on the
                plan below
              </span>
            )}
          </span>
          <span className="flex shrink-0 items-center gap-3 text-sm">
            <span data-num className="tabular-nums text-ink-soft">
              {formatDate(roadmap.operativeDeadlineISO)}
            </span>
            {roadmap.runwayDays != null && (
              <Countdown days={roadmap.runwayDays} />
            )}
          </span>
        </div>
      ) : roadmap.hasGraduationYear ? (
        <p className="mt-4 rounded-xl border border-line px-4 py-3 text-sm text-ink-soft">
          We don&rsquo;t have a to-the-day deadline we can stand behind for your
          current target schools — they admit on rolling or per-programme
          timelines. See{" "}
          <span className="font-medium text-ink">Confirm these dates</span>{" "}
          below and check each official page.
        </p>
      ) : (
        <p className="mt-4 rounded-xl border border-line px-4 py-3 text-sm text-ink-soft">
          <span className="font-medium text-ink">Add your graduation year</span>{" "}
          to anchor this plan to your deadlines.{" "}
          <a
            href={basePath === "/demo" ? "#" : "/onboarding"}
            className="font-medium text-accent-ink hover:underline"
          >
            Update profile
          </a>
        </p>
      )}
    </Card>
  );
}

function RoadmapPhases({ roadmap }: { roadmap: Roadmap }) {
  return (
    <div className="space-y-4">
      {roadmap.phases.map((p) => (
        <PhaseCard key={p.id} phase={p} />
      ))}

      {roadmap.unconfirmedDeadlines.length > 0 && (
        <Card>
          <h3 className="flex items-center gap-2 text-base font-semibold text-ink">
            <InfoIcon /> Confirm these dates yourself
          </h3>
          <p className="mt-1 text-sm text-ink-soft">
            We only show a countdown for deadlines we verified against the
            official page. For these schools the date is rolling, set per
            programme, or not yet published — open each official page and
            confirm before you rely on it.
          </p>
          <ul className="mt-4 space-y-2.5">
            {roadmap.unconfirmedDeadlines.map((a, i) => (
              <ActionRow key={i} action={a} />
            ))}
          </ul>
        </Card>
      )}

      {roadmap.deferred.length > 0 && (
        <Card>
          <h3 className="flex items-center gap-2 text-base font-semibold text-ink">
            <ClockIcon /> Beyond this cycle
          </h3>
          <p className="mt-1 text-sm text-ink-soft">
            High-value profile moves that need more runway than you have before
            this deadline — worth it for a next round or a gap year, not this
            one.
          </p>
          <ul className="mt-4 space-y-2.5">
            {roadmap.deferred.map((a, i) => (
              <ActionRow key={i} action={a} muted />
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

const URGENCY_DOT: Record<RoadmapPhase["urgency"], string> = {
  now: "bg-reach",
  soon: "bg-target",
  later: "bg-likely",
};

function PhaseCard({ phase }: { phase: RoadmapPhase }) {
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-base font-semibold text-ink">
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${URGENCY_DOT[phase.urgency]}`}
            aria-hidden
          />
          {phase.name}
        </h3>
        <span
          data-num
          className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium tabular-nums text-ink-soft"
        >
          {phase.rangeLabel}
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        {phase.focus}
      </p>

      {phase.actions.length > 0 ? (
        <ul className="mt-4 space-y-2.5">
          {phase.actions.map((a, i) => (
            <ActionRow key={i} action={a} />
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-ink-faint">
          Nothing scheduled here yet — the levers above feed into the phases
          with dated deadlines.
        </p>
      )}
    </Card>
  );
}

const SOURCE_ICON: Record<RoadmapAction["source"], React.ReactNode> = {
  sat: <PencilIcon />,
  competition: <TrophyIcon />,
  profile: <SparkIcon />,
  note: <InfoIcon />,
};

function ActionRow({
  action,
  muted,
}: {
  action: RoadmapAction;
  muted?: boolean;
}) {
  return (
    <li
      className={`flex flex-wrap items-start justify-between gap-x-4 gap-y-2 rounded-xl border border-line px-4 py-3 ${
        muted ? "opacity-80" : ""
      }`}
    >
      <div className="flex min-w-0 gap-3">
        <span className="mt-0.5 shrink-0 text-ink-faint">
          {SOURCE_ICON[action.source]}
        </span>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
            {action.text}
            {action.tag && (
              <span className="rounded-full bg-target-soft px-2 py-0.5 text-[11px] font-semibold text-target-ink">
                {action.tag}
              </span>
            )}
          </p>
          {action.why && (
            <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
              {action.why}
            </p>
          )}
        </div>
      </div>
      {(action.daysLeft != null || action.url) && (
        <div className="flex shrink-0 items-center gap-3">
          {action.daysLeft != null && <Countdown days={action.daysLeft} />}
          {action.url && (
            <a
              href={action.url}
              target="_blank"
              rel="noreferrer"
              className="whitespace-nowrap rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-ink/30 hover:text-ink focus-visible:focus-ring"
            >
              Open ↗
            </a>
          )}
        </div>
      )}
    </li>
  );
}

/** Days-left pill, colored by urgency. */
function Countdown({ days }: { days: number }) {
  const tone =
    days <= 14
      ? "bg-reach-soft text-reach-ink"
      : days <= 30
        ? "bg-target-soft text-target-ink"
        : "bg-likely-soft text-likely-ink";
  const text =
    days <= 0 ? "due today" : days === 1 ? "1 day left" : `${days} days left`;
  return (
    <span
      data-num
      className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${tone}`}
    >
      {text}
    </span>
  );
}

function PencilIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      className="h-5 w-5 text-ink-faint"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
