"use client";

import { useEffect, useRef, useState } from "react";
import type {
  Competition,
  ExtracurricularsPlan,
  Opportunity,
} from "@/lib/data/key-dates";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import { graduationYearFromGrade } from "@/lib/data/eligibility";
import { FACULTIES, FACULTY_LABEL, type FacultyValue } from "@/lib/data/faculties";
import { downloadIcs } from "@/lib/calendar/ics";

// The public eligibility checker.
//
// This is deliberately NOT a browsable catalog, and the reason is in
// docs/OPPORTUNITIES_RESEARCH.md: every large trial of "show students' options"
// measured zero, including one across 800,000 students. What moved behaviour was
// removing ambiguity about eligibility and removing the work. So:
//
//   • one question, answered in one tap, before anything is asked of them;
//   • the answer is a VERDICT ("you can enter 5 of these now"), not a list;
//   • five results, never ninety-six — choice overload is worst exactly where
//     preference uncertainty is highest, which is a 12-year-old;
//   • the primary action is "put the dates in my calendar", not "sign up".
//
// Matching runs through the same buildExtracurriculars the dashboard uses, so
// the public answer and the logged-in answer can never disagree.

const SHOWN = 5;

/** School years we ask about. 5 is the youngest entry the catalog can serve. */
const GRADES = [5, 6, 7, 8, 9, 10, 11, 12];

type Step = "grade" | "results";

