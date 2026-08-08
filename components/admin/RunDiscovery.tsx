"use client";

import { useState, useTransition } from "react";
import { runDiscoveryNow, type RunDiscoveryState } from "@/app/admin/opportunities/actions";
import { Button } from "@/components/ui/Button";

// "Find me more law opportunities, now."
//
// Discovery was a weekly cron and nothing else, so the only way to ask it a
// question was to wait for Tuesday — and the only way to grow the catalog in
// the meantime was for a person to sit and search, which is the work this
// pipeline exists to remove. This runs one target at one angle and reports
// back: what it found, what it queued, and every candidate it threw away with
// the reason, because "found 6, kept 0" on its own is indistinguishable from a
// broken pipeline.
//
// The options arrive as PROPS. The angle list lives in lib/discovery/discover.ts
// next to the Anthropic client and the whole catalog, and importing that here
// would ship both to the browser — the same bundle trap as the catalog itself.

export type RunOption = { value: string; label: string };

export function RunDiscovery({
  targets,
  angles,
}: {
  targets: RunOption[];
  angles: RunOption[];
}) {
  const [state, setState] = useState<RunDiscoveryState | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setState(null);
    startTransition(async () => {
      setState(await runDiscoveryNow(formData));
    });
  }

  return (
    <form action={onSubmit} className="rounded-2xl border border-line bg-card p-4 shadow-card">
      <p className="text-sm font-semibold text-ink">Run discovery now</p>
      <p className="mt-0.5 text-xs text-ink-soft">
        One web search at one angle, screened against the catalog and each candidate&apos;s own
        page. Takes about a minute and costs a few cents. Anything it finds lands in the queue
        below — nothing reaches students without your approval.
      </p>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-ink-soft">
          Where to look
          <select
            name="target"
            defaultValue={targets[0]?.value}
            className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink"
          >
            {targets.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-ink-soft">
          What to look for
          <select
            name="angle"
            defaultValue={angles[0]?.value}
            className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink"
          >
            {angles.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </label>

        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Searching…" : "Search"}
        </Button>
      </div>

      {pending && (
        <p className="mt-3 text-xs text-ink-faint">
          Searching, reading each candidate&apos;s official page and re-extracting its deadline.
          Don&apos;t close the tab.
        </p>
      )}

      {state && (
        <div className="mt-3 rounded-xl border border-line bg-surface p-3">
          <p className={`text-sm font-semibold ${state.ok ? "text-ink" : "text-red-700"}`}>
            {state.message}
          </p>
          {state.lines.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {state.lines.map((line, i) => (
                <li key={i} className="whitespace-pre-wrap text-xs text-ink-soft">
                  {line}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}
