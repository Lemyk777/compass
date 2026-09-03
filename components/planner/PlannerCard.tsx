"use client";

import { useState, useTransition } from "react";
import { Link } from "@/components/ui/Link";
import { deletePlannerItem, movePlannerItem } from "@/app/planner/actions";
import {
  isMovable,
  plannerMorph,
  stepStatus,
  type PlannerItem,
  type PlannerStatus,
} from "@/lib/data/planner";

// One card, used by both the board and the agenda.
//
// Moving is a BUTTON, not a drag. Native HTML5 drag cannot be operated from a
// keyboard at all and is poor on touch, and most of our students are on a
// phone — where a button is simply the better control, not the fallback. It is
// also a server action, so the state lands in whichever table owns it (see
// `movePlannerItem`) with no client state machine to keep in sync.

export function PlannerCard({
  item,
  onOptimisticMove,
  onRevert,
}: {
  item: PlannerItem;
  /**
   * The board shows the card in its new column BEFORE the server answers, and
   * that is what makes the move feel like a move rather than a form submission.
   * The agenda passes nothing: a card there is placed by its date, which a
   * status change does not alter.
   *
   * It also removes the reason a view transition here would be dangerous. §5.1
   * of the backlog: a `startViewTransition` whose promise waits on a server
   * round trip freezes the document — measured at 2130ms on a `force-dynamic`
   * route. With the update applied synchronously in the client there is nothing
   * to wait on.
   */
  onOptimisticMove?: (to: PlannerStatus) => void;
  onRevert?: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const left = stepStatus(item.status, -1);
  const right = stepStatus(item.status, 1);
  const movable = isMovable(item);

  function move(to: NonNullable<ReturnType<typeof stepStatus>>) {
    setError(null);
    onOptimisticMove?.(to);
    startTransition(async () => {
      const res = await movePlannerItem({
        origin: item.origin,
        sourceId: item.sourceId,
        to,
      });
      // Put it back where it was. An optimistic position that lies about what
      // the plan holds is worse than a slow one.
      if (!res.ok) {
        onRevert?.();
        setError(res.error);
      }
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
    <article
      // Named only where it can actually travel — on the board. A
      // `view-transition-name` must be unique in the document, and the agenda
      // renders the same card without moving it, so naming it in both places
      // would be two elements claiming one name and no transition at all.
      style={
        onOptimisticMove
          ? { viewTransitionName: plannerMorph(item.key) }
          : undefined
      }
      className="group rounded-2xl border border-line/70 bg-card p-4 shadow-card transition-all duration-200 hover:shadow-lift"
    >
      {item.href ? (
        <Link
          href={item.href}
          className="text-sm font-semibold text-ink underline-offset-2 hover:text-accent-ink hover:underline focus-visible:focus-ring"
        >
          {item.title}
        </Link>
      ) : (
        <p className="text-sm font-semibold text-ink">{item.title}</p>
      )}

      {/* Never a countdown for a date we cannot stand behind. An unconfirmed
          deadline never reaches `dueISO` at all, so this branch is physically
          unable to render one — the rule lives in the type, not here. */}
      <p className="mt-1.5 text-xs text-ink-faint">
        {item.dueISO ? (
          <DueLabel daysLeft={item.daysLeft ?? 0} />
        ) : (
          "Dates not announced"
        )}
      </p>

      {item.note && (
        <p className="mt-2.5 rounded-lg bg-surface/80 p-2 text-xs italic text-ink-soft border border-line/40">
          &ldquo;{item.note}&rdquo;
        </p>
      )}

      {movable && (
        <div className="mt-3.5 flex flex-wrap items-center gap-1.5 border-t border-line/60 pt-2.5">
          <button
            type="button"
            disabled={pending || !left}
            onClick={() => left && move(left)}
            aria-label={`Move ${item.title} back`}
            className="rounded-lg border border-line/70 bg-surface/80 px-2.5 py-1 text-xs font-medium text-ink-soft transition-all hover:border-accent hover:bg-card hover:text-ink focus-visible:focus-ring disabled:opacity-35 shadow-sm active:scale-95"
          >
            &larr;
          </button>
          <button
            type="button"
            disabled={pending || !right}
            onClick={() => right && move(right)}
            aria-label={`Move ${item.title} forward`}
            className="rounded-lg border border-line/70 bg-surface/80 px-2.5 py-1 text-xs font-medium text-ink-soft transition-all hover:border-accent hover:bg-card hover:text-ink focus-visible:focus-ring disabled:opacity-35 shadow-sm active:scale-95"
          >
            &rarr;
          </button>
          {item.status !== "dropped" && (
            <button
              type="button"
              disabled={pending}
              onClick={() => move("dropped")}
              className="ml-auto text-xs text-ink-faint underline-offset-2 hover:text-reach-ink hover:underline focus-visible:focus-ring disabled:opacity-35"
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
              className="text-xs text-ink-faint underline-offset-2 hover:text-reach-ink hover:underline focus-visible:focus-ring disabled:opacity-35"
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
