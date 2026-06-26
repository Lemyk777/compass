"use client";

import { useEffect, useState } from "react";
import { Timeline } from "@/components/report/Timeline";
import { Card } from "@/components/report/Section";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { NoAnalysisYet, PageHeader } from "@/components/dashboard/states";
import {
  buildStudyPlan,
  formatDate,
  SAT_REGISTER_URL,
  type StudyPlan,
} from "@/lib/data/key-dates";
import { useT } from "@/lib/i18n/client";

export function TimelineView() {
  const t = useT();
  const { analysis, profileMeta, basePath, liveDates } = useDashboard();

  // "today" depends on the visitor's clock, so resolve it on the client to avoid
  // a hydration mismatch. Until then, render nothing date-dependent.
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => setToday(new Date()), []);

  if (!analysis) return <NoAnalysisYet />;

  const plan = today
    ? buildStudyPlan({
        today,
        graduationYear: profileMeta.graduationYear,
        faculties: profileMeta.faculties,
        satScore: profileMeta.satScore,
        liveSatSittings: liveDates.satSittings,
        liveCompetitions: liveDates.competitions,
      })
    : null;

  return (
    <div className="space-y-5">
      <PageHeader title={t("report.timelineTitle")} hint={t("report.timelineHint")} />

      {plan ? (
        <DatedPlan plan={plan} basePath={basePath} />
      ) : (
        <div className="h-40 animate-pulse rounded-2xl border border-line bg-card" />
      )}

      {/* Qualitative, AI-written notes that tie the dates to this profile. */}
      {analysis.timeline.length > 0 && (
        <Card>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-faint">
            Personalized notes
          </h2>
          <Timeline blocks={analysis.timeline} />
        </Card>
      )}

      <p className="text-center text-xs text-ink-faint">
        Dates are indicative — always confirm on the official site before you rely
        on them.
      </p>
    </div>
  );
}

function DatedPlan({ plan, basePath }: { plan: StudyPlan; basePath: string }) {
  return (
    <div className="space-y-5">
      {/* Application window */}
      {plan.cycleLabel ? (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
              <FlagIcon /> Your application window
            </h2>
            <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent-ink">
              {plan.cycleLabel}
            </span>
          </div>
          {plan.deadlines.length > 0 && (
            <ul className="mt-4 space-y-2.5">
              {plan.deadlines.map((d) => (
                <li
                  key={d.label}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3"
                >
                  <span className="text-sm font-medium text-ink">{d.label}</span>
                  <span className="flex items-center gap-3 text-sm">
                    <span data-num className="tabular-nums text-ink-soft">
                      {formatDate(d.date)}
                    </span>
                    <Countdown days={d.daysLeft} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : (
        <Card>
          <p className="text-sm text-ink-soft">
            <span className="font-medium text-ink">
              Add your graduation year
            </span>{" "}
            to anchor these dates to your application deadlines.{" "}
            <a
              href={`${basePath === "/demo" ? "#" : "/onboarding"}`}
              className="font-medium text-accent hover:underline"
            >
              Update profile
            </a>
          </p>
        </Card>
      )}

      {/* SAT plan */}
      <Card>
        <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
          <PencilIcon /> SAT — next test dates
        </h2>
        {plan.satScore != null && (
          <p className="mt-1.5 text-sm text-ink-soft">
            Your current SAT is{" "}
            <span data-num className="font-semibold text-ink">
              {plan.satScore}
            </span>
            .{" "}
            {plan.satStrong
              ? "That's already competitive — another sitting is optional polish."
              : "Aim to lift it on one of the next sittings below."}
          </p>
        )}
        {plan.satSteps.length > 0 ? (
          <ul className="mt-4 space-y-2.5">
            {plan.satSteps.map((s) => (
              <li
                key={s.test}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border border-line px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
                    <span data-num className="tabular-nums">{formatDate(s.test)}</span>
                    {s.lastBeforeApps && (
                      <span className="rounded-full bg-target-soft px-2 py-0.5 text-[11px] font-semibold text-target">
                        Last sitting before Early deadline
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    Register by{" "}
                    <span data-num className="tabular-nums">{formatDate(s.regDeadline)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Countdown days={s.daysToDeadline} label="to register" />
                  <a
                    href={SAT_REGISTER_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="whitespace-nowrap rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-ink/30 hover:text-ink"
                  >
                    Register ↗
                  </a>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink-soft">
            No upcoming SAT registration windows in our calendar —{" "}
            <a
              href={SAT_REGISTER_URL}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-accent hover:underline"
            >
              check College Board
            </a>
            .
          </p>
        )}
      </Card>

      {/* Competitions for the student's field */}
      <Card>
        <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
          <TrophyIcon /> Competitions to enter for your field
        </h2>
        {plan.competitions.length > 0 ? (
          <ul className="mt-4 space-y-2.5">
            {plan.competitions.map((c) => (
              <li key={c.id} className="rounded-xl border border-line px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
                      {c.name}
                      <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-faint">
                        {c.level}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-ink-soft">{c.blurb}</p>
                    <p className="mt-1 text-xs text-ink-faint">
                      Deadline{" "}
                      <span data-num className="tabular-nums">{formatDate(c.deadline)}</span> ·{" "}
                      {c.window}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Countdown days={c.daysToDeadline} />
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      className="whitespace-nowrap rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-ink/30 hover:text-ink"
                    >
                      Details ↗
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink-soft">
            Pick a field of study in your profile to see competitions matched to it.
          </p>
        )}
      </Card>
    </div>
  );
}

/** Days-left pill, colored by urgency. */
function Countdown({ days, label }: { days: number; label?: string }) {
  const tone =
    days <= 14
      ? "bg-reach-soft text-reach"
      : days <= 30
        ? "bg-target-soft text-target"
        : "bg-likely-soft text-[#2C6B4D]";
  const text =
    days <= 0 ? "due today" : days === 1 ? "1 day left" : `${days} days left`;
  return (
    <span
      data-num
      className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${tone}`}
    >
      {text}
      {label && days > 0 ? ` ${label}` : ""}
    </span>
  );
}

function FlagIcon() {
  return (
    <svg className="h-5 w-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 21V4M4 4h13l-2 4 2 4H4" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg className="h-5 w-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg className="h-5 w-5 text-target" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
    </svg>
  );
}
