"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  PLANNER_SECTIONS,
  type PlannerSectionId,
} from "@/lib/data/planner-sections";
import { agendaHomeIndex, PLANNER_COLUMNS } from "@/lib/data/planner";
import type { PlannerColumn, PlannerItem, PlannerMonth } from "@/lib/data/planner";
import type { PlanPick } from "@/lib/data/plan-picks";
import { PlannerAgenda } from "@/components/planner/PlannerAgenda";
import { PlannerBoard } from "@/components/planner/PlannerBoard";
import { PlannerLenses } from "@/components/planner/PlannerLenses";
import { YourPicks } from "@/components/planner/YourPicks";

// ONE WINDOW.
//
// The founder's complaint was that the three sub-tabs should be one thing, and
// the previous release answered it with a control that LOOKED like a view
// switcher over three routes that behaved like destinations. This is the actual
// version: one route, one loader, one loaded dataset, and switching a lens
// changes nothing but which part of it is on screen.
//
// Three things follow from that, and each was a real fault before:
//
//   * **The period survives a lens change.** It is held here, not inside the
//     agenda, so stepping to March, glancing at the board and coming back does
//     not put you in September again.
//   * **The URL still names the view**, so a lens can be linked and shared —
//     but with `replaceState`, not `pushState`. Back from a plan should leave
//     the plan, not walk backwards through which lens you were looking through.
//   * **The guidance and the picks sit ABOVE the lenses**, once, rather than
//     inside one of them. What to do next and what you took from the guide are
//     true regardless of which lens you are looking through; putting them in a
//     view would mean two of the three views did not accompany anybody.
//
// The maps lens arrives as a prop rather than being imported: it is a server
// component (it reaches the map registry and needs no callback from here), and
// rendering it on the server is what keeps the map's own list off this bundle.
export function PlannerWindow({
  months,
  overdue,
  undated,
  columns,
  droppedCount,
  todayISO,
  picks,
  mapCount,
  initialView,
  nextMove,
  mapsLens,
}: {
  months: PlannerMonth[];
  overdue: PlannerItem[];
  undated: PlannerItem[];
  columns: Record<PlannerColumn, PlannerItem[]>;
  droppedCount: number;
  /** Resolved on the server. No client component in the planner reads a clock. */
  todayISO: string;
  picks: PlanPick[];
  mapCount: number;
  initialView: PlannerSectionId;
  /** Server-rendered, so the primary button's class merging stays off this bundle. */
  nextMove: React.ReactNode;
  mapsLens: React.ReactNode;
}) {
  const [view, setView] = useState<PlannerSectionId>(initialView);

  // Pure, and in lib/data/planner.ts with the rest of the model — the planner's
  // rules are testable or they are folklore.
  const homeIndex = useMemo(
    () => agendaHomeIndex(months, todayISO),
    [months, todayISO],
  );
  const [period, setPeriod] = useState(homeIndex);

  // The address follows the lens, and only the address: `replaceState` leaves
  // the history stack alone, so the Back button still means "leave the plan".
  // Guarded because this runs in the browser only — and written by hand rather
  // than through the router, because `router.replace` on a `force-dynamic`
  // route re-runs the server render, which is the exact round trip this whole
  // component exists to remove.
  useEffect(() => {
    const section = PLANNER_SECTIONS.find((s) => s.id === view);
    if (!section) return;
    const url = new URL(window.location.href);
    url.searchParams.set("view", section.view);
    window.history.replaceState(window.history.state, "", url.toString());
  }, [view]);

  const step = useCallback(
    (delta: number) =>
      setPeriod((i) => Math.min(months.length - 1, Math.max(0, i + delta))),
    [months.length],
  );

  const counts: Record<PlannerSectionId, number | null> = {
    // What is ahead of them, which is what "next" means. Overdue is deliberately
    // not added in: it is the frame around the window, and a badge that grew
    // when something LAPSED would read as progress.
    next: months.reduce((n, m) => n + m.items.length, 0) || null,
    board: PLANNER_COLUMNS.reduce((n, c) => n + columns[c].length, 0) || null,
    maps: mapCount || null,
  };

  return (
    <div className="space-y-6">
      {nextMove}

      <YourPicks picks={picks} />

      <div className="space-y-4">
        <PlannerLenses view={view} onView={setView} counts={counts} />

        {/* `key` remounts the panel so the entrance replays — the one motion
            this window has, and it is the one that answers "something changed
            here". The global reduced-motion guard zeroes it. */}
        <div
          key={view}
          id="planner-lens"
          role="tabpanel"
          aria-label={PLANNER_SECTIONS.find((s) => s.id === view)?.title}
          className="lens-in"
        >
          {view === "next" && (
            <PlannerAgenda
              months={months}
              overdue={overdue}
              undated={undated}
              index={period}
              homeIndex={homeIndex}
              onStep={step}
              onHome={() => setPeriod(homeIndex)}
            />
          )}
          {view === "board" && (
            <PlannerBoard columns={columns} droppedCount={droppedCount} />
          )}
          {view === "maps" && mapsLens}
        </div>
      </div>
    </div>
  );
}
