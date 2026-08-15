import { StudentNav } from "@/components/student/StudentNav";
import { Shell } from "@/components/ui/Shell";
import { SKIP_TARGET, SkipLink } from "@/components/ui/SkipLink";
import { Companion } from "@/components/companion/Companion";
import { BeatPair } from "@/components/companion/BeatPair";
import { loadCompanion } from "@/lib/companion/load";
import { STATIONS } from "@/lib/data/thread";

// The frame for the student's own section of the site: Opportunities, the Guide
// and the Plan. Deliberately NOT the report's sidebar shell — a rail of eight
// analysis tabs told every arriving student that this is a portfolio-scoring
// console, which is exactly backwards.
//
// The COMPANION lives here, which is the point of it: it is present on every
// page rather than on one, because "I get more confused the more I use the site"
// is a complaint about every screen and not about the entrance.
//
// It is resolved on the SERVER and handed down as values plus a pre-rendered
// node. `loadCompanion` reaches the session and three tables; `BeatPair` is
// rendered here so the beats registry never crosses into a client bundle. Any
// runtime import of a prose registry from the companion would ship it to every
// route in the product — a unit test fails the build on that.
export async function StudentShell({
  children,
  isAdmin = false,
  hasReport = false,
  showMove = true,
}: {
  children: React.ReactNode;
  isAdmin?: boolean;
  hasReport?: boolean;
  /**
   * Whether the companion offers the next move here. False on the planner,
   * which renders its own NextMoveCard from a loader that carries the agenda
   * — one ladder, shown in the place best able to phrase it.
   */
  showMove?: boolean;
}) {
  const companion = await loadCompanion();
  // The station's own index is its position in STATIONS, so the label is that
  // entry — no second lookup, and no `?? ""` fallback that would render
  // "Step 3 of 7 · " with nothing after it.
  const label = companion
    ? STATIONS[companion.station.index - 1].label
    : "";

  return (
    <div className="min-h-dvh bg-surface text-ink">
      <SkipLink />
      <StudentNav isAdmin={isAdmin} hasReport={hasReport} />
      {/* `tabIndex={-1}` is what makes the skip link move focus and not merely
          scroll — see the note in SkipLink. */}
      <Shell as="main" id={SKIP_TARGET} tabIndex={-1} className="py-6 sm:py-8">
        {companion ? (
          // Width buys COLUMNS, never line length: below `xl` the companion is
          // a dock at the foot of the flow, and from `xl` it takes the column
          // that was gutter anyway.
          //
          // `xl`, not `lg`, and that is measured rather than chosen: a guide
          // subject page already carries its own rail from `lg`, so nesting a
          // second one left 256px of prose at 1024px — buying a column WITH the
          // line length, which inverts the rule the whole layout is built on.
          <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-8">
            <div className="min-w-0">{children}</div>
            <Companion
              stationIndex={companion.station.index}
              stationTotal={companion.station.total}
              stationLabel={label}
              said={companion.said}
              move={
                // Suppressed where the page owns the answer. The planner
                // renders NextMoveCard from a loader that carries the agenda,
                // and two ladders reasoning from different inputs on one screen
                // is how the section ends up contradicting itself.
                showMove && companion.move
                  ? {
                      label: companion.move.action.label,
                      href: companion.move.action.href,
                      why: companion.move.why,
                    }
                  : null
              }
              pair={
                companion.pair ? (
                  <div className="mt-4 border-t border-line pt-4">
                    {/* The `key` is load-bearing, not tidiness. Without it React
                        reconciles BeatPair in place when the server sends the
                        NEXT pair, so its `chosen` state survives and every pair
                        after the first renders already-answered and disabled.
                        The thread needs three pairs to leave station one, so a
                        student could never reach an observation without
                        reloading the page by hand. */}
                    <BeatPair
                      key={`${companion.pair.left.id}:${companion.pair.right.id}`}
                      left={companion.pair.left}
                      right={companion.pair.right}
                    />
                  </div>
                ) : null
              }
            />
          </div>
        ) : (
          children
        )}
      </Shell>
    </div>
  );
}
