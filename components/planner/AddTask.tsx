"use client";

import { useState, useTransition } from "react";
import { createPlannerItem } from "@/app/planner/actions";
import { LIMITS } from "@/lib/limits";

// One line and an optional date.
//
// The bounds here mirror the server action's, which is where they are actually
// enforced — this is the convenience, not the gate. The date is optional on
// purpose: "write the personal statement" is a real task with no deadline, and
// demanding one would make the student invent a date we would then draw on a
// calendar as though we stood behind it.
export function AddTask() {
  const [title, setTitle] = useState("");
  const [dueISO, setDueISO] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    setError(null);
    startTransition(async () => {
      const res = await createPlannerItem({ title: t, dueISO: dueISO || null });
      if (res.ok) {
        setTitle("");
        setDueISO("");
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-dashed border-line p-3"
    >
      <label className="block">
        <span className="sr-only">What do you need to do?</span>
        <input
          type="text"
          value={title}
          maxLength={LIMITS.plannerTitle}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add something of your own"
          className="w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-ink placeholder:text-ink-faint focus-visible:focus-ring"
        />
      </label>
      <div className="mt-2 flex items-center gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">When is it due? Optional.</span>
          <input
            type="date"
            value={dueISO}
            onChange={(e) => setDueISO(e.target.value)}
            className="w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-xs text-ink focus-visible:focus-ring"
          />
        </label>
        <button
          type="submit"
          disabled={pending || title.trim().length === 0}
          className="shrink-0 rounded-lg bg-cta px-3 py-1.5 text-xs font-medium text-cta-ink transition-opacity hover:opacity-90 focus-visible:focus-ring disabled:opacity-40"
        >
          Add
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-reach-ink">
          {error}
        </p>
      )}
    </form>
  );
}
