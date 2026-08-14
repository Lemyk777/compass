"use client";

import {
  PLANNER_SECTIONS,
  type PlannerSectionId,
} from "@/lib/data/planner-sections";

// ONE WINDOW, three lenses — and now it is literally true.
//
// This used to be three `<Link>`s to three routes dressed as a segmented
// control: pressing one ran the server again, threw away the period you had
// stepped to, and re-rendered the whole section. The tab strip said "views" and
// the behaviour said "destinations", and that gap is most of why the planner
// read as three products sharing a header.
//
// They are buttons over one loaded dataset now. The URL still changes, so a
// view can be shared — the window replaces the history entry rather than
// pushing one, because Back from a plan should leave the plan.
//
// The counts are the other half of the fix: a lens that says how much is behind
// it is a lens someone can choose between. "Board" alone tells a student
// nothing about whether it is worth pressing.
export function PlannerLenses({
  view,
  onView,
  counts,
}: {
  view: PlannerSectionId;
  onView: (id: PlannerSectionId) => void;
  /** How much is behind each lens. A real number or null — never a placeholder. */
  counts: Record<PlannerSectionId, number | null>;
}) {
  const active = PLANNER_SECTIONS.find((s) => s.id === view)!;

  return (
    <div className="space-y-2.5">
      <div
        role="tablist"
        aria-label="Views of your plan"
        className="inline-flex w-full items-center gap-1 rounded-2xl border border-line bg-card p-1 sm:w-auto"
      >
        {PLANNER_SECTIONS.map((s) => {
          const on = s.id === view;
          const n = counts[s.id];
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls="planner-lens"
              onClick={() => onView(s.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors focus-visible:focus-ring sm:flex-none ${
                on
                  ? "bg-accent-soft text-accent-ink"
                  : "text-ink-soft hover:bg-surface hover:text-ink"
              }`}
            >
              {s.label}
              {n !== null && n > 0 && (
                <span
                  data-num
                  className={`text-xs tabular-nums ${
                    on ? "text-accent-ink/75" : "text-ink-faint"
                  }`}
                >
                  {n}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* The current lens's own sentence, said ONCE and here. Each view used to
          repeat its title as an `<h1>` and its blurb underneath, so the window
          opened with two headings before any content. */}
      <p className="max-w-[62ch] text-sm leading-relaxed text-ink-soft">
        {active.blurb}
      </p>
    </div>
  );
}
