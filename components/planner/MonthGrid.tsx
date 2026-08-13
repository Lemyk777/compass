"use client";

import type { PlannerItem } from "@/lib/data/planner";

// A month, as a grid.
//
// Shown only from `lg`. The Shell rule is that width buys COLUMNS, and a
// seven-column grid at 375px gives each day about 45px — into which the name of
// an olympiad does not go. Below `lg` the agenda list beside it is the whole
// answer, and it is a better one.
//
// It takes `monthKey` rather than a Date because nothing in the planner's
// client components reads a clock: the day numbers have to be identical on the
// server and in the browser, and UTC arithmetic is what guarantees it.
export function MonthGrid({
  monthKey,
  items,
}: {
  monthKey: string;
  items: PlannerItem[];
}) {
  const [year, month] = monthKey.split("-").map(Number);
  const first = new Date(Date.UTC(year, month - 1, 1));
  // Day 0 of the next month is the last day of this one.
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  // Monday-first: getUTCDay() is 0 for Sunday.
  const lead = (first.getUTCDay() + 6) % 7;

  const byDay = new Map<number, PlannerItem[]>();
  for (const i of items) {
    if (!i.dueISO) continue;
    const day = Number(i.dueISO.slice(8, 10));
    byDay.set(day, [...(byDay.get(day) ?? []), i]);
  }

  const cells: (number | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, n) => n + 1),
  ];

  return (
    <div className="hidden lg:block">
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-line bg-line text-xs">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="bg-card px-2 py-1 font-medium text-ink-faint">
            {d}
          </div>
        ))}
        {cells.map((day, n) => (
          <div key={n} className="min-h-16 bg-card p-1.5">
            {day !== null && (
              <>
                <span data-num className="tabular-nums text-ink-faint">
                  {day}
                </span>
                {(byDay.get(day) ?? []).map((i) => (
                  <p
                    key={i.key}
                    title={i.title}
                    className="mt-1 truncate font-medium text-accent-ink"
                  >
                    {i.title}
                  </p>
                ))}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
