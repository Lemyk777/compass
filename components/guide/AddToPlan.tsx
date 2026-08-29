"use client";

import { useState, useTransition } from "react";
import { addPick, removePick } from "@/app/planner/actions";
import { type PickKind } from "@/lib/data/plan-picks";

export function AddToPlan({
  kind,
  id,
  label,
  signedIn,
  saved: initiallySaved,
  returnTo,
  /** `compact` is for a control that sits inside a card in a list, not in a rail. */
  size = "default",
}: {
  kind: PickKind;
  id: string;
  label: string;
  signedIn: boolean;
  saved: boolean;
  returnTo: string;
  size?: "default" | "compact";
}) {
  const [saved, setSaved] = useState(initiallySaved);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const compact = size === "compact";

  if (!signedIn) {
    return (
      <a
        href={`/auth/login?next=${encodeURIComponent(returnTo)}`}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-card font-medium text-ink-soft transition-colors hover:border-accent hover:text-ink focus-visible:focus-ring ${
          compact ? "min-h-11 px-3 text-xs" : "min-h-12 px-4 text-sm"
        }`}
      >
        <PlusIcon />
        Add to my plan
      </a>
    );
  }

  function toggle() {
    setError(null);
    const next = !saved;
    setSaved(next);
    startTransition(async () => {
      const res = next
        ? await addPick({ kind, id, label })
        : await removePick({ kind, id });
      if (!res.ok) {
        setSaved(!next);
        setError(res.error);
      }
    });
  }

  return (
    <div className={compact ? "" : "space-y-1.5"}>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={saved}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border font-medium transition-colors focus-visible:focus-ring disabled:opacity-60 ${
          compact ? "min-h-11 px-3 text-xs" : "min-h-12 px-4 text-sm"
        } ${
          saved
            ? "border-accent bg-accent-soft text-accent-ink"
            : "border-line bg-card text-ink-soft hover:border-accent hover:text-ink"
        }`}
      >
        {saved ? <CheckIcon /> : <PlusIcon />}
        {saved ? "On your plan" : "Add to my plan"}
      </button>

      {!compact && !saved && !error && (
        <p className="text-xs leading-relaxed text-ink-faint">
          Puts it in your plan so what you decide here becomes what you do next.
        </p>
      )}

      {error && (
        <p role="alert" className="text-xs leading-relaxed text-reach-ink">
          {error}
        </p>
      )}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
