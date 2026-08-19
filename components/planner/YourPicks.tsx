"use client";

import { useState, useTransition } from "react";
import { Link } from "@/components/ui/Link";
import { removePick } from "@/app/planner/actions";
import { groupPicks, type PlanPick } from "@/lib/data/plan-picks";

// WHAT YOU TOOK OUT OF THE GUIDE, in the guide's own order.
//
// This is the join made visible, and it is the reason the guide→plan bridge is
// worth anything: a saved pick nobody can see is a database row, not a
// connection. Every chip opens the page it was read on, so the plan is never a
// place where a decision goes to be forgotten.
//
// **The step numbers are the GUIDE's.** They are not a progress meter and there
// is no step 5 waiting to be unlocked — the section deliberately has no path of
// its own. A number here means "this came out of step 2 of the guide", which is
// a true statement about where the student was, and it is what makes the two
// sections read as one thing rather than as a plan that happens to link out.
//
// Empty groups are not rendered at all. Four headings with nothing under them
// would be a path with the paint changed, and what is missing is already said —
// once, properly, by the move at the top of the window.
export function YourPicks({ picks }: { picks: PlanPick[] }) {
  // Held locally so a removal settles at once. The server action revalidates
  // the plan, so the prop catches up; a student on a phone should not watch a
  // round trip to find out whether a chip went away.
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const groups = groupPicks(picks.filter((p) => !removed.has(p.ref)));
  if (groups.length === 0) return null;

  function drop(ref: string, kind: string, id: string) {
    setError(null);
    setRemoved((s) => new Set(s).add(ref));
    startTransition(async () => {
      const res = await removePick({ kind, id });
      if (!res.ok) {
        // Put it back. An optimistic state that lies about what the plan holds
        // is worse than a slow one.
        setRemoved((s) => {
          const next = new Set(s);
          next.delete(ref);
          return next;
        });
        setError(res.error);
      }
    });
  }

  return (
    <section
      aria-labelledby="your-picks"
      className="rounded-2xl border border-line bg-card p-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="your-picks" className="text-base font-semibold text-ink">
          What you took from the guide
        </h2>
        <Link
          href="/guide"
          className="inline-flex min-h-11 items-center text-sm font-medium text-accent-ink underline-offset-4 transition hover:underline focus-visible:focus-ring"
        >
          Add more
        </Link>
      </div>
      <p className="mt-1 max-w-[54ch] text-sm leading-relaxed text-ink-soft">
        Each one opens where you read it. This is what the plan is built out of
        — nothing here commits you to anything.
      </p>

      <div className="mt-4 space-y-4">
        {groups.map((g) => (
          <div key={g.kind}>
            <h3 className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-ink-faint">
              {/* The guide's own step number, not a position in this list. */}
              <span
                data-num
                className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-surface text-[12px] font-semibold tabular-nums text-ink-soft"
              >
                {g.step}
              </span>
              {g.heading}
            </h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {g.picks.map((p) => (
                <li key={p.ref}>
                  {/* Link and remove are SIBLINGS inside the pill, never nested
                      — a button inside an anchor is invalid and the browser
                      resolves it by guessing. */}
                  <span className="inline-flex items-stretch overflow-hidden rounded-full border border-line bg-surface transition-colors hover:border-accent">
                    <Link
                      href={p.href}
                      className="inline-flex min-h-11 items-center pl-3.5 pr-2 text-sm font-medium text-ink transition-colors hover:text-accent-ink focus-visible:focus-ring"
                    >
                      {p.label}
                    </Link>
                    <button
                      type="button"
                      onClick={() => drop(p.ref, p.kind, p.id)}
                      aria-label={`Take ${p.label} off your plan`}
                      className="inline-flex min-h-11 w-9 items-center justify-center text-ink-faint transition-colors hover:bg-surface hover:text-ink focus-visible:focus-ring"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="13"
                        height="13"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        aria-hidden="true"
                      >
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-xs text-reach-ink">
          {error}
        </p>
      )}
    </section>
  );
}
