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
}: {
  children: React.ReactNode;
  isAdmin?: boolean;
  hasReport?: boolean;
}) {
  const companion = await loadCompanion();
  const label = companion
    ? (STATIONS.find((s) => s.id === companion.station.id)?.label ?? "")
    : "";

  return (
    <div className="min-h-dvh bg-surface text-ink">
      <SkipLink />
      <StudentNav isAdmin={isAdmin} hasReport={hasReport} />
      {/* `tabIndex={-1}` is what makes the skip link move focus and not merely
          scroll — see the note in SkipLink. */}
      <Shell as="main" id={SKIP_TARGET} tabIndex={-1} className="py-6 sm:py-8">
        {companion ? (
          // Width buys COLUMNS, never line length: below `lg` the companion is a
          // dock at the foot of the flow, and from `lg` it takes the column that
          // was gutter anyway. The content does not narrow to make room — the
          // shell was already wider than the measure it holds.
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8">
            <div className="min-w-0">{children}</div>
            <Companion
              stationIndex={companion.station.index}
              stationTotal={companion.station.total}
              stationLabel={label}
              said={companion.said}
              moveLabel={companion.move.action.label}
              moveHref={companion.move.action.href}
              moveWhy={companion.move.why}
              pair={
                companion.pair ? (
                  <div className="mt-4 border-t border-line pt-4">
                    <BeatPair
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
