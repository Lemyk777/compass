"use client";

import { useEffect, useState } from "react";
import Link from "@/components/ui/Link";

// THE THREAD, PRESENT ON EVERY SCREEN.
//
// The complaint was never about the entrance — "I get more confused the more I
// use the site" is about every page. A guided route that hands a student to a
// section and stops leaves them alone in the library one step later. This is the
// only shape that never disappears.
//
// It is the compass needle, and the product is called Compass: not a new thing
// to learn, but the product finally doing what its name says.
//
// RULES, each a way the obvious version fails:
//
// 1. **It speaks about the STUDENT, never about the page.** A caption is
//    worthless; the page already says what it is about.
// 2. **It never repeats itself**, and says nothing rather than filling silence.
// 3. **It waits; it never chases.** No pop-ups, no auto-expansion.
// 4. **The work happens INSIDE it** — the reaction pair is asked here, not on a
//    separate screen. That is the difference between a guide and a caption.
// 5. **It can be dismissed**, to an icon, and the preference lives in
//    localStorage: it is a choice about the UI, not a fact about the person.
// 6. **No entrance animation on anything it says.** A fade-up holds content at
//    opacity 0 until the animation finishes, and this is the guidance.
//
// TWO STRUCTURAL RULES learned in review, both of which had shipped wrong:
//
// * **The body is rendered ONCE.** Rendering it in a desktop aside and again in
//   a mobile sheet put two of everything in the DOM on a phone — two elements
//   with the same id, two `aria-live` regions, and two independent copies of the
//   reaction pair's state. One element; the CLASSES change with the viewport.
// * **The rail starts at `xl`, not `lg`.** A guide subject page already has its
//   own `lg` rail, and nesting a second one inside it left 256px of prose at
//   1024px — buying a column WITH the line length, which is the inversion of
//   the rule this codebase is built on.
export function Companion({
  stationIndex,
  stationTotal,
  stationLabel,
  said,
  move,
  pair,
}: {
  stationIndex: number;
  stationTotal: number;
  stationLabel: string;
  /** What we noticed. Null renders NOTHING — never a placeholder. */
  said: string | null;
  /**
   * Three states, and they are three because collapsing them produced a control
   * urging a student toward the page they were already on:
   *
   * - an object — render it;
   * - `"deferred"` — we can no longer judge the move honestly (the agenda facts
   *   live in the plan), so hand over and say so;
   * - `null` — this PAGE owns the move and renders its own. Show nothing.
   */
  move: { label: string; href: string; why: string } | "deferred" | null;
  /** Server-rendered, so the beats registry never crosses into this bundle. */
  pair: React.ReactNode;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);
  // Read after mount: localStorage does not exist on the server, and reading it
  // during render would make the first paint disagree with hydration.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(DISMISSED_KEY) === "1");
    } catch {
      // A blocked storage is not a reason to hide the companion.
    }
    setReady(true);
  }, []);

  // Escape closes the sheet, the same affordance every other dismissible
  // surface in this product has. Bound only while it is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function dismiss() {
    setDismissed(true);
    setOpen(false);
    try {
      window.localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // ignore
    }
  }

  function recall() {
    setDismissed(false);
    try {
      window.localStorage.removeItem(DISMISSED_KEY);
    } catch {
      // ignore
    }
  }

  // Before the preference is known, render nothing rather than the wrong thing:
  // a companion that appears and then vanishes on hydration is worse than one
  // that arrives a frame late.
  if (!ready) return null;

  if (dismissed) {
    return (
      <aside>
        {/* Sticky rather than fixed below xl: a fixed pill floats over whatever
            is at the bottom of the page, which is the thing a student on a
            phone was reaching for. */}
        <div className="sticky bottom-4 flex justify-end xl:top-20 xl:justify-start">
          <button
            type="button"
            onClick={recall}
            aria-label="Show the compass"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-card text-ink-soft shadow-card transition-colors hover:border-accent hover:text-ink focus-visible:focus-ring"
          >
            <Needle />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside
      // ONE element. Below xl it sits at the foot of the flow as a dock; from
      // xl it becomes the sticky rail in the column that was gutter anyway.
      // `top-20` because StudentNav is sticky and ~57px tall — the same anchor
      // DetailShell's aside uses.
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card xl:sticky xl:inset-x-auto xl:bottom-auto xl:top-20 xl:rounded-2xl xl:border xl:border-accent/40 xl:shadow-card"
    >
      {/* The toggle exists only below xl; the rail is always open. It comes
          FIRST in the DOM so a screen reader meets the control before the
          region it controls. */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={PANEL_ID}
        className="flex min-h-11 w-full items-center gap-2.5 px-4 py-2.5 text-left focus-visible:focus-ring xl:hidden"
      >
        <span className="text-accent-ink">
          <Needle />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm text-ink">
          {open || typeof move !== "object" || move === null
            ? stationLabel
            : move.label}
        </span>
        <span data-num className="shrink-0 text-xs tabular-nums text-ink-faint">
          {stationIndex}/{stationTotal}
        </span>
      </button>

      <div
        id={PANEL_ID}
        className={`max-h-[70vh] overflow-y-auto px-4 pb-4 xl:max-h-none xl:overflow-visible xl:p-5 ${
          open ? "block" : "hidden"
        } xl:block`}
      >
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-accent-ink">
          <span className="hidden xl:inline">
            <Needle />
          </span>
          Step {stationIndex} of {stationTotal} · {stationLabel}
        </p>

        {/* Announced politely rather than by stealing focus. Null renders
            nothing at all — see rule 2. */}
        <div aria-live="polite">
          {said && (
            <p className="mt-2.5 max-w-[46ch] text-[0.95rem] leading-relaxed text-ink">
              {said}
            </p>
          )}
        </div>

        {pair}

        {/* Nothing at all when the page owns the move — not even the rule,
            because a divider above emptiness is still furniture. */}
        {move !== null && (
          <div className="mt-4 border-t border-line pt-3.5">
            {move === "deferred" ? (
              // Past the point where this loader can judge honestly. It says so
              // and hands over, rather than asserting something it cannot check.
              <>
                <p className="max-w-[46ch] text-sm leading-relaxed text-ink-soft">
                  You have things on the go now, so what comes next depends on
                  your dates — and your plan is where those live.
                </p>
                <Link
                  href="/planner"
                  className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-accent-ink underline-offset-4 transition hover:underline focus-visible:focus-ring"
                >
                  Open your plan
                  <span aria-hidden className="ml-1">
                    &rarr;
                  </span>
                </Link>
              </>
            ) : (
              <>
                <p className="max-w-[46ch] text-sm leading-relaxed text-ink-soft">
                  {move.why}
                </p>
                <Link
                  href={move.href}
                  className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-accent-ink underline-offset-4 transition hover:underline focus-visible:focus-ring"
                >
                  {move.label}
                  <span aria-hidden className="ml-1">
                    &rarr;
                  </span>
                </Link>
              </>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={dismiss}
          className="mt-3 inline-flex min-h-11 items-center text-xs text-ink-faint underline-offset-4 transition-colors hover:text-ink-soft hover:underline focus-visible:focus-ring"
        >
          I&rsquo;ll take it from here
        </button>
      </div>
    </aside>
  );
}

const DISMISSED_KEY = "compass.companion.dismissed";
const PANEL_ID = "companion-panel";

/**
 * The compass needle — the product's own instrument rather than a generic
 * chevron. It paints with `currentColor` and sets no colour of its own, so it
 * inherits from the text beside it and cannot drift from it. That is also why
 * it needs no exemption from the fill-as-foreground rule: the colour it takes
 * is already a foreground one.
 */
function Needle() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      aria-hidden
      className="shrink-0"
    >
      <circle
        cx="12"
        cy="12"
        r="9.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        opacity="0.4"
      />
      <path d="M17 7l-3.1 7.9L6 18l3.1-7.9L17 7z" fill="currentColor" />
    </svg>
  );
}
