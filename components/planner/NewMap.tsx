"use client";

import { useState, useTransition } from "react";
import { createMap } from "@/app/planner/maps/actions";
import { LIMITS } from "@/lib/limits";

// Starting a map.
//
// The empty state does not say "no maps". It hands over a real question already
// written, because the fastest way to explain what a mind map is for is to give
// someone one that is already started — and because the first blank field is
// where this kind of tool loses people.
const SUGGESTIONS = [
  "Where could I study?",
  "What do I do this summer?",
  "How do I pay for it?",
];

export function NewMap({ empty = false }: { empty?: boolean }) {
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function create(question: string) {
    const q = question.trim();
    if (!q) return;
    setError(null);
    startTransition(async () => {
      const res = await createMap(q);
      if (res.ok) setLabel("");
      else setError(res.error);
    });
  }

  return (
    <div className={empty ? "rounded-2xl border border-line bg-card p-5" : ""}>
      {empty && (
        <>
          <h2 className="text-base font-semibold text-ink">
            Start with a question
          </h2>
          <p className="mt-1 max-w-[54ch] text-sm leading-relaxed text-ink-soft">
            A map is one question broken into branches. Put your options on it,
            and what each one would actually need. Then send any branch to your
            plan when you decide.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                disabled={pending}
                onClick={() => create(s)}
                className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-ink/30 hover:text-ink focus-visible:focus-ring disabled:opacity-40"
              >
                {s}
              </button>
            ))}
          </div>
        </>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          create(label);
        }}
        className={`flex flex-wrap items-center gap-2 ${empty ? "mt-4" : ""}`}
      >
        <label className="min-w-0 flex-1">
          <span className="sr-only">What question is this map about?</span>
          <input
            type="text"
            value={label}
            maxLength={LIMITS.mapLabel}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={empty ? "…or write your own" : "Start another map"}
            className="w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-ink placeholder:text-ink-faint focus-visible:focus-ring"
          />
        </label>
        <button
          type="submit"
          disabled={pending || label.trim().length === 0}
          className="rounded-lg bg-cta px-3 py-1.5 text-xs font-medium text-cta-ink transition-opacity hover:opacity-90 focus-visible:focus-ring disabled:opacity-40"
        >
          Start
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-2 text-xs text-reach-ink">
          {error}
        </p>
      )}
    </div>
  );
}
