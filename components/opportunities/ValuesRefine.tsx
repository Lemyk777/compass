"use client";

import { useState } from "react";
import {
  VALUES_QUIZ,
  VALUE_LABEL,
  scoreValues,
  topValues,
  type ValuesAnswers,
} from "@/lib/data/values";

// The optional "what do you want out of work?" refine, living inside the
// careers panel — which is itself collapsed by default, so this is two taps
// away from being invisible. Three questions, one at a time, and answering none
// of them costs nothing: the areas simply stay in their curated order.
//
// It never claims to have found anyone's calling. All it says is which spheres
// sit closest to what the student just told us, and the copy keeps saying that
// out loud.

export function ValuesRefine({
  answers,
  onAnswer,
  onClear,
}: {
  answers: ValuesAnswers;
  /** One question answered — the parent persists it. */
  onAnswer: (questionId: string, optionId: string) => void;
  onClear: () => void;
}) {
  const answered = Object.keys(answers).length;
  const [asking, setAsking] = useState(false);
  const [step, setStep] = useState(0);

  function pick(questionId: string, optionId: string) {
    onAnswer(questionId, optionId);
    if (step + 1 >= VALUES_QUIZ.length) {
      setAsking(false);
      setStep(0);
    } else {
      setStep((s) => s + 1);
    }
  }

  if (asking) {
    const q = VALUES_QUIZ[step];
    return (
      <div className="rounded-xl border border-accent/40 bg-accent-soft/20 p-3.5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-faint">
            What you want &middot; <span data-num>{step + 1}</span> of{" "}
            <span data-num>{VALUES_QUIZ.length}</span>
          </p>
          <button
            type="button"
            onClick={() => {
              setAsking(false);
              setStep(0);
            }}
            className="text-xs font-medium text-ink-faint underline-offset-2 hover:text-ink hover:underline focus-visible:focus-ring"
          >
            Skip
          </button>
        </div>

        <div className="mt-2.5 flex gap-1.5" aria-hidden>
          {VALUES_QUIZ.map((qq, i) => (
            <span
              key={qq.id}
              className={`h-1.5 flex-1 rounded-full ${
                i < step ? "bg-accent" : i === step ? "bg-accent/50" : "bg-line"
              }`}
            />
          ))}
        </div>

        <p className="mt-3 text-sm font-semibold text-ink">{q.prompt}</p>
        <div className="mt-2 space-y-1.5">
          {q.options.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => pick(q.id, o.id)}
              className={`block w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors focus-visible:focus-ring ${
                answers[q.id] === o.id
                  ? "border-accent bg-accent-soft text-accent-ink"
                  : "border-line bg-card text-ink hover:border-accent hover:bg-accent-soft/40"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (answered === 0) {
    return (
      <button
        type="button"
        onClick={() => {
          setAsking(true);
          setStep(0);
        }}
        className="w-full rounded-xl border border-dashed border-line px-3.5 py-3 text-left transition-colors hover:border-accent focus-visible:focus-ring"
      >
        <span className="block text-sm font-medium text-ink">
          Not all of these will suit you &mdash; narrow them down
        </span>
        <span className="mt-0.5 block text-xs text-ink-soft">
          Three questions about what you want from work, then the closest areas
          come first. Optional.
        </span>
      </button>
    );
  }

  const chosen = topValues(scoreValues(answers));
  return (
    <div className="rounded-xl border border-line bg-surface/50 px-3.5 py-3">
      <p className="text-xs text-ink-soft">
        <span className="font-medium text-ink">You said you want:</span>{" "}
        {chosen.map((v) => VALUE_LABEL[v]).join(" · ")}
        {answered < VALUES_QUIZ.length && (
          <span className="text-ink-faint">
            {" "}
            (<span data-num>{answered}</span> of{" "}
            <span data-num>{VALUES_QUIZ.length}</span> answered)
          </span>
        )}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-ink-faint">
        The closest areas are first. This is how people usually describe this
        kind of work — pay and security vary a lot by country and employer, and
        nothing here is hidden from you.
      </p>
      <div className="mt-2 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            setAsking(true);
            setStep(0);
          }}
          className="text-xs font-medium text-accent-ink underline-offset-2 hover:underline focus-visible:focus-ring"
        >
          {answered < VALUES_QUIZ.length
            ? "Finish the questions"
            : "Change my answers"}
        </button>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-medium text-ink-faint underline-offset-2 hover:text-ink hover:underline focus-visible:focus-ring"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
