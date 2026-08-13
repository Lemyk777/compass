"use client";

import { useMemo, useState } from "react";
import { agendaHomeIndex } from "@/lib/data/planner";
import type { PlannerItem, PlannerMonth } from "@/lib/data/planner";
import { PlannerCard } from "@/components/planner/PlannerCard";
import { EmptyPlanner } from "@/components/planner/EmptyPlanner";
import { MonthGrid } from "@/components/planner/MonthGrid";
import { PeriodStepper } from "@/components/planner/PeriodStepper";

// Everything with a date — one period at a time.
//
// This is the planner's default view, not the board, and the reason is worth
// keeping: a student with two commitments sees a full list here — their
// deadlines, the SAT cutoffs, the phase they are in — and a nearly empty board.
// Both are the same truth. Only one of them reads as a working product on the
// day someone first opens it.
//
// It used to render EVERY month it knew about down the page, which turned "what
// is next" into a scrolling exercise and made the answer's position depend on
// how much the student had committed to. It is a window now, stepped with
// arrows. Same content, and the answer is always in the same place.
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
  suggestions,
  todayISO,
}: {
  months: PlannerMonth[];
  overdue: PlannerItem[];
  undated: PlannerItem[];
  suggestions: { id: string; name: string; deadline: string }[];
  /** Resolved on the server. No client component in the planner calls `new Date()`. */
  todayISO: string;
}) {
  // Pure, and in lib/data/planner.ts with the rest of the model — the planner’s
  // rules are testable or they are folklore.
  const homeIndex = useMemo(
    () => agendaHomeIndex(months, todayISO),
    [months, todayISO],
  );

  const [index, setIndex] = useState(homeIndex);

  if (months.length === 0 && overdue.length === 0 && undated.length === 0) {
    return <EmptyPlanner suggestions={suggestions} />;
  }

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

      {months.length > 0 && month && (
        <section aria-labelledby="planner-period" className="space-y-4">
          <PeriodStepper
            label={month.label}
            sub={periodSummary(month)}
            index={index}
            count={months.length}
            atHome={index === homeIndex}
            onStep={(d) =>
              setIndex((i) => Math.min(months.length - 1, Math.max(0, i + d)))
            }
            onHome={() => setIndex(homeIndex)}
          />
          <h2 id="planner-period" className="sr-only">
            {month.label}
          </h2>

          {/* Phases are separators, never cards. A phase is a PERIOD: it has no
              single date and cannot be moved, and a card nobody can move is what
              breaks a board. */}
          {month.phases.length > 0 && (
            <ul className="flex flex-wrap gap-2">
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
            <>
              <MonthGrid monthKey={month.key} items={month.items} />
              <CardGrid items={month.items} />
            </>
          ) : (
            <p className="rounded-2xl border border-dashed border-line px-5 py-8 text-center text-sm text-ink-soft">
              Nothing dated in {month.label}. Step forward, or add something of
              your own.
            </p>
          )}
        </section>
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
        <p className="max-w-[60ch] text-sm leading-relaxed text-ink-soft">
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
