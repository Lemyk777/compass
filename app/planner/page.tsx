import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { loadPlanner } from "@/lib/planner/load";
import {
  plannerSection,
  plannerViewFromParam,
} from "@/lib/data/planner-sections";
import { PlannerWindow } from "@/components/planner/PlannerWindow";
import { NextMoveCard } from "@/components/planner/NextMoveCard";
import { PlannerMaps } from "@/components/planner/PlannerMaps";
import { EmptyPlanner } from "@/components/planner/EmptyPlanner";

export const dynamic = "force-dynamic";

// Behind a login, so nothing is said to a crawler about it beyond the
// robots.txt rule — and no canonical, because there is no public document here.
export const metadata: Metadata = {
  title: "Your plan — Compass",
  robots: { index: false, follow: false },
};

// THE ONLY PLANNER ROUTE.
//
// `/planner/board` and `/planner/maps` were pages; they are `?view=` values now
// and 308 here from next.config.mjs. One route means one loader, which means the
// three lenses cannot disagree with each other and switching between them costs
// no round trip. A single map keeps its own page — a document a student can
// link to and come back to — which is a different thing from a view.
export default async function PlannerPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const view = plannerViewFromParam(searchParams.view);

  // The lens is carried through the sign-in, not dropped. This is release 1's
  // bug one layer up: somebody following a link to the board used to be sent to
  // `?next=/planner` and land on the agenda, having asked for the board.
  const session = await requireSession(
    `/planner?view=${plannerSection(view).view}`,
  );
  const data = await loadPlanner(session);

  // A student who has done nothing at all — not committed, not picked anything
  // out of the guide, not started a map. They get the CHOICE rather than the
  // window: four real starting points, each ending somewhere they can act.
  // Three empty lenses and a switcher above them would be a working product
  // shown to somebody with nothing to look at.
  const coldStart =
    data.items.length === 0 &&
    data.picks.length === 0 &&
    data.maps.length === 0;

  if (coldStart) {
    return <EmptyPlanner starts={data.starts} suggestions={data.suggestions} />;
  }

  return (
    <PlannerWindow
      months={data.months}
      overdue={data.overdue}
      undated={data.undated}
      columns={data.columns}
      droppedCount={data.droppedCount}
      todayISO={data.todayISO}
      picks={data.picks}
      mapCount={data.maps.length}
      initialView={view}
      // The next move uses the shared button system, whose class merging costs
      // ~9 kB in any client bundle that imports it; the maps lens reaches the
      // map registry. Neither needs a callback from the window, so neither has
      // to cross over.
      nextMove={<NextMoveCard move={data.move} simulation={data.simulation} />}
      mapsLens={<PlannerMaps roadmap={data.roadmap} picks={data.picks} />}
    />
  );
}
