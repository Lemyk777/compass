"use client";

import { useState, useTransition } from "react";
import { Link } from "@/components/ui/Link";
import { deletePlannerItem, movePlannerItem } from "@/app/planner/actions";
import { isMovable, stepStatus, type PlannerItem } from "@/lib/data/planner";

// One card, used by both the board and the agenda.
//
// Moving is a BUTTON, not a drag. Native HTML5 drag cannot be operated from a
// keyboard at all and is poor on touch, and most of our students are on a
// phone — where a button is simply the better control, not the fallback. It is
// also a server action, so the state lands in whichever table owns it (see
// `movePlannerItem`) with no client state machine to keep in sync.

export function PlannerCard({ item }: { item: PlannerItem }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const left = stepStatus(item.status, -1);
  const right = stepStatus(item.status, 1);
  const movable = isMovable(item);

  function move(to: NonNullable<ReturnType<typeof stepStatus>>) {
    setError(null);
    startTransition(async () => {
      const res = await movePlannerItem({
        origin: item.origin,
        sourceId: item.sourceId,
        to,
      });
      if (!res.ok) setError(res.error);
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      const res = await deletePlannerItem(item.sourceId);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <article className="rounded-xl border border-line bg-card p-3">
      {item.href ? (
        <Link
          href={item.href}
          className="text-sm font-medium text-ink underline-offset-2 hover:underline focus-visible:focus-ring"
        >
          {item.title}
        </Link>
      ) : (
        <p className="text-sm font-medium text-ink">{item.title}</p>
      )}

      {/* Never a countdown for a date we cannot stand behind. An unconfirmed
          deadline never reaches `dueISO` at all, so this branch is physically
          unable to render one — the rule lives in the type, not here. */}
      <p className="mt-1 text-xs text-ink-faint">
        {item.dueISO ? <DueLabel daysLeft={item.daysLeft ?? 0} /> : "Dates not announced"}
      </p>

      {item.note && (
        <p className="mt-2 text-xs italic text-ink-soft">&ldquo;{item.note}&rdquo;</p>
      )}

      {movable && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-2">
          <button
            type="button"
            disabled={pending || !left}
            onClick={() => left && move(left)}
            aria-label={`Move ${item.title} back`}
            className="rounded-lg border border-line px-2 py-1 text-xs font-medium text-ink-soft transition-colors hover:border-ink/30 hover:text-ink focus-visible:focus-ring disabled:opacity-40"
          >
            &larr;
          </button>
          <button
            type="button"
            disabled={pending || !right}
            onClick={() => right && move(right)}
            aria-label={`Move ${item.title} forward`}
            className="rounded-lg border border-line px-2 py-1 text-xs font-medium text-ink-soft transition-colors hover:border-ink/30 hover:text-ink focus-visible:focus-ring disabled:opacity-40"
          >
            &rarr;
          </button>
          {item.status !== "dropped" && (
            <button
              type="button"
              disabled={pending}
              onClick={() => move("dropped")}
              className="ml-auto text-xs text-ink-faint underline-offset-2 hover:underline focus-visible:focus-ring disabled:opacity-40"
            >
              Not doing this
            </button>
          )}
          {/* A derived card cannot be deleted — removing it would delete the
              record of a commitment, which is the one thing this product
              measures. Only the student's own tasks delete. */}
          {item.origin === "own" && (
            <button
              type="button"
              disabled={pending}
              onClick={remove}
              className="text-xs text-ink-faint underline-offset-2 hover:underline focus-visible:focus-ring disabled:opacity-40"
            >
              Delete
            </button>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 text-xs text-reach-ink">
          {error}
        </p>
      )}
    </article>
  );
}

function DueLabel({ daysLeft }: { daysLeft: number }) {
  if (daysLeft < 0) {
    return (
      <span className="text-reach-ink">
        closed {-daysLeft} {-daysLeft === 1 ? "day" : "days"} ago
      </span>
    );
  }
  if (daysLeft === 0) return <span className="text-reach-ink">Today</span>;
  if (daysLeft === 1) return <span className="text-reach-ink">Tomorrow</span>;
  return <>in {daysLeft} days</>;
}
