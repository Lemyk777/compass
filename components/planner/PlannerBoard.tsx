"use client";

import { useCallback, useState } from "react";
import { flushSync } from "react-dom";
import {
  PLANNER_COLUMNS,
  type PlannerColumn,
  type PlannerItem,
  type PlannerStatus,
} from "@/lib/data/planner";
import { PlannerCard } from "@/components/planner/PlannerCard";
import { AddTask } from "@/components/planner/AddTask";

const HEADINGS: Record<PlannerColumn, string> = {
  todo: "Not started",
  doing: "In progress",
  done: "Done",
};

// The board is a LENS now, not a route, and it no longer carries its own empty
// state. A first-time student never reaches it: the window renders the choice
// (`EmptyPlanner`) instead of the lenses until there is something to look at.
//
// **A move lands before the server answers, and then the card morphs into its
// new column.** Both halves of that are the same decision:
//
//   * Pressing an arrow used to do nothing visible until a server action, a
//     revalidate and a re-render had all completed. On the phone most of our
//     students are on, that is the difference between a control and a form.
//   * With the update applied here, synchronously, `startViewTransition` has
//     nothing to wait on — which is the ONLY safe way to use it in this
//     codebase. §5.1 of the backlog: a transition whose promise is gated on a
//     round trip freezes the document, measured at 2130ms on a `force-dynamic`
//     route. `flushSync` is what makes the update synchronous inside the
//     callback; without it React would batch, the snapshot would be taken
//     before anything changed, and the morph would animate nothing.
//
// Reduced motion skips the transition ENTIRELY rather than shortening it: the
// CSS guard zeroes the duration, and a zero-duration transition still freezes.
export function PlannerBoard({
  columns,
  droppedCount,
}: {
  columns: Record<PlannerColumn, PlannerItem[]>;
  droppedCount: number;
}) {
  // Only the cards the student has just moved. Cleared implicitly: the server
  // revalidates `/planner`, the columns arrive with the new truth in them, and
  // an override that agrees with its item is a no-op.
  const [moved, setMoved] = useState<Record<string, PlannerStatus>>({});

  const apply = useCallback((key: string, to: PlannerStatus) => {
    const update = () => setMoved((m) => ({ ...m, [key]: to }));
    const canMorph =
      typeof document !== "undefined" &&
      "startViewTransition" in document &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!canMorph) {
      update();
      return;
    }
    (
      document as Document & {
        startViewTransition: (cb: () => void) => unknown;
      }
    ).startViewTransition(() => flushSync(update));
  }, []);

  const revert = useCallback((key: string) => {
    setMoved((m) => {
      const next = { ...m };
      delete next[key];
      return next;
    });
  }, []);

  // The board the student is looking at: the server's columns with their own
  // last press laid over the top. Derived on every render rather than stored,
  // so the server always wins the moment it disagrees.
  const shown: Record<PlannerColumn, PlannerItem[]> = {
    todo: [],
    doing: [],
    done: [],
  };
  for (const col of PLANNER_COLUMNS) {
    for (const item of columns[col]) {
      const status = moved[item.key] ?? item.status;
      // `dropped` is an archive line, not a column — a card moved there simply
      // leaves the board, which is what the server is about to do too.
      if (status === "dropped") continue;
      shown[status].push({ ...item, status });
    }
  }

  return (
    <div className="space-y-4">
      {/* Width buys columns: one per column from md, stacked below it, which is
          the only readable form at 375px. */}
      <div className="grid gap-5 md:grid-cols-3">
        {PLANNER_COLUMNS.map((col) => (
          <section
            key={col}
            aria-labelledby={`planner-col-${col}`}
            className="space-y-3.5 rounded-2xl border border-line/70 bg-card/60 p-4 shadow-card"
          >
            <div className="flex items-center justify-between border-b border-line/60 pb-2.5">
              <h3
                id={`planner-col-${col}`}
                className="text-sm font-bold tracking-tight text-ink"
              >
                {HEADINGS[col]}
              </h3>
              <span
                data-num
                className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent-soft/80 px-2 text-xs font-semibold tabular-nums text-accent-ink"
              >
                {shown[col].length}
              </span>
            </div>
            <div className="space-y-3">
              {shown[col].map((item) => (
                <PlannerCard
                  key={item.key}
                  item={item}
                  onOptimisticMove={(to) => apply(item.key, to)}
                  onRevert={() => revert(item.key)}
                />
              ))}
              {/* The one place to add something of your own — at the head of the
                  track, because that is where a new thing actually starts. */}
              {col === "todo" && <AddTask />}
            </div>
          </section>
        ))}
      </div>

      {droppedCount > 0 && (
        <p className="text-xs text-ink-faint">
          {droppedCount} {droppedCount === 1 ? "thing" : "things"} you decided
          against. They stay recorded — changing your mind twice is allowed.
        </p>
      )}
    </div>
  );
}
