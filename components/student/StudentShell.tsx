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

  // TWO MEASURED CONSTANTS THE SHELL PUBLISHES TO WHATEVER RENDERS INSIDE IT.
  // Both exist because a component that renders in more than one shell must
  // not be pinned to an absolute number — the same rule the layout section of
  // CLAUDE.md states about width, arriving here as a sticky offset and a fixed
  // one.
  //
  //   --shell-sticky-top   how far down this shell's own sticky header reaches.
  //                        StudentNav is `py-3` around a `min-h-11` row: 4.25rem,
  //                        measured 69px. OpportunitiesView pins its kind tabs
  //                        below it. That view ALSO renders inside the report
  //                        shell, which sets nothing — the `0px` fallback there
  //                        is exactly the behaviour it had before.
  //   --companion-dock-h   the height of the companion's phone dock, or 0px
  //                        when there is no companion at all. DetailExit's
  //                        floating exit sits above it.
  //
  // Both are read through `var(--x, 0px)`, so a surface that never meets this
  // shell is unaffected rather than broken.
  const shellVars = {
    "--shell-sticky-top": "4.25rem",
    "--companion-dock-h": companion ? "2.75rem" : "0px",
  } as React.CSSProperties;

  return (
    <div className="min-h-dvh bg-surface text-ink" style={shellVars}>
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
                // Three states, not two. `null` means THIS PAGE owns the move
                // — the planner renders NextMoveCard from a loader that carries
                // the agenda, and two ladders on one screen is how the section
                // contradicts itself. `"deferred"` means the loader cannot
                // judge one honestly. Collapsing them gave /planner a control
                // urging the student to open /planner.
                !showMove
                  ? null
                  : companion.move
                    ? {
                        label: companion.move.action.label,
                        href: companion.move.action.href,
                        why: companion.move.why,
                      }
                    : "deferred"
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
            {/* The dock's reserved height. Below `xl` the companion is `fixed`,
                so it is out of flow and sits on whatever is at the foot of the
                page — which on a phone is usually the control the student was
                reaching for. This spacer is the whole of "it never covers
                content", and it was lost once already when the two-copy markup
                was collapsed into one. Its reach is wider than it looks: since
                the rail starts at `xl`, the dock covers 1024–1279px too. */}
            <div aria-hidden className="h-16 xl:hidden" />
          </div>
        ) : (
          children
        )}
      </Shell>
    </div>
  );
}
