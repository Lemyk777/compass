import { Link } from "@/components/ui/Link";
import { NewMap } from "@/components/planner/NewMap";
import { SeedMapFromPlan } from "@/components/planner/SeedMapFromPlan";
import type { MapSummary } from "@/lib/planner/maps-load";
import type { PlanPick } from "@/lib/data/plan-picks";

// The maps lens.
//
// It was a route of its own (`/planner/maps`) and is a view now, for the same
// reason the board is: nothing here needs a second server round trip, and going
// somewhere to look at the same plan through a different lens is what made the
// section feel like three products.
//
// A map itself keeps its own URL — `/planner/maps/<id>` — and that is not an
// inconsistency. A lens is a way of looking at everything; one map is a
// document, and a document a student cannot link to or come back to is the
// modal problem the guide already solved once.
export function PlannerMaps({
  maps,
  picks,
}: {
  maps: MapSummary[];
  /** What they took from the guide — the branches a first map can start with. */
  picks: PlanPick[];
}) {
  if (maps.length === 0) {
    return (
      <div className="space-y-3">
        {/* Offered ABOVE the blank question box, because a map that already has
            the student's own countries on it explains what a map is for in one
            glance — and the blank first field is exactly where this kind of
            tool loses people. */}
        {picks.length > 0 && <SeedMapFromPlan picks={picks} />}
        <NewMap empty />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {maps.map((m) => (
          <li key={m.id}>
            <Link
              href={`/planner/maps/${m.id}`}
              className="flex h-full flex-col rounded-2xl border border-line bg-card p-4 transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-accent hover:shadow-card active:translate-y-0 focus-visible:focus-ring motion-reduce:transform-none motion-reduce:transition-none"
            >
              <span className="text-[0.95rem] font-semibold leading-snug text-ink">
                {m.label}
              </span>
              <span
                data-num
                className="mt-1.5 text-xs tabular-nums text-ink-faint"
              >
                {m.nodeCount === 0
                  ? "nothing on it yet"
                  : `${m.nodeCount} ${m.nodeCount === 1 ? "branch" : "branches"}`}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <NewMap />
    </div>
  );
}
