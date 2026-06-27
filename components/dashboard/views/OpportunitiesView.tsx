"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/report/Section";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { NoAnalysisYet, PageHeader } from "@/components/dashboard/states";
import {
  buildExtracurriculars,
  formatDate,
  type CompetitionCategory,
  type CompetitionTier,
  type Opportunity,
  type OpportunityFit,
  type StrengthBand,
} from "@/lib/data/key-dates";

// The "Opportunities" section — OUR recommendations of what to enter next, not
// the student's own activities (the header makes that explicit). Founder's model:
// weak profiles see ACCESSIBLE events to build a record; strong profiles see only
// ELITE ones (they need one clean win, not more entries). The match is computed
// in buildExtracurriculars from the student's rubric factors.

const BAND_COPY: Record<
  StrengthBand,
  { label: string; tone: string; line: string }
> = {
  emerging: {
    label: "Building your record",
    tone: "bg-reach-soft text-reach",
    line: "Start with accessible, beginner-friendly events to get wins on the board. Volume and momentum matter more than prestige right now.",
  },
  developing: {
    label: "Gaining traction",
    tone: "bg-target-soft text-target",
    line: "You have a base — now step up to national-calibre competitions while keeping a couple of accessible wins for breadth.",
  },
  competitive: {
    label: "Sharpening your spike",
    tone: "bg-likely-soft text-[#2C6B4D]",
    line: "You're competitive. Focus on selective and elite events that produce a standout, verifiable result — depth over volume.",
  },
  elite: {
    label: "Chasing the headline win",
    tone: "bg-accent-soft text-accent-ink",
    line: "Your record is already strong. You don't need more entries — you need one elite, international-calibre win. Go all-in on the top tier.",
  },
};

const FIT_GROUPS: { fit: OpportunityFit; title: string; hint: string }[] = [
  {
    fit: "recommended",
    title: "Recommended for you",
    hint: "Matched to where you are now — prioritize these.",
  },
  {
    fit: "stretch",
    title: "Stretch goals",
    hint: "A level above — aim here once you've landed the recommended ones.",
  },
  {
    fit: "foundational",
    title: "Foundational",
    hint: "Easier entry points — useful for breadth, but likely below your level.",
  },
];

const TIER_BADGE: Record<CompetitionTier, { label: string; cls: string }> = {
  accessible: { label: "Accessible", cls: "bg-likely-soft text-[#2C6B4D]" },
  selective: { label: "Selective", cls: "bg-target-soft text-target" },
  elite: { label: "Elite", cls: "bg-accent-soft text-accent-ink" },
};

type CategoryFilter = "all" | CompetitionCategory;

export function OpportunitiesView() {
  const { analysis, profileMeta, liveDates } = useDashboard();

  // "today" depends on the visitor's clock — resolve on the client to avoid a
  // hydration mismatch (same pattern as the Timeline view).
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => setToday(new Date()), []);

  const [category, setCategory] = useState<CategoryFilter>("all");

  const plan = useMemo(() => {
    if (!today || !analysis) return null;
    return buildExtracurriculars({
      today,
      faculties: profileMeta.faculties,
      factors: analysis.factors,
      liveCompetitions: liveDates.competitions,
    });
  }, [today, analysis, profileMeta.faculties, liveDates.competitions]);

  if (!analysis) return <NoAnalysisYet />;

  const visible =
    plan?.items.filter(
      (o) => category === "all" || o.categoryResolved === category
    ) ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Opportunities"
        hint="Competitions and olympiads we recommend for you — matched to your field and strength. These are our suggestions to enter next, not your own activities."
      />

      {plan ? (
        <>
          <StrengthBanner band={plan.band} strength={plan.strength} />

          {plan.items.length > 0 ? (
            <>
              <CategoryTabs active={category} onChange={setCategory} />
              {FIT_GROUPS.map((g) => {
                const rows = visible.filter((o) => o.fit === g.fit);
                if (rows.length === 0) return null;
                return (
                  <FitSection
                    key={g.fit}
                    title={g.title}
                    hint={g.hint}
                    count={rows.length}
                    rows={rows}
                  />
                );
              })}
              <p className="text-center text-xs text-ink-faint">
                Dates are indicative — always confirm on the official site before
                you rely on them.
              </p>
            </>
          ) : (
            <Card>
              <p className="text-sm text-ink-soft">
                <span className="font-medium text-ink">
                  Add a field of study
                </span>{" "}
                in your profile to see competitions and olympiads matched to it.
              </p>
            </Card>
          )}
        </>
      ) : (
        <div className="h-40 animate-pulse rounded-2xl border border-line bg-card" />
      )}
    </div>
  );
}

