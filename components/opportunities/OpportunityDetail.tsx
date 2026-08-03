"use client";

import { useEffect, useRef } from "react";
import {
  formatDate,
  opportunityCost,
  type CompetitionCategory,
  type CompetitionTier,
  type CostTone,
  type Opportunity,
} from "@/lib/data/key-dates";
import { FACULTY_LABEL, type FacultyValue } from "@/lib/data/faculties";
import { regionLabel } from "@/lib/data/geo";
import { downloadIcs } from "@/lib/calendar/ics";

// The detail panel behind every opportunity card.
//
// A card can only carry a name and one line. The questions a student actually
// has before they spend a summer on something are: what is this, who runs it,
// am I allowed in, why would it be worth my time — and what does it COST.
//
// Cost comes first in this panel, on purpose. The catalog is full of things
// advertised as free that end at a paywalled certificate, and a student who
// finds that out at the end doesn't conclude "Coursera charges for
// certificates", they conclude we lied to them. So the money is stated before
// the pitch, in the student's favour: what is free, what is not, and where the
// aid is. Anything we could not verify says exactly that — we never let silence
// imply "free".

const TONE: Record<CostTone, { panel: string; pill: string; icon: string }> = {
  free: {
    panel: "border-ivy/30 bg-ivy-soft/50",
    pill: "bg-likely-soft text-[#2C6B4D]",
    icon: "text-ivy",
  },
  partial: {
    panel: "border-target/30 bg-target-soft/60",
    pill: "bg-target-soft text-target",
    icon: "text-target",
  },
  paid: {
    panel: "border-reach/30 bg-reach-soft/50",
    pill: "bg-reach-soft text-reach",
    icon: "text-reach",
  },
  unknown: {
    panel: "border-line bg-surface",
    pill: "bg-surface text-ink-soft",
    icon: "text-ink-faint",
  },
};

const CATEGORY_LABEL: Record<CompetitionCategory, string> = {
  olympiad: "Olympiad",
  competition: "Competition",
  course: "Course",
  research_program: "Research program",
  summer_program: "Summer program",
};

/**
 * Why this kind of thing is worth doing — derived from category and tier rather
 * than written 148 times. A student reading a card asks "why would I bother",
 * and the honest answer is the same for every course, and a different same for
 * every elite olympiad.
 */
const CATEGORY_WHY: Record<CompetitionCategory, string> = {
  course:
    "Finishing a real course from a name a university recognises shows you can teach yourself — which is most of what studying abroad actually demands. What carries weight is not the enrolment but what you build with it afterwards: a project, a club you start, a younger student you teach.",
  olympiad:
    "Olympiads are the clearest evidence there is: a ranked result against a known field, verifiable by anyone. One good placing says more about your subject ability than any number of listed activities.",
  competition:
    "A competition gives you something admissions can check — a placing, a published entry, a judged project — and something to write about, which is often the harder half of an application.",
  research_program:
    "Research is the one activity that shows you can work on a question nobody has answered yet. A finished paper, mentor and result is a rare thing to hold at eighteen.",
  summer_program:
    "A selective summer program puts you in a room with people who work in the field, and gives you a reference from someone whose name means something. It is also the closest preview of what university study feels like.",
};

const TIER_WHY: Record<CompetitionTier, string> = {
  accessible:
    "This one is an entry point: the value is in starting and finishing something, not in the prestige.",
  selective:
    "National-calibre — a result here is a genuine differentiator on an application.",
  elite:
    "One of the flagship names in its field. A result here is the kind of single line that changes how an application reads.",
};

