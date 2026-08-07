"use client";

import { useMemo, useState } from "react";
import {
  INTEREST_QUIZ,
  topFacultiesFromQuiz,
  type QuizAnswers,
} from "@/lib/data/interest-quiz";
import { FACULTY_LABEL, type FacultyValue } from "@/lib/data/faculties";
import { careerAreaTitles } from "@/lib/data/career-titles";

// The optional "not sure what you want?" quiz. One question at a time (a wall of
// six is the intake we're avoiding), a progress dot row, then a result the
// student can edit before it becomes their field selection. Deterministic — the
// scoring lives in lib/data/interest-quiz.ts and there is no model call.
//
// Self-contained (its own card styling, no dashboard-only imports) so the same
// component can later sit on the public /opportunities page too.

export function InterestQuiz({
  onComplete,
  onCancel,
}: {
  /** The student accepted a set of fields — apply and persist them. */
  onComplete: (faculties: FacultyValue[]) => void;
  /** Back out to picking fields by hand. */
  onCancel: () => void;
}) {
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [step, setStep] = useState(0);
  const total = INTEREST_QUIZ.length;
  const done = step >= total;

  function answer(optionId: string) {
    const q = INTEREST_QUIZ[step];
    setAnswers((a) => ({ ...a, [q.id]: optionId }));
    setStep((s) => s + 1);
  }

  if (done) {
    return (
      <QuizResults
        answers={answers}
        onComplete={onComplete}
        onRetake={() => {
          setAnswers({});
          setStep(0);
        }}
        onCancel={onCancel}
      />
    );
  }

  const q = INTEREST_QUIZ[step];
  return (
    <div className="rounded-2xl border border-line bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-faint">
          Find your direction · <span data-num>{step + 1}</span> of{" "}
          <span data-num>{total}</span>
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-medium text-ink-faint underline-offset-2 hover:text-ink hover:underline focus-visible:focus-ring"
        >
          I&rsquo;ll pick myself
        </button>
      </div>

      {/* Progress dots — cheap, and they promise the end is near. */}
      <div className="mt-3 flex gap-1.5" aria-hidden>
        {INTEREST_QUIZ.map((qq, i) => (
          <span
            key={qq.id}
            className={`h-1.5 flex-1 rounded-full ${
              i < step ? "bg-accent" : i === step ? "bg-accent/50" : "bg-line"
            }`}
          />
        ))}
      </div>

      <p className="mt-4 text-base font-semibold text-ink">{q.prompt}</p>
      <div className="mt-3 space-y-2">
        {q.options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => answer(o.id)}
            className="block w-full rounded-xl border border-line bg-card px-4 py-3 text-left text-sm text-ink transition-colors hover:border-accent hover:bg-accent-soft/40 focus-visible:focus-ring"
          >
            {o.label}
          </button>
        ))}
      </div>

      {step > 0 && (
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="mt-4 text-xs font-medium text-ink-soft underline-offset-2 hover:text-ink hover:underline focus-visible:focus-ring"
        >
          &larr; Back
        </button>
      )}
    </div>
  );
}

function QuizResults({
  answers,
  onComplete,
  onRetake,
  onCancel,
}: {
  answers: QuizAnswers;
  onComplete: (faculties: FacultyValue[]) => void;
  onRetake: () => void;
  onCancel: () => void;
}) {
  const suggested = useMemo(() => topFacultiesFromQuiz(answers, 3), [answers]);
  // The result is a starting point, not a verdict — let the student drop any of
  // the three before it becomes their filter.
  const [selected, setSelected] = useState<FacultyValue[]>(suggested);
  const toggle = (f: FacultyValue) =>
    setSelected((s) => (s.includes(f) ? s.filter((x) => x !== f) : [...s, f]));

  if (suggested.length === 0) {
    // Every answer scored zero somehow (shouldn't happen with the current data,
    // but never dead-end): send them back to picking by hand.
    return (
      <div className="rounded-2xl border border-line bg-card p-5 shadow-card">
        <p className="text-sm text-ink-soft">
          That didn&rsquo;t point anywhere clearly — no problem, pick the fields
          that appeal to you instead.
        </p>
        <div className="mt-3 flex gap-2.5">
          <button
            type="button"
            onClick={onRetake}
            className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-ink transition-colors hover:border-ink/30 focus-visible:focus-ring"
          >
            Retake
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="h-10 rounded-xl bg-ink px-4 text-sm font-medium text-white transition-colors hover:bg-ink/90 focus-visible:focus-ring"
          >
            Pick by hand
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-card p-5 shadow-card">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-faint">
        Based on your answers
      </p>
      <h3 className="mt-1.5 text-lg font-semibold leading-snug text-ink">
        These fields look like your direction.
      </h3>
      <p className="mt-1 text-sm text-ink-soft">
        A starting point, not a verdict — drop any that don&rsquo;t fit, then
        we&rsquo;ll show what you can enter in them.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {suggested.map((f, i) => {
          const on = selected.includes(f);
          return (
            <button
              key={f}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(f)}
              className={`inline-flex h-10 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors focus-visible:focus-ring ${
                on
                  ? "border-accent bg-accent-soft text-accent-ink"
                  : "border-line bg-card text-ink-faint line-through hover:border-ink/30"
              }`}
            >
              {i === 0 && on && (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-accent">
                  Top
                </span>
              )}
              {FACULTY_LABEL[f]}
            </button>
          );
        })}
      </div>

      {/* "oh — that's where this goes": the fields alone are abstract, so each
          one shows the AREAS of work it opens. Areas, never a single job title:
          a quiz cannot tell anyone what they should become, and a sphere is a
          claim we can stand behind. The full list of roles lives in the careers
          panel on the page they land on next. */}
      {selected.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-line pt-3.5">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-faint">
            Kinds of work they open
          </p>
          {selected.map((f) => (
            <p key={f} className="text-xs leading-relaxed text-ink-soft">
              <span className="font-medium text-ink">{FACULTY_LABEL[f]}</span>{" "}
              &mdash; {careerAreaTitles(f).join(" · ")}
            </p>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          disabled={selected.length === 0}
          onClick={() => onComplete(selected)}
          className="h-10 rounded-xl bg-ink px-4 text-sm font-medium text-white transition-colors hover:bg-ink/90 focus-visible:focus-ring disabled:opacity-40"
        >
          Show what I can enter &rarr;
        </button>
        <button
          type="button"
          onClick={onRetake}
          className="text-sm font-medium text-ink-soft underline-offset-2 hover:text-ink hover:underline focus-visible:focus-ring"
        >
          Retake
        </button>
      </div>
    </div>
  );
}
