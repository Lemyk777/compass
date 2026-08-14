import { Link } from "@/components/ui/Link";
import type { PlannerStart } from "@/lib/data/planner-start";

// The empty planner offers a CHOICE — four ways in, and you pick one.
//
// It used to be a paragraph explaining how the plan fills itself, plus a link.
// That hands the work back to the student, which is the failure this product
// exists to avoid: the repeated finding in the college-access literature is
// that information alone moves nothing, and doing part of the work moves
// 25–30%.
//
// The owner's call (release 3, PLANNER_PLAN.md §1) is a choice rather than one
// recommended next move, and it is the better call: a single recommendation is
// a judgement about a student we have not met. Four real starting points cost
// the same one tap, and the pick itself is the first thing we learn about them.
//
// **Every option is a thing that HAPPENS.** "Pick a field" would be a form with
// different paint — and a form is exactly what a student who cannot say what
// they want to study is unable to fill in. Each card says what it will TELL
// them, which is what makes choosing possible without already knowing.
//
// The counts come from the spine, so what the plan offers as a first move is
// the same chain the guide walks. This is the guide→planner bridge; before it,
// the planner knew nothing about the guide at all.
export function EmptyPlanner({
  starts,
  suggestions,
}: {
  starts: PlannerStart[];
  suggestions: { id: string; name: string; deadline: string }[];
}) {
  return (
    <div className="space-y-5">
      <div className="max-w-[62ch]">
        <h2 className="text-xl font-semibold leading-snug text-ink">
          Nothing here yet — and that is the normal way to arrive.
        </h2>
        <p className="mt-2 text-base leading-relaxed text-ink-soft">
          Most people cannot say what they want to study. You do not have to
          decide anything to start: pick whichever of these you actually want
          the answer to, and your plan builds itself out of what you do next.
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {starts.map((s) => (
          <li key={s.id}>
            <Link
              href={s.href}
              className="group flex h-full flex-col rounded-2xl border border-line bg-card p-5 transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-accent hover:shadow-card focus-visible:focus-ring active:translate-y-0 active:shadow-none motion-reduce:transform-none motion-reduce:transition-none"
            >
              <span className="text-base font-semibold leading-snug text-ink">
                {s.label}
              </span>
              <span className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">
                {s.tells}
              </span>
              <span className="mt-4 flex items-center justify-between gap-3">
                {/* A real number from the data or nothing at all — never a
                    placeholder. A count that might be zero is worse than no
                    count, because it is the one thing on the card a student
                    would take literally. */}
                {s.count !== null ? (
                  <span data-num className="text-sm tabular-nums text-ink-soft">
                    <span className="font-semibold text-ink">{s.count}</span>{" "}
                    {s.unit}
                  </span>
                ) : (
                  <span />
                )}
                <span
                  aria-hidden="true"
                  className="shrink-0 text-accent-ink transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
                >
                  &rarr;
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {suggestions.length > 0 && (
        <div className="rounded-2xl border border-line bg-card p-5">
          <p className="text-sm font-semibold text-ink">
            Or start with one of these — you can enter both
          </p>
          <ul className="mt-3 space-y-2">
            {suggestions.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/opportunities/${s.id}`}
                  className="inline-flex min-h-11 items-center text-sm font-medium text-accent-ink underline-offset-4 transition hover:underline focus-visible:focus-ring"
                >
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
