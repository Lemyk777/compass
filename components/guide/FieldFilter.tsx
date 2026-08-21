"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  FACULTIES,
  FACULTY_LABEL,
  type FacultyValue,
} from "@/lib/data/faculties";
import {
  FIELDS_PARAM,
  parseFieldsParam,
  serializeFields,
} from "@/lib/data/guide-fields";

// The field chips. The only interactive control in the guide, and the only
// client state — except it is not state any more: it writes `?f=` and reads it
// back, so the server renders the filtered page and the browser's own history
// holds the filter.
//
// It renders on the list pages, not in the layout. A filter shown on a detail
// page would be a control that visibly does nothing to what is on screen.
//
// `replace`, not `push`: toggling four chips in a row should not cost four
// presses of the back button to undo. `scroll: false` for the same reason —
// narrowing a list you are halfway down should not throw you back to the top.

export function FieldFilter({
  /** The signed-in student's own fields — the default when the URL says nothing. */
  defaultFields,
  signedIn,
}: {
  defaultFields: FacultyValue[];
  signedIn: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const stated = parseFieldsParam(params.get(FIELDS_PARAM) ?? undefined);
  const active = stated ?? defaultFields;
  const showingAll = active.length === 0;

  function write(next: FacultyValue[]) {
    const q = new URLSearchParams(params.toString());
    q.set(FIELDS_PARAM, serializeFields(next));
    router.replace(`${pathname}?${q.toString()}`, { scroll: false });
  }

  const toggle = (f: FacultyValue) =>
    write(active.includes(f) ? active.filter((x) => x !== f) : [...active, f]);

  // Collapsed by default, and this is not a stylistic preference. Eight chips at
  // a 44px touch target wrap to 412px on a 375px screen — half the viewport —
  // and with the section heading above them the first city on /guide/cities
  // started at 888px on an 812px-tall phone. A student opened "Cities" and saw
  // no cities. The control is now one line that states what the filter is doing,
  // and the chips are one tap away.
  const [open, setOpen] = useState(false);

  const summary = showingAll
    ? "Every field"
    : active.map((f) => FACULTY_LABEL[f]).join(", ");

  return (
    <section
      aria-labelledby="guide-fields-heading"
      className="rounded-2xl border border-line bg-card px-4 py-3 sm:px-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        {/* A `p`, not an `h2`. This labels a control, not a section of the
            page, and as an h2 it rendered at 15px among page headings at 22 —
            the same inversion `PageContents` and the rail panels had. The
            `aria-labelledby` above still points at it, so the region keeps its
            accessible name; it simply stops claiming a rank in the outline it
            never held. */}
        <p id="guide-fields-heading" className="min-w-0 text-sm text-ink-soft">
          <span className="font-semibold text-ink">
            {signedIn && stated === null ? "Your fields" : "Showing"}:
          </span>{" "}
          {summary}
        </p>
        <div className="flex shrink-0 items-center gap-3">
          {!showingAll && (
            <button
              type="button"
              onClick={() => write([])}
              className="inline-flex min-h-11 items-center text-xs font-medium text-ink-faint underline-offset-2 transition-colors hover:text-ink hover:underline focus-visible:focus-ring"
            >
              Show everything
            </button>
          )}
          <button
            type="button"
            aria-expanded={open}
            aria-controls="guide-fields-chips"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex min-h-11 items-center text-xs font-medium text-accent underline-offset-2 transition-colors hover:underline focus-visible:focus-ring"
          >
            {open ? "Done" : showingAll ? "Narrow it" : "Change"}
          </button>
        </div>
      </div>

      {open && (
        // Opening is a state change, so it moves rather than snaps. The keyframe
        // is the project's own `fade-up`, and the global reduced-motion guard in
        // globals.css collapses it to nothing for anyone who asked for that.
        <div
          id="guide-fields-chips"
          className="animate-fade-up [animation-duration:220ms]"
        >
          <p className="mt-2 text-sm text-ink-soft">
            Narrows every step of the guide. Nothing here is saved to your
            profile.
          </p>
          {/* The chips themselves do not stagger. A per-chip delay holds each one
              at opacity 0 until its turn, which makes a control's visibility
              depend on an animation running — the container's single fade says
              the same thing without that. */}
          <ul className="mt-2.5 flex flex-wrap gap-2">
            {FACULTIES.map((f) => {
              const on = active.includes(f.value);
              return (
                <li key={f.value}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(f.value)}
                    className={`h-11 rounded-full border px-4 text-sm font-medium transition-[background-color,border-color,color,transform] duration-200 ease-out active:scale-[0.96] active:duration-75 focus-visible:focus-ring motion-reduce:transform-none motion-reduce:transition-none ${
                      on
                        ? "border-accent bg-accent-soft text-accent-ink"
                        : "border-line bg-surface text-ink-soft hover:border-ink/30 hover:text-ink"
                    }`}
                  >
                    {FACULTY_LABEL[f.value]}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
