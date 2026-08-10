"use client";

import { useState } from "react";
import { formatDate } from "@/lib/data/opportunity-format";
import type {
  CompetitionCategory,
  CompetitionTier,
  Opportunity,
} from "@/lib/data/key-dates";
import { regionLabel } from "@/lib/data/geo";
import { downloadIcs } from "@/lib/calendar/ics";
import { PartnerBadge } from "@/components/partners/PartnerBadge";
import { CostPill, OpportunityDetail } from "./OpportunityDetail";

// ONE opportunity card, used by both surfaces that show opportunities: the
// dashboard view and the public eligibility checker.
//
// It was two cards before — the same competition rendered with different chips,
// a different eligibility line and a different way into the detail panel
// depending on which page you were on. Two implementations of one object drift
// apart by definition, and a student who checks the public page and then signs
// in should not have to re-learn the layout.
//
// The only thing that varies is density:
//   • "comfortable" — the public page and anywhere a card stands on its own.
//   • "compact"     — long dashboard lists, where forty of these stack up.
// Same structure, same order, same words. Just tighter.

export type CardDensity = "comfortable" | "compact";

const TIER_LABEL: Record<CompetitionTier, string> = {
  accessible: "Good first one",
  selective: "Step up",
  elite: "The big one",
};

const CATEGORY_LABEL: Record<CompetitionCategory, string> = {
  olympiad: "Olympiad",
  competition: "Competition",
  course: "Course",
  research_program: "Research",
  summer_program: "Summer program",
};

