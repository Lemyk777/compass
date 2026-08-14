"use client";

import {
  PLANNER_COLUMNS,
  type PlannerColumn,
  type PlannerItem,
} from "@/lib/data/planner";
import { PlannerCard } from "@/components/planner/PlannerCard";
import { AddTask } from "@/components/planner/AddTask";
import { EmptyPlanner } from "@/components/planner/EmptyPlanner";
import type { PlannerStart } from "@/lib/data/planner-start";

const HEADINGS: Record<PlannerColumn, string> = {
  todo: "Not started",
  doing: "In progress",
  done: "Done",
};

export function PlannerBoard({
  columns,
  droppedCount,
  starts,
  suggestions,
}: {
  columns: Record<PlannerColumn, PlannerItem[]>;
  droppedCount: number;
  /** The choice the empty planner offers — derived from the spine, in the loader. */
  starts: PlannerStart[];
  suggestions: { id: string; name: string; deadline: string }[];
}) {
  const total = PLANNER_COLUMNS.reduce((n, c) => n + columns[c].length, 0);

  // Nothing carried, and nothing dropped either — a first-time board.
  if (total === 0 && droppedCount === 0) {
    return <EmptyPlanner starts={starts} suggestions={suggestions} />;
  }

  return (
    <div className="space-y-4">
      {/* Width buys columns: one per column from md, stacked below it, which is
          the only readable form at 375px. */}
      <div className="grid gap-4 md:grid-cols-3">
        {PLANNER_COLUMNS.map((col) => (
          <section
            key={col}
            aria-labelledby={`planner-col-${col}`}
            className="space-y-3"
          >
            <h2
              id={`planner-col-${col}`}
              className="text-sm font-semibold text-ink"
            >
              {HEADINGS[col]}{" "}
              <span
                data-num
                className="font-normal tabular-nums text-ink-faint"
              >
                {columns[col].length}
              </span>
            </h2>
            {columns[col].map((item) => (
              <PlannerCard key={item.key} item={item} />
            ))}
            {/* The one place to add something of your own — at the head of the
                track, because that is where a new thing actually starts. */}
            {col === "todo" && <AddTask />}
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