export function OpportunityDetail({
  o,
  onClose,
}: {
  o: Opportunity;
  onClose: () => void;
}) {
  const cost = opportunityCost(o);
  const tone = TONE[cost.tone];
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape closes; the panel takes focus so a keyboard user lands inside it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Who runs it, read off the official URL — never invented.
  let host = "";
  try {
    host = new URL(o.url).hostname.replace(/^www\./, "");
  } catch {
    host = o.url;
  }

  const subjects =
    o.fields === "all"
      ? "Any subject — useful whatever you end up studying"
      : (o.fields as FacultyValue[])
          .map((f) => FACULTY_LABEL[f] ?? f)
          .join(" · ");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="opportunity-detail-title"
      onMouseDown={(e) => {
        // Backdrop click closes; a drag that ends on the backdrop does not.
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-t-2xl border border-line bg-card shadow-card outline-none animate-in fade-in zoom-in-95 duration-200 sm:max-h-[88vh] sm:rounded-2xl"
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2
              id="opportunity-detail-title"
              className="text-pretty text-lg font-semibold leading-snug text-ink"
            >
              {o.name}
            </h2>
            <p className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Badge className="bg-surface text-ink-soft">
                {CATEGORY_LABEL[o.categoryResolved]}
              </Badge>
              <Badge className="bg-surface text-ink-soft">
                {o.tierResolved === "accessible"
                  ? "Good first one"
                  : o.tierResolved === "selective"
                    ? "Selective"
                    : "Elite"}
              </Badge>
              {o.region && (
                <Badge className="bg-accent-soft text-accent-ink">
                  Local · {o.city ?? regionLabel(o.region)}
                </Badge>
              )}
              {o.viaNationalSelection && (
                <Badge className="bg-surface text-ink-faint">
                  Via national selection
                </Badge>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-xl text-ink-soft transition-colors hover:text-ink focus-visible:focus-ring"
          >
            ×
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
          {/* Cost first — the thing people get burned by. */}
          <section className={`rounded-xl border p-4 ${tone.panel}`}>
            <p className="flex flex-wrap items-center gap-2">
              <WalletIcon className={tone.icon} />
              <span className="text-sm font-semibold text-ink">{cost.label}</span>
            </p>
            <p className="mt-2 text-pretty text-sm leading-relaxed text-ink-soft">
              {cost.detail}
            </p>
            <p className="mt-2 text-xs text-ink-faint">
              {cost.tone === "free"
                ? "Free as of our last check — if that ever changes, the official page is the truth."
                : "Prices change between cycles — always confirm on the official page before you pay for anything."}
            </p>
          </section>

          <Section title="What it is">
            <p>{o.blurb}</p>
            <p className="mt-1.5 text-ink-faint">Run by {host}</p>
          </Section>

          <Section title="Who it's for">
            <p>
              {o.eligibility ??
                "The organiser's age and grade rules are on the official page — check them before you apply."}
            </p>
            <p className="mt-1.5 text-ink-faint">{subjects}</p>
            {o.notYetEligible && (
              <p className="mt-2 rounded-lg bg-surface px-3 py-2 text-ink-soft">
                You are not old enough for this one yet — you become eligible{" "}
                <span className="font-medium text-ink">{o.notYetEligible}</span>.
                It is here so you know what to aim at.
              </p>
            )}
          </Section>

          <Section title="Why it's worth it">
            <p>{CATEGORY_WHY[o.categoryResolved]}</p>
            <p className="mt-1.5 text-ink-faint">{TIER_WHY[o.tierResolved]}</p>
          </Section>

          <Section
            title={o.categoryResolved === "course" ? "When you can start" : "When"}
          >
            {/* A self-paced course has no cycle to miss, so the "dates not
                announced" line below would be nonsense for one. */}
            {!o.dateConfirmed && o.categoryResolved === "course" ? (
              <p>
                {o.window}. There is no deadline to miss — which is exactly why
                most people never finish one. Pick the day you start and the
                slot you keep each week.
              </p>
            ) : o.dateConfirmed ? (
              <p>
                Deadline{" "}
                <span data-num className="font-medium tabular-nums text-ink">
                  {formatDate(o.deadline)}
                </span>{" "}
                ·{" "}
                {o.daysToDeadline <= 0
                  ? "closes today"
                  : `${o.daysToDeadline} days left`}
                . {o.window}.
              </p>
            ) : (
              <p>
                Dates for the next cycle are not announced yet — it typically
                runs: {o.window}. We only show a countdown for a date we can
                stand behind.
              </p>
            )}
          </Section>
        </div>

        {/* ── Actions ────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2.5 border-t border-line px-5 py-4 sm:px-6">
          <a
            href={o.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center rounded-xl bg-ink px-4 text-sm font-medium text-white transition-colors hover:bg-ink/90 focus-visible:focus-ring"
          >
            Open the official page ↗
          </a>
          {o.dateConfirmed && (
            <button
              type="button"
              onClick={() => downloadIcs([o])}
              className="inline-flex h-11 items-center rounded-xl border border-line bg-card px-4 text-sm font-medium text-ink-soft transition-colors hover:border-ink/25 hover:text-ink focus-visible:focus-ring"
            >
              Add the deadline to my calendar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * The cost badge for a card in a list — the same verdict as the panel, short
 * enough to sit next to a name. It is on the card and not only in the panel so
 * that "this costs money" is never something you have to click to discover.
 */
export function CostPill({
  o,
  className = "",
}: {
  o: Opportunity;
  className?: string;
}) {
  const cost = opportunityCost(o);
  return (
    <span
      className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        TONE[cost.tone].pill
      } ${className}`}
    >
      {cost.short}
    </span>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {title}
      </h3>
      <div className="mt-1.5 text-pretty text-sm leading-relaxed text-ink-soft">
        {children}
      </div>
    </section>
  );
}

function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${className}`}
    >
      {children}
    </span>
  );
}

function WalletIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18a2 2 0 0 1 2 2v1" />
      <path d="M3 7.5V17a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" />
      <path d="M21 11h-4a2 2 0 0 0 0 4h4z" />
    </svg>
  );
}