function StrengthBanner({
  band,
  strength,
}: {
  band: StrengthBand;
  strength: number;
}) {
  const copy = BAND_COPY[band];
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3">
        <SparkIcon />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
            {copy.label}
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${copy.tone}`}
            >
              Extracurricular strength{" "}
              <span data-num className="tabular-nums">
                {strength.toFixed(1)}
              </span>
              /10
            </span>
          </p>
          <p className="mt-1 text-pretty text-sm leading-relaxed text-ink-soft">
            {copy.line}
          </p>
        </div>
      </div>
    </Card>
  );
}

function CategoryTabs({
  active,
  onChange,
}: {
  active: CategoryFilter;
  onChange: (c: CategoryFilter) => void;
}) {
  const tabs: { key: CategoryFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "olympiad", label: "Olympiads" },
    { key: "competition", label: "Competitions" },
  ];
  return (
    <div className="inline-flex rounded-xl border border-line bg-card p-1 shadow-card">
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <button
            key={t.key}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(t.key)}
            className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus-visible:focus-ring ${
              on ? "bg-accent text-white" : "text-ink-soft hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function FitSection({
  title,
  hint,
  count,
  rows,
}: {
  title: string;
  hint: string;
  count: number;
  rows: Opportunity[];
}) {
  return (
    <Card>
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
          {title}
          <span data-num className="text-xs font-normal text-ink-faint">
            ({count})
          </span>
        </h2>
        <p className="text-xs text-ink-faint">{hint}</p>
      </div>
      <ul className="mt-3 space-y-2.5">
        {rows.map((o) => (
          <OpportunityRow key={o.id} o={o} />
        ))}
      </ul>
    </Card>
  );
}

function OpportunityRow({ o }: { o: Opportunity }) {
  const tier = TIER_BADGE[o.tierResolved];
  return (
    <li className="rounded-xl border border-line px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
            {o.name}
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tier.cls}`}
            >
              {tier.label}
            </span>
            <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-faint">
              {o.categoryResolved === "olympiad" ? "Olympiad" : "Competition"}
            </span>
          </p>
          <p className="mt-0.5 text-xs text-ink-soft">{o.blurb}</p>
          {o.dateConfirmed ? (
            <p className="mt-1 text-xs text-ink-faint">
              Deadline{" "}
              <span data-num className="tabular-nums">
                {formatDate(o.deadline)}
              </span>{" "}
              · {o.window}
            </p>
          ) : (
            // We never show a countdown for a date we can't stand behind — a wrong
            // one could make a student miss a real deadline. Show the typical
            // timing as a hint and point them to the official site to confirm.
            <p className="mt-1 text-xs text-ink-faint">
              Dates for the next cycle not yet announced — typically {o.window}.
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {o.dateConfirmed ? <Countdown days={o.daysToDeadline} /> : <TbaPill />}
          <a
            href={o.url}
            target="_blank"
            rel="noreferrer"
            className="whitespace-nowrap rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-ink/30 hover:text-ink"
          >
            Details ↗
          </a>
        </div>
      </div>
    </li>
  );
}

/** Neutral pill for opportunities whose next-cycle date isn't published yet. */
function TbaPill() {
  return (
    <span className="whitespace-nowrap rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-ink-faint">
      Dates TBA
    </span>
  );
}

/** Days-left pill, colored by urgency (mirrors the Timeline countdown). */
function Countdown({ days }: { days: number }) {
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
    </span>
  );
}

function SparkIcon() {
  return (
    <svg
      className="h-6 w-6 shrink-0 text-accent"
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