export function OpportunityCard({
  o,
  density = "comfortable",
  footer,
}: {
  o: Opportunity;
  density?: CardDensity;
  /** Extra row under the card — the dashboard's commitment step lives here. */
  footer?: React.ReactNode;
}) {
  const [detail, setDetail] = useState(false);
  const compact = density === "compact";

  return (
    <article
      className={
        compact
          ? "rounded-xl border border-line bg-card px-4 py-3 transition-colors duration-200 hover:border-ink/20"
          : "rounded-2xl border border-line bg-card p-5 shadow-card transition-shadow duration-200 hover:shadow-lift"
      }
    >
      {detail && <OpportunityDetail o={o} onClose={() => setDetail(false)} />}

      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1">
          {/* The name is the way in — tapping the thing you are reading about
              is what everyone tries first. */}
          <h3
            className={
              compact
                ? "text-sm font-semibold leading-snug text-ink"
                : "text-lg font-semibold leading-snug text-ink"
            }
          >
            <button
              type="button"
              onClick={() => setDetail(true)}
              className="text-left underline-offset-2 transition-colors hover:text-accent-ink hover:underline focus-visible:focus-ring"
            >
              {o.name}
            </button>
          </h3>

          {/* Who posted it, when that is an organisation rather than us. It
              sits directly under the name, above the chips: for a Kazakh
              student "Astana Hub posted this" is the single most load-bearing
              fact on the card, and it is worth more than any tier label. */}
          {o.partner && (
            <PartnerBadge
              partner={o.partner}
              size={compact ? "sm" : "md"}
              className="mt-1.5"
            />
          )}

          {/* Chips, in one fixed order everywhere: money first — it is the
              thing people get burned by — then how hard, then what kind. */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <CostPill o={o} />
            <Chip>{TIER_LABEL[o.tierResolved]}</Chip>
            <Chip>{CATEGORY_LABEL[o.categoryResolved]}</Chip>
            {o.region && (
              // Local opportunity — only ever shown to students from that
              // country, so this reads as "near you", not as a restriction.
              <Chip tone="accent">Local · {o.city ?? regionLabel(o.region)}</Chip>
            )}
            {o.notYetEligible && (
              // Kept on purpose: a younger student should see what to aim for.
              // It just can never be presented as "do this now".
              <Chip>Eligible {o.notYetEligible}</Chip>
            )}
            {o.viaNationalSelection && <Chip>Via national selection</Chip>}
          </div>

          <p
            className={
              compact
                ? "mt-2 text-xs leading-relaxed text-ink-soft"
                : "mt-2.5 text-[0.95rem] leading-relaxed text-ink-soft"
            }
          >
            {o.blurb}
          </p>

          {/* Who can enter — on EVERY card, so a younger student never spends a
              cycle on something they cannot join. */}
          <p
            className={`mt-1.5 flex items-start gap-1.5 ${
              compact ? "text-xs" : "text-sm"
            } text-ink-soft`}
          >
            <PersonIcon />
            <span>
              <span className="font-medium text-ink">Eligibility:</span>{" "}
              {o.eligibility ??
                "varies — check the age and grade rules on the official page"}
            </span>
          </p>

          <p className={`mt-1 ${compact ? "text-xs" : "text-sm"} text-ink-faint`}>
            {o.dateConfirmed ? (
              <>
                Deadline{" "}
                <span data-num className="tabular-nums">
                  {formatDate(o.deadline)}
                </span>{" "}
                · {o.window}
              </>
            ) : o.alwaysOpen ? (
              // Nothing to announce and nothing to miss — say what is true.
              <>{o.window}</>
            ) : (
              // We never show a countdown for a date we cannot stand behind: a
              // wrong one could make a student miss a real deadline.
              <>Dates for the next cycle not announced — typically {o.window}</>
            )}
          </p>
        </div>

        <div className="shrink-0">
          {o.dateConfirmed ? (
            <Countdown days={o.daysToDeadline} compact={compact} />
          ) : o.alwaysOpen ? (
            <OpenNowPill compact={compact} />
          ) : (
            <TbaPill compact={compact} />
          )}
        </div>
      </div>

      {/* Actions, same three in the same order on both surfaces. "Details"
          opens OUR panel (what it is, who it's for, what it costs) rather than
          dropping a twelve-year-old on an organiser's homepage to work it out. */}
      <div
        className={`flex flex-wrap items-center gap-2 border-t border-line ${
          compact ? "mt-3 pt-3" : "mt-4 pt-4 gap-2.5"
        }`}
      >
        <button
          type="button"
          onClick={() => setDetail(true)}
          className={
            compact
              ? "inline-flex h-9 items-center rounded-lg bg-ink px-3 text-xs font-medium text-surface transition-colors hover:bg-ink/90 focus-visible:focus-ring"
              : "inline-flex h-11 items-center rounded-xl bg-ink px-4 text-sm font-medium text-surface transition-colors hover:bg-ink/90 focus-visible:focus-ring"
          }
        >
          What it is, and what it costs
        </button>
        <a
          href={o.url}
          target="_blank"
          rel="noreferrer"
          className={secondaryCls(compact)}
        >
          Official page ↗
        </a>
        {/* The calendar file is the single highest-leverage action on the
            public page, so it sits right on the card there. In a compact
            dashboard list it would be the third button on forty rows — it
            lives in the detail panel (and in the commitment step) instead. */}
        {o.dateConfirmed && !compact && (
          <button
            type="button"
            onClick={() => downloadIcs([o])}
            className={secondaryCls(compact)}
          >
            Add the deadline to my calendar
          </button>
        )}
      </div>

      {footer}
    </article>
  );
}

function secondaryCls(compact: boolean) {
  return compact
    ? "inline-flex h-9 items-center rounded-lg border border-line px-3 text-xs font-medium text-ink-soft transition-colors hover:border-ink/25 hover:text-ink focus-visible:focus-ring"
    : "inline-flex h-11 items-center rounded-xl border border-line bg-card px-4 text-sm font-medium text-ink-soft transition-colors hover:border-ink/25 hover:text-ink focus-visible:focus-ring";
}

function Chip({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "accent";
}) {
  return (
    <span
      className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        tone === "accent"
          ? "bg-accent-soft text-accent-ink"
          : "bg-surface text-ink-soft"
      }`}
    >
      {children}
    </span>
  );
}

/** Days-left pill, coloured by urgency. The text says what the colour says. */
export function Countdown({
  days,
  compact = false,
}: {
  days: number;
  compact?: boolean;
}) {
  const tone =
    days <= 14
      ? "bg-reach-soft text-reach-ink"
      : days <= 30
        ? "bg-target-soft text-target-ink"
        : "bg-likely-soft text-likely-ink";
  const text = days <= 0 ? "closes today" : days === 1 ? "1 day left" : `${days} days left`;
  return (
    <span
      data-num
      className={`whitespace-nowrap rounded-full font-semibold tabular-nums ${tone} ${
        compact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"
      }`}
    >
      {text}
    </span>
  );
}

/**
 * For the rows with no deadline at all. It reads as the positive it is: these
 * are the only things on the list a student can act on the same evening.
 */
export function OpenNowPill({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`whitespace-nowrap rounded-full bg-likely-soft font-semibold text-likely-ink ${
        compact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"
      }`}
    >
      Open now
    </span>
  );
}

/** Neutral pill for opportunities whose next-cycle date isn't published yet. */
export function TbaPill({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`whitespace-nowrap rounded-full bg-surface font-semibold text-ink-faint ${
        compact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"
      }`}
    >
      Dates TBA
    </span>
  );
}

function PersonIcon() {
  return (
    <svg
      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-faint"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M5 21c0-3.9 3.1-7 7-7s7 3.1 7 7" />
    </svg>
  );
}
