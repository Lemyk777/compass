"use client";

import { useRef } from "react";
import type { PlannerItem, PlannerMonth } from "@/lib/data/planner";
import { PlannerCard } from "@/components/planner/PlannerCard";
import { MonthGrid } from "@/components/planner/MonthGrid";
import { PeriodStepper } from "@/components/planner/PeriodStepper";

// Everything with a date — one period at a time.
//
// This is the planner's default lens, not the board, and the reason is worth
// keeping: a student with two commitments sees a full list here — their
// deadlines, the SAT cutoffs, the phase they are in — and a nearly empty board.
// Both are the same truth. Only one of them reads as a working product on the
// day someone first opens it.
//
// It used to render EVERY month it knew about down the page, which turned "what
// is next" into a scrolling exercise and made the answer's position depend on
// how much the student had committed to. It is a window, stepped with arrows.
//
// **The period index lives in `PlannerWindow`, not here.** That is what makes
// stepping to March, glancing at the board and coming back land you in March
// again — this component is a renderer, and the window is what holds the state
// the lenses share.
//
// **Overdue and undated are not steps, and that is not an oversight.** A period
// is a stretch of time; "already closed" and "no date announced" are not. They
// are the frame around the window — always visible, never in the sequence —
// which is the same rule that keeps roadmap phases as separators rather than
// cards, and the same reason `dueISO` is null for a date we cannot stand behind.
export function PlannerAgenda({
  months,
  overdue,
  undated,
  index,
  homeIndex,
  onStep,
  onHome,
}: {
  months: PlannerMonth[];
  overdue: PlannerItem[];
  undated: PlannerItem[];
  index: number;
  homeIndex: number;
  onStep: (delta: number) => void;
  onHome: () => void;
}) {
  // Which way the student just travelled, so the incoming period enters from
  // the side it came from. Held in a ref rather than state: it is derived from
  // a render, and putting it in state would render twice to say the same thing.
  const previous = useRef(index);
  const forward = index >= previous.current;
  previous.current = index;

  const month = months[Math.min(index, months.length - 1)];

  return (
    <div className="space-y-5">
      {/* The frame — above the window because a closed deadline is the one
          thing a student should not have to go looking for. */}
      {overdue.length > 0 && (
        <Frame
          tone="warn"
          title={`${overdue.length} already closed`}
          note="If you entered one, move it to done — and if you didn't, that is information too, not a verdict."
          items={overdue}
        />
      )}

      {months.length > 0 && month ? (
        <section aria-labelledby="planner-period" className="space-y-4">
          <PeriodStepper
            label={month.label}
            sub={periodSummary(month)}
            index={index}
            count={months.length}
            atHome={index === homeIndex}
            onStep={onStep}
            onHome={onHome}
          />
          <h2 id="planner-period" className="sr-only">
            {month.label}
          </h2>

          {/* Remounted per period so the entrance replays, and it enters from
              the direction of travel — which is the one thing an arrow control
              can say that a fade cannot: *which way you just went*. The global
              reduced-motion guard zeroes it. */}
          <div
            key={month.key}
            className={forward ? "period-in-forward" : "period-in-back"}
          >
            {/* Phases are separators, never cards. A phase is a PERIOD: it has
                no single date and cannot be moved, and a card nobody can move is
                what breaks a board. */}
            {month.phases.length > 0 && (
              <ul className="mb-4 flex flex-wrap gap-2">
                {month.phases.map((p) => (
                  <li
                    key={p.id}
                    className="inline-flex items-center rounded-full border border-line bg-surface px-3 py-1 text-[0.8125rem] text-ink-soft"
                  >
                    <span className="font-medium text-ink">{p.name}</span>
                    <span className="ml-1.5 text-ink-faint">{p.rangeLabel}</span>
                  </li>
                ))}
              </ul>
            )}

            {month.items.length > 0 ? (
              <div className="space-y-4">
                <MonthGrid monthKey={month.key} items={month.items} />
                <CardGrid items={month.items} />
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-line px-5 py-8 text-center text-sm text-ink-soft">
                Nothing dated in {month.label}. Step forward, or add something of
                your own on the board.
              </p>
            )}
          </div>
        </section>
      ) : (
        // Nothing dated at all, but the plan is not empty — they are carrying
        // things whose dates nobody has announced, or tasks of their own with no
        // date. Said plainly rather than drawn as an empty calendar.
        overdue.length === 0 && (
          <p className="rounded-2xl border border-dashed border-line px-5 py-8 text-center text-sm text-ink-soft">
            Nothing you&rsquo;re carrying has a date we can stand behind yet, so
            there is no calendar to show. Everything you have is on the board.
          </p>
        )
      )}

      {undated.length > 0 && (
        <Frame
          tone="quiet"
          title={`${undated.length} with no date announced`}
          note="We haven't been able to confirm a date for these against the organiser's own page — so we are not going to put one on a calendar and let you plan around it."
          items={undated}
        />
      )}
    </div>
  );
}

/**
 * The two things that are not periods. Collapsed by default so they frame the
 * window rather than compete with it, and openable in place so nothing about
 * them requires leaving the view.
 */
function Frame({
  tone,
  title,
  note,
  items,
}: {
  tone: "warn" | "quiet";
  title: string;
  note: string;
  items: PlannerItem[];
}) {
  return (
    <details className="group rounded-2xl border border-line bg-card">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 focus-visible:focus-ring sm:px-5">
        <span
          className={`text-sm font-semibold ${
            tone === "warn" ? "text-reach-ink" : "text-ink"
          }`}
        >
          {title}
        </span>
        <span
          aria-hidden="true"
          className="shrink-0 text-ink-faint transition-transform duration-200 group-open:rotate-90 motion-reduce:transition-none"
        >
          &rsaquo;
        </span>
      </summary>
      <div className="space-y-3 border-t border-line px-4 py-4 sm:px-5">
        <p className="max-w-[54ch] text-sm leading-relaxed text-ink-soft">
          {note}
        </p>
        <CardGrid items={items} />
      </div>
    </details>
  );
}

/** One line saying what is in this period, so the header answers before the cards do. */
function periodSummary(m: PlannerMonth): string {
  const n = m.items.length;
  if (n === 0) return "Nothing dated here yet.";
  const own = m.items.filter((i) => i.origin === "own").length;
  const parts = [`${n} ${n === 1 ? "thing" : "things"} dated`];
  if (own > 0) parts.push(`${own} of them yours`);
  return `${parts.join(" · ")}.`;
}

function CardGrid({ items }: { items: PlannerItem[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((i) => (
        <PlannerCard key={i.key} item={i} />
      ))}
    </div>
  );
}
