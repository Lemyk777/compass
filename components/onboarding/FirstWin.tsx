"use client";

import { matchedOnly } from "@/lib/data/opportunity-filter";
import { useEffect, useMemo, useState } from "react";
import type { ExtracurricularsPlan } from "@/lib/data/key-dates";
import { useOnboardingContext } from "./context/OnboardingContext";

// Pay the student before asking them for anything else.
//
// 44% of signups completed no part of this form, and every one of them also
// never ran an analysis — they met five screens that ask and give nothing back,
// and left. The evidence on this is not subtle: an information-only arm of the
// H&R Block trial moved nothing, while the arm where someone did the work with
// you moved enrollment 25–30%, and the HAIL treatment made a point of requiring
// no extra forms at all. The form itself is the obstacle.
//
// So the moment the first screen knows a graduation year, we hand over a real,
// specific, checkable result — and say plainly that it is theirs whether or not
// they finish. Removing the coercion is the point: a student who leaves here
// still leaves with something, and the ones who stay are staying for a reason
// other than a progress bar.

const SHOWN = 3;

export function FirstWin() {
  const { data } = useOnboardingContext();

  // Resolve "today" on the client — the countdown depends on the visitor's
  // clock and a server-rendered one would hydrate wrong.
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => setToday(new Date()), []);

  const graduationYear = data.graduation_year;
  const faculties = useMemo(
    () => (Array.isArray(data.faculties) ? data.faculties : []),
    [data.faculties],
  );

  // Lazy-load the matching engine so the catalog is a separate async chunk, not
  // part of the onboarding bundle. No analysis yet → everyone starts "emerging".
  const [plan, setPlan] = useState<ExtracurricularsPlan | null>(null);
  useEffect(() => {
    if (!today || !graduationYear) {
      setPlan(null);
      return;
    }
    let cancelled = false;
    import("@/lib/data/key-dates").then((m) => {
      if (cancelled) return;
      setPlan(
        m.buildExtracurriculars({
          today,
          faculties,
          factors: [],
          graduationYear,
        }),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [today, graduationYear, faculties]);

  if (!plan) return null;

  // No filter panel here either — see matchedOnly. This screen is the first
  // thing a new student ever sees, so a row from another country or another
  // subject is the worst possible first impression of "matched to you".
  const openNow = matchedOnly(plan.items).filter((o) => !o.notYetEligible);
  if (openNow.length === 0) return null;

  const shown = openNow.slice(0, SHOWN);
  const nearest = shown
    .filter((o) => o.dateConfirmed)
    .reduce<(typeof shown)[number] | null>(
      (best, o) =>
        best == null || o.daysToDeadline < best.daysToDeadline ? o : best,
      null,
    );

  return (
    <section
      aria-live="polite"
      className="mt-8 rounded-2xl border border-ivy/25 bg-ivy-soft/50 p-5"
    >
      {/* The total is the payoff — proof that answering one question produced
          something real. But a student cannot act on seventy-three, so the
          list below is three, and says so. Leading with the big number alone
          would repeat the mistake the public page had to fix. */}
      <h3 className="text-balance text-lg font-semibold tracking-tight text-ink">
        <span data-num className="text-ivy-ink">
          {openNow.length}
        </span>{" "}
        {openNow.length === 1 ? "thing is" : "things are"} already open to you.
      </h3>
      <p className="mt-1 text-sm text-ink-soft">
        Matched to your year
        {faculties.length > 0 && " and what you picked"}
        {nearest && (
          <>
            {" · "}the nearest closes in{" "}
            <span data-num className="font-semibold text-ink">
              {nearest.daysToDeadline} days
            </span>
          </>
        )}
        .
      </p>

      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {shown.length === 1
          ? "One to start with"
          : `${shown.length} to start with`}
      </p>
      <ul className="mt-1.5 space-y-1.5">
        {shown.map((o) => (
          <li
            key={o.id}
            className="flex flex-wrap items-baseline gap-x-2 text-sm"
          >
            <span className="font-medium text-ink">{o.name}</span>
            <span className="text-xs text-ink-faint">
              {o.dateConfirmed ? (
                <span data-num>{o.daysToDeadline} days left</span>
              ) : (
                "dates not announced yet"
              )}
            </span>
          </li>
        ))}
      </ul>

      {/* The anti-coercion line. It is also simply true: Opportunities works
          without an analysis, so nothing here is being held hostage. */}
      <p className="mt-3 text-xs leading-relaxed text-ink-soft">
        These are on your dashboard already — you keep them whether or not you
        finish the rest. Carry on and we can also tell you how you compare, and
        what to do first.
      </p>
    </section>
  );
}
