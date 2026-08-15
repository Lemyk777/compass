"use client";

import { useEffect, useState } from "react";
import Link from "@/components/ui/Link";

// THE THREAD, PRESENT ON EVERY SCREEN.
//
// The owner's complaint was not about the entrance — it was "I get more confused
// the more I use the site", which is about every page. A guided route that hands
// a student to a section and stops leaves them alone in the library one step
// later. This is the only shape that never disappears.
//
// It is the compass needle, and the product is called Compass: not a new thing
// to learn, but the product finally doing what its name says.
//
// SIX RULES, each of which is a way the obvious version fails:
//
// 1. **It speaks about the STUDENT, never about the page.** "You are reading
//    Germany because you said the money matters more than the city" cannot be
//    written in advance — it is derived. A caption is worthless; the page
//    already says what it is about.
// 2. **It never repeats itself.** Every utterance is a function of what changed.
//    When nothing changed it says nothing and shows only the next step — a
//    companion that fills silence with filler is one nobody reads after the
//    first week. Test-enforced in scripts/test-engine.ts.
// 3. **It waits; it never chases.** No pop-ups, no auto-expansion, no "did you
//    know". A rail on desktop, one 44px line on a phone.
// 4. **The work happens INSIDE it.** The reaction pair is asked here, not on a
//    separate screen. That is the whole difference between a guide and a
//    caption, and it is why the pair arrives as a node.
// 5. **It can be dismissed.** "I'll take it from here" collapses it and it does
//    not come back until called. A student who has worked it out should not
//    have to carry a chaperone. The preference lives in localStorage, not in the
//    database: it is a choice about the UI, not a fact about the person — the
//    same reasoning as the values refine.
// 6. **No entrance animation on anything it says.** A fade-up holds content at
//    opacity 0 until the animation finishes, and this is the product's guidance.
//    Same rule, same reason, as NextMoveCard.
//
// Everything heavy is resolved on the server (lib/companion/load.ts) and arrives
// as values and nodes — no prose registry is reachable from here, and a unit
// test fails the build if one ever is.

const DISMISSED_KEY = "compass.companion.dismissed";

export function Companion({
  stationIndex,
  stationTotal,
  stationLabel,
  said,
  moveLabel,
  moveHref,
  moveWhy,
  pair,
}: {
  stationIndex: number;
  stationTotal: number;
  stationLabel: string;
  /** What we noticed. Null renders NOTHING — never a placeholder. */
  said: string | null;
  moveLabel: string;
  moveHref: string;
  moveWhy: string;
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
      <button
        type="button"
        onClick={recall}
        aria-label="Show the compass"
        className="fixed bottom-4 right-4 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-card text-ink-soft shadow-card transition-colors hover:border-accent hover:text-ink focus-visible:focus-ring"
      >
        <Needle />
      </button>
    );
  }

  const body = (
    <>
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-accent-ink">
        <Needle />
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

      <div className="mt-4 border-t border-line pt-3.5">
        <p className="max-w-[46ch] text-sm leading-relaxed text-ink-soft">
          {moveWhy}
        </p>
        <Link
          href={moveHref}
          className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-accent-ink underline-offset-4 transition hover:underline focus-visible:focus-ring"
        >
          {moveLabel}
          <span aria-hidden className="ml-1">
            &rarr;
          </span>
        </Link>
      </div>

      <button
        type="button"
        onClick={dismiss}
        className="mt-3 inline-flex min-h-11 items-center text-xs text-ink-faint underline-offset-4 transition-colors hover:text-ink-soft hover:underline focus-visible:focus-ring"
      >
        I&rsquo;ll take it from here
      </button>
    </>
  );

  return (
    <>
      {/* Desktop: the rail, in the column that was gutter anyway. `top-20`
          because StudentNav is sticky and ~57px tall — the same anchor
          DetailShell's aside uses. */}
      <aside className="hidden lg:block">
        <div className="sticky top-20 rounded-2xl border border-accent/40 bg-card p-5 shadow-card">
          {body}
        </div>
      </aside>

      {/* Phone: ONE line, and it never covers content — the shell reserves its
          height. Tapping opens the sheet. Most of our students are here. */}
      <div className="lg:hidden">
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card">
          {open && (
            <div className="max-h-[70vh] overflow-y-auto px-4 pb-3 pt-4">
              {body}
            </div>
          )}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="flex min-h-11 w-full items-center gap-2.5 px-4 py-2.5 text-left focus-visible:focus-ring"
          >
            <span className="text-accent-ink">
              <Needle />
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-ink">
              {open ? "Close" : moveLabel}
            </span>
            <span
              data-num
              className="shrink-0 text-xs tabular-nums text-ink-faint"
            >
              {stationIndex}/{stationTotal}
            </span>
          </button>
        </div>
        {/* The reserved height. Without it the dock sits on top of the last
            thing on the page, which on a phone is usually the control the
            student was reaching for. */}
        <div aria-hidden className="h-16" />
      </div>
    </>
  );
}

/**
 * The compass needle — the product's own instrument rather than a generic
 * chevron. It paints with `currentColor` and sets no colour of its own, so it
 * inherits from the text beside it and cannot drift from it. That is also why
 * it needs no exemption from the fill-as-foreground rule: the colour it takes
 * is already a foreground one.
 */
function Needle() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden className="shrink-0">
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