export function EligibilityChecker({
  /**
   * Live rows from Supabase — today that means partner-posted opportunities.
   * Passed in by the server page rather than fetched here, so this component
   * stays a pure client renderer and the anon key never has to reach it.
   */
  live,
}: {
  live?: Competition[];
} = {}) {
  // `today` resolves on the client — the countdown depends on the visitor's
  // clock, and a server-rendered one would hydrate wrong.
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => setToday(new Date()), []);

  const [grade, setGrade] = useState<number | null>(null);
  const [fields, setFields] = useState<FacultyValue[]>([]);
  const step: Step = grade == null ? "grade" : "results";

  const resultsRef = useRef<HTMLDivElement>(null);

  // Lazy-load the matching engine so the ~2,700-entry catalog is a separate
  // async chunk, not part of this public page's initial JS. Everyone starts at
  // "emerging" (factors: []), exactly right for a beginner: accessible first.
  const [plan, setPlan] = useState<ExtracurricularsPlan | null>(null);
  useEffect(() => {
    if (!today || grade == null) {
      setPlan(null);
      return;
    }
    let cancelled = false;
    import("@/lib/data/key-dates").then((m) => {
      if (cancelled) return;
      setPlan(
        m.buildExtracurriculars({
          today,
          faculties: fields,
          factors: [],
          graduationYear: graduationYearFromGrade(grade, today),
          liveCompetitions: live,
        }),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [today, grade, fields, live]);

  // Open now vs later. The "later" ones stay knowable — a younger student
  // should be able to see what they are aiming at — but they never compete for
  // attention with what is actionable today.
  const openNow = plan?.items.filter((o) => !o.notYetEligible) ?? [];
  const later = plan?.items.filter((o) => o.notYetEligible) ?? [];
  // Actionable first. A real deadline earns the top spot (the promise on this
  // page is "and when they close"), then the ones with no deadline at all —
  // which a student can start tonight — and only then the "dates TBA" rows we
  // cannot say anything useful about yet.
  const rank = (o: Opportunity) =>
    o.dateConfirmed ? 0 : o.alwaysOpen ? 1 : 2;
  const shown = [...openNow].sort((a, b) => rank(a) - rank(b)).slice(0, SHOWN);
  // The soonest real deadline on screen — the minimum, not the first one we
  // happen to render.
  const nearest = shown
    .filter((o) => o.dateConfirmed)
    .reduce<Opportunity | null>(
      (best, o) => (best == null || o.daysToDeadline < best.daysToDeadline ? o : best),
      null,
    );

  function pickGrade(g: number) {
    setGrade(g);
    // Let the results paint, then bring them into view.
    //
    // The reduced-motion check has to be here, in JS, and that is the whole
    // point of the line. globals.css sets `scroll-behavior: auto !important`
    // under the media query, and it does nothing to this call: an explicit
    // `behavior` in the options wins over the CSS property by spec. So the one
    // scripted movement in the product was the one piece of motion ignoring the
    // guard every animation respects — on the public front door, where a
    // stranger meets us first, and for the reader who has told the operating
    // system that moving content makes them unwell.
    requestAnimationFrame(() =>
      resultsRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      }),
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-24 sm:px-6">
      {/* ── The question ───────────────────────────────────────────────────
          One question, eight taps, no account, no email. Everything the
          research says about hassle points at making the first answer free. */}
      <section className="pt-14 sm:pt-20">
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-ink-faint">
          Free · no account
        </p>
        <h1 className="mt-3 text-balance text-[2rem] font-semibold leading-[1.1] tracking-tight text-ink sm:text-[2.75rem]">
          What can you actually enter this year?
        </h1>
        <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-ink-soft sm:text-lg">
          Real competitions with real judges — some of them have been won by
          twelve-year-olds. Tell us one thing and we&rsquo;ll tell you which ones
          are open to you, and when they close.
        </p>

        <fieldset className="mt-9">
          <legend className="text-base font-semibold text-ink">
            What year are you in?
          </legend>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {GRADES.map((g) => {
              const on = g === grade;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => pickGrade(g)}
                  aria-pressed={on}
                  aria-label={`Year ${g}`}
                  className={`h-12 min-w-[3.25rem] rounded-xl border px-4 text-base font-semibold transition-[background-color,border-color,color,transform] duration-200 focus-visible:focus-ring active:scale-[0.97] ${
                    on
                      ? "border-ink bg-ink text-white"
                      : "border-line bg-card text-ink hover:border-ink/30"
                  }`}
                >
                  <span data-num>{g}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-sm text-ink-faint">
            Your last year of school counts as 12 here, even if your school ends
            at 11.
          </p>
        </fieldset>
      </section>

      {/* ── The verdict ─────────────────────────────────────────────────── */}
      <div ref={resultsRef} className="scroll-mt-6">
        {step === "results" && plan && (
          <section aria-live="polite" className="mt-14">
            <Verdict
              shown={shown.length}
              eligible={openNow.length}
              grade={grade!}
              nearestDays={nearest?.daysToDeadline}
            />

            {/* Refinement comes AFTER the answer, never before it. They already
                got something; this only sharpens it. */}
            <PageSection
              title="Into something in particular?"
              hint="Optional — it only sharpens the list above."
            >
              <FieldFilter value={fields} onChange={setFields} />
            </PageSection>

            <PageSection
              title="Start with these"
              hint="Tap a name to see what it is, who it's for and what it costs."
              count={shown.length}
            >
              <ul className="space-y-3">
                {shown.map((o, i) => (
                  <li
                    key={o.id}
                    className="animate-fade-up"
                    // Stagger by 45ms — enough to read as a sequence, short
                    // enough that the fifth card is not late.
                    style={{ animationDelay: `${i * 45}ms`, animationFillMode: "backwards" }}
                  >
                    <OpportunityCard o={o} />
                  </li>
                ))}
              </ul>

              {shown.length === 0 && (
                <p className="rounded-2xl border border-line bg-card p-6 text-base text-ink-soft shadow-card">
                  Nothing in those subjects is open to year {grade} right now.
                  Try turning the subjects off, or come back in September —
                  that&rsquo;s when most of them open for the year.
                </p>
              )}
            </PageSection>

            {/* Everything not yet open, stated as a fact rather than offered as
                a second list to wade through. */}
            {later.length > 0 && (
              <PageSection title="Opens up later">
                <p className="text-[0.95rem] leading-relaxed text-ink-soft">
                  <span data-num className="font-semibold text-ink">
                    {later.length}
                  </span>{" "}
                  more become available as you move up the school — we&rsquo;ll
                  put them on this list the year you can enter them.
                </p>
              </PageSection>
            )}

            <CalendarCta items={shown} />
          </section>
        )}
      </div>
    </div>
  );
}

/**
 * The one line that is the whole product: you, specifically, can enter these.
 *
 * The headline counts what is ON SCREEN, not everything that matched. An
 * earlier draft said "you can enter 79 of these" — technically the size of the
 * eligible set, but it is the choice-overload number, and it puts the work back
 * on a twelve-year-old. The full figure stays visible underneath, quietly, so
 * nothing is hidden.
 */
function Verdict({
  shown,
  eligible,
  grade,
  nearestDays,
}: {
  shown: number;
  eligible: number;
  grade: number;
  nearestDays?: number;
}) {
  return (
    <div className="border-l-2 border-ivy pl-5">
      <h2 className="text-balance text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
        <span data-num className="text-ivy-ink">
          {shown}
        </span>{" "}
        you can enter right now.
      </h2>
      <p className="mt-2 text-base text-ink-soft">
        Open to year <span data-num>{grade}</span>, worldwide
        {nearestDays != null && (
          <>
            {" · "}the nearest closes in{" "}
            <span data-num className="font-semibold text-ink">
              {nearestDays} days
            </span>
          </>
        )}
        .
      </p>
      {eligible > shown && (
        <p className="mt-1.5 text-sm text-ink-faint">
          There are <span data-num>{eligible}</span> you can enter in total.
          These are the ones to start with.
        </p>
      )}
    </div>
  );
}

function FieldFilter({
  value,
  onChange,
}: {
  value: FacultyValue[];
  onChange: (v: FacultyValue[]) => void;
}) {
  const toggle = (f: FacultyValue) =>
    onChange(value.includes(f) ? value.filter((x) => x !== f) : [...value, f]);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {FACULTIES.map((f) => {
          const on = value.includes(f.value);
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => toggle(f.value)}
              aria-pressed={on}
              className={`h-11 rounded-full border px-4 text-sm font-medium transition-colors duration-200 focus-visible:focus-ring active:scale-[0.97] ${
                on
                  ? "border-accent bg-accent-soft text-accent-ink"
                  : "border-line bg-card text-ink-soft hover:border-ink/25 hover:text-ink"
              }`}
            >
              {FACULTY_LABEL[f.value]}
            </button>
          );
        })}
      </div>
      {value.length > 0 && (
        <button
          type="button"
          onClick={() => onChange([])}
          className="mt-2.5 text-sm font-semibold text-accent underline-offset-2 hover:underline focus-visible:focus-ring"
        >
          Clear the subjects
        </button>
      )}
    </div>
  );
}

/**
 * One section shell for the whole page, so the answer, the filter, the list and
 * the calendar all sit on the same rhythm instead of being four differently
 * spaced blocks. Same shape as the dashboard's sections — a student who checks
 * this page and then signs in should recognise the layout.
 */
function PageSection({
  title,
  hint,
  count,
  children,
}: {
  title: string;
  hint?: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    // The rule is new; the 40px was always here. This page had the best rhythm
    // of the three student surfaces already — it is where the pattern the guide
    // and the signed-in view have now adopted came from — but it drew no lines,
    // and a stranger meeting the product for the first time is exactly who
    // should not have to infer where one answer ends and the next begins.
    <section className="mt-10 border-t border-line pt-9">
      <div className="mb-3.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="flex items-baseline gap-2 text-base font-semibold tracking-tight text-ink">
          {title}
          {count != null && (
            <span data-num className="text-sm font-normal text-ink-faint">
              ({count})
            </span>
          )}
        </h3>
        {hint && <p className="text-sm text-ink-faint">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

// ── Removing the work ────────────────────────────────────────────────────────
// The single largest effect in the college-access literature is the difference
// between telling someone about a deadline and doing something about it for
// them. This is the cheapest honest version of that: a real calendar file with
// a reminder a week out. Only ever built from CONFIRMED dates.

function CalendarCta({ items }: { items: Opportunity[] }) {
  const datable = items.filter((o) => o.dateConfirmed);
  if (datable.length === 0) return null;
  return (
    <div className="mt-8 rounded-2xl border border-ivy/25 bg-ivy-soft/60 p-5">
      <p className="text-base font-semibold text-ink">
        {datable.length === 1
          ? "Put that deadline in your calendar"
          : `Put all ${datable.length} deadlines in your calendar`}
      </p>
      <p className="mt-1 text-[0.95rem] leading-relaxed text-ink-soft">
        {datable.length === 1
          ? "A calendar file with a reminder a week before it closes. Nothing to sign up for."
          : "One file, every date above, with a reminder a week before each. Nothing to sign up for."}
      </p>
      <button
        type="button"
        onClick={() => downloadIcs(datable)}
        className="mt-4 inline-flex h-12 items-center rounded-xl bg-ivy px-5 text-[0.95rem] font-medium text-white transition-colors hover:bg-ivy-ink focus-visible:focus-ring"
      >
        Download the calendar file
      </button>
    </div>
  );
}

