"use client";

import { useCallback, useMemo, useState } from "react";
import {
  type PlannerSectionId,
} from "@/lib/data/planner-sections";
import { agendaHomeIndex, PLANNER_COLUMNS } from "@/lib/data/planner";
import type { PlannerColumn, PlannerItem, PlannerMonth } from "@/lib/data/planner";
import type { PlanPick } from "@/lib/data/plan-picks";
import { PlannerAgenda } from "@/components/planner/PlannerAgenda";
import { PlannerBoard } from "@/components/planner/PlannerBoard";
import { YourPicks } from "@/components/planner/YourPicks";
import { Container } from "@/components/ui/Container";

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
  // Pure, and in lib/data/planner.ts with the rest of the model — the planner's
  // rules are testable or they are folklore.
  const homeIndex = useMemo(
    () => agendaHomeIndex(months, todayISO),
    [months, todayISO],
  );
  const [period, setPeriod] = useState(homeIndex);

  const step = useCallback(
    (delta: number) =>
      setPeriod((i) => Math.min(months.length - 1, Math.max(0, i + delta))),
    [months.length],
  );

  return (
    <Container size="dashboard" className="space-y-10 pb-20">
      {/* 1. The Consultant Block */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-6 items-start">
        {nextMove}
        <YourPicks picks={picks} />
      </div>

      {/* 2. Interactive Timeline (Agenda) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent" />
          <h2 className="text-xl font-bold tracking-tight text-ink">Action Timeline</h2>
        </div>
        <PlannerAgenda
          months={months}
          overdue={overdue}
          undated={undated}
          index={period}
          homeIndex={homeIndex}
          onStep={step}
          onHome={() => setPeriod(homeIndex)}
        />
      </div>

      {/* 3. Task Pool (Board) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-target" />
          <h2 className="text-xl font-bold tracking-tight text-ink">Backlog & Execution Board</h2>
        </div>
        <PlannerBoard columns={columns} droppedCount={droppedCount} />
      </div>

      {/* 4. Strategic Roadmap (Maps) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-likely" />
          <h2 className="text-xl font-bold tracking-tight text-ink">Strategic Roadmap & Milestones</h2>
        </div>
        {mapsLens}
      </div>
    </Container>
  );
}
