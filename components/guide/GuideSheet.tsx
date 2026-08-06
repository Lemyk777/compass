"use client";

import { useEffect, useRef } from "react";

// The detail window behind every guide card.
//
// The guide used to be one long scroll: every sphere of work and every city
// fully expanded, one after another, so finding anything meant reading
// everything. Cards now carry the one line that lets you choose, and this holds
// the depth — opened deliberately, one subject at a time.
//
// Behaviour is copied from OpportunityDetail on purpose (Escape closes, the
// backdrop closes, the page behind stops scrolling, focus lands inside and
// returns to whatever opened it). Two different modal idioms in one product is
// how a site starts feeling like several sites.

export function GuideSheet({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Read onClose through a ref so the effect below can run ONCE. Callers pass an
  // inline arrow (`onClose={() => setOpen(null)}`), which is a new function on
  // every parent render; with `onClose` in the dependency list the whole setup
  // tore down and re-ran each time — re-focusing the panel and yanking focus out
  // of whatever control the user was using inside the sheet.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-sheet-title"
      onMouseDown={(e) => {
        // Backdrop click closes; a drag that ends on the backdrop does not.
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
    >
      {/* Same entrance as OpportunityDetail, and for the same reason: one modal
          idiom. `animate-fade-up` is the project's own keyframe — the
          `animate-in`/`zoom-in-95` utilities both sheets used to carry belong to
          tailwindcss-animate, which is not installed, so neither animated at
          all. The override keeps the ~200ms these were written for. */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-t-2xl border border-line bg-card shadow-card outline-none animate-fade-up [animation-duration:220ms] sm:max-h-[88vh] sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2
              id="guide-sheet-title"
              className="text-lg font-semibold leading-snug text-ink"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-sm text-ink-soft">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 shrink-0 rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-surface hover:text-ink focus-visible:focus-ring"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

/** A labelled block inside a sheet — one idea, one heading. */
export function SheetBlock({
  label,
  children,
  tone = "plain",
}: {
  label: string;
  children: React.ReactNode;
  tone?: "plain" | "warn" | "good";
}) {
  const cls =
    tone === "warn"
      ? "border-reach/30 bg-reach-soft/40"
      : tone === "good"
        ? "border-accent/35 bg-accent-soft/25"
        : "border-line bg-surface/60";
  return (
    <div className={`rounded-xl border p-3.5 ${cls}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
        {label}
      </p>
      <div className="mt-1 text-sm leading-relaxed text-ink-soft">{children}</div>
    </div>
  );
}
