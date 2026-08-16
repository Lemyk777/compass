"use client";

import { useState, useTransition } from "react";
import { createMapFromPlan } from "@/app/planner/maps/actions";
import { countPicks, type PlanPick } from "@/lib/data/plan-picks";

// A first map that is not blank.
//
// The map's controls were reported as incomprehensible, and the cause was never
// the controls: a blank canvas asks a student to invent the axes of their own
// decision before they have any, and "Add inside" means nothing when there is
// nothing to be inside of. Handed a map that already holds the countries they
// chose, with the cities nested underneath, every operation on the bar has an
// obvious meaning within a second.
//
// Offered only when there is something to seed it with — a button that produces
// a map with one empty branch would be worse than no button.
export function SeedMapFromPlan({ picks }: { picks: PlanPick[] }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const counts = countPicks(picks);
  const usePlaces = counts.place > 0;
  if (!usePlaces && counts.work === 0) return null;

  const what = usePlaces
    ? `${counts.place} ${counts.place === 1 ? "country" : "countries"}`
    : `${counts.work} ${counts.work === 1 ? "kind of work" : "kinds of work"}`;

  return (
    <div className="rounded-2xl border border-accent/40 bg-card p-5">
      <h2 className="text-base font-semibold text-ink">
        Start from what&rsquo;s already on your plan
      </h2>
      <p className="mt-1 max-w-[54ch] text-sm leading-relaxed text-ink-soft">
        You took {what} out of the guide.{" "}
        {usePlaces
          ? "We'll lay them out as branches, with the cities you picked nested inside the right country — then you add what each one would actually need."
          : "We'll lay them out as branches — then you add what each one would actually need from you."}
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const res = await createMapFromPlan();
            if (!res.ok) setError(res.error);
          });
        }}
        className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-cta px-4 text-sm font-medium text-cta-ink shadow-card transition-[background-color,box-shadow,transform] duration-200 hover:bg-cta/90 hover:shadow-lift active:scale-[0.98] focus-visible:focus-ring disabled:opacity-50"
      >
        {pending ? "Drawing it…" : "Draw it for me"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-xs text-reach-ink">
          {error}
        </p>
      )}
    </div>
  );
}
