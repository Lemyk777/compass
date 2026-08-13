"use client";

import type { PlannerItem, PlannerMonth } from "@/lib/data/planner";
import { PlannerCard } from "@/components/planner/PlannerCard";
import { EmptyPlanner } from "@/components/planner/EmptyPlanner";
import { MonthGrid } from "@/components/planner/MonthGrid";

// Everything with a date, soonest first.
//
// This is the planner's default view, not the board, and the reason is worth
// keeping: a student with two commitments sees a full list here — their
// deadlines, the SAT cutoffs, the phase they are in — and a nearly empty board.
// Both are the same truth. Only one of them reads as a working product on the
// day someone first opens it.
export function PlannerAgenda({
  months,
  overdue,
  undated,
  suggestions,
}: {
  months: PlannerMonth[];
  overdue: PlannerItem[];
  undated: PlannerItem[];
  suggestions: { id: string; name: string; deadline: string }[];
}) {
  if (months.length === 0 && overdue.length === 0 && undated.length === 0) {
    return <EmptyPlanner suggestions={suggestions} />;
  }

  return (
    <div className="space-y-8">
      {overdue.length > 0 && (
        <section aria-labelledby="planner-overdue" className="space-y-3">
          <h2 id="planner-overdue" className="text-sm font-semibold text-reach-ink">
            Already closed
          </h2>
          <p className="max-w-[60ch] text-xs leading-relaxed text-ink-soft">
            These have passed. If you entered one, move it to done — and if you didn&rsquo;t,
            that is information too, not a verdict.
          </p>
          <CardGrid items={overdue} />
        </section>
      )}

      {months.map((m) => (
        <section key={m.key} aria-labelledby={`planner-month-${m.key}`} className="space-y-3">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-line pb-2">
            <h2 id={`planner-month-${m.key}`} className="text-sm font-semibold text-ink">
              {m.label}
            </h2>
            {/* Phases are separators, never cards. A phase is a period: it has
                no single date and cannot be moved, and a card nobody can move is
                what breaks a board. */}
            {m.phases.map((p) => (
              <span key={p.id} className="text-xs text-ink-faint">
                {p.name} &middot; {p.rangeLabel}
              </span>
            ))}
          </div>

          <MonthGrid monthKey={m.key} items={m.items} />
          <CardGrid items={m.items} />
        </section>
      ))}

      {undated.length > 0 && (
        <section aria-labelledby="planner-undated" className="space-y-3">
          <h2 id="planner-undated" className="text-sm font-semibold text-ink">
            Dates not announced yet
          </h2>
          <p className="max-w-[60ch] text-xs leading-relaxed text-ink-soft">
            We haven&rsquo;t been able to confirm a date for these against the
            organiser&rsquo;s own page — so we are not going to put one on a calendar and
            let you plan around it.
          </p>
          <CardGrid items={undated} />
        </section>
      )}
    </div>
  );
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
