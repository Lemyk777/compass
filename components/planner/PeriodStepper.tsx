"use client";

import { useCallback, useEffect, useRef } from "react";

// One period at a time, stepped with arrows.
//
// The agenda used to render every month it knew about down the page, which
// turned "what is next" — the one question this view exists to answer — into a
// scrolling exercise, and made the answer's position depend on how much the
// student had committed to. A window has the same content and a fixed answer:
// the thing in front of you is the period you are looking at.
//
// It is a CONTROL, not a carousel: nothing moves on its own, and every step is
// something the student asked for. That matters because the same rule governs
// everything else in the planner — a card moves because a button was pressed.
//
// Keyboard: ← and → step, Home returns to the current period. They are bound on
// the group rather than on the document, so the shortcut cannot fire while the
// student is typing a task title somewhere else on the page.
export function PeriodStepper({
  label,
  sub,
  index,
  count,
  onStep,
  onHome,
  atHome,
}: {
  /** The period's own name — "September 2026". */
  label: string;
  /** One line under it: what is in this period. */
  sub: string;
  index: number;
  count: number;
  onStep: (delta: number) => void;
  onHome: () => void;
  /** True when the visible period is the one today falls in. */
  atHome: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onStep(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onStep(1);
      } else if (e.key === "Home") {
        e.preventDefault();
        onHome();
      }
    },
    [onStep, onHome],
  );

  // The label is the thing that changed, so it is what a screen reader should
  // hear — not the whole month's worth of cards re-announced.
  const liveRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (liveRef.current) liveRef.current.textContent = label;
  }, [label]);

  return (
    <div
      ref={ref}
      onKeyDown={onKeyDown}
      role="group"
      aria-label="Period"
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-2xl border border-line bg-card px-4 py-3.5 sm:px-5"
    >
      <div className="min-w-0">
        <h2 className="text-lg font-semibold leading-snug text-ink">{label}</h2>
        <p className="mt-0.5 text-sm leading-relaxed text-ink-soft">{sub}</p>
        <span ref={liveRef} aria-live="polite" className="sr-only" />
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {/* "Now" only appears when it would do something. A control that is
            always there and usually inert teaches people to ignore it. */}
        {!atHome && (
          <button
            type="button"
            onClick={onHome}
            className="mr-1 inline-flex h-11 items-center rounded-xl px-3 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-soft focus-visible:focus-ring"
          >
            Now
          </button>
        )}
        <StepButton
          dir={-1}
          disabled={index <= 0}
          onClick={() => onStep(-1)}
          label="Earlier"
        />
        <span
          data-num
          className="min-w-[3.5rem] text-center text-sm tabular-nums text-ink-soft"
        >
          {index + 1} / {count}
        </span>
        <StepButton
          dir={1}
          disabled={index >= count - 1}
          onClick={() => onStep(1)}
          label="Later"
        />
      </div>
    </div>
  );
}

// Disabled exactly when the step is impossible — the same rule the map's action
// bar follows. A lit control the handler then refuses teaches the structure's
// rules wrongly.
function StepButton({
  dir,
  disabled,
  onClick,
  label,
}: {
  dir: -1 | 1;
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface text-ink-soft transition-colors hover:border-accent hover:text-ink focus-visible:focus-ring disabled:pointer-events-none disabled:opacity-40"
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={dir === -1 ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
      </svg>
    </button>
  );
}
