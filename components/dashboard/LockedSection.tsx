"use client";

import { useState, type ReactNode } from "react";
import { ButtonLink } from "@/components/ui/Button";

// A gated dashboard section: the real content is teased (blurred) behind a lock,
// and an instant promo modal pops up on entry explaining what the section
// unlocks and prompting the student to add their college list. "Not now"
// dismisses the modal to reveal the blurred teaser; re-entering re-opens it.
export function LockedSection({
  eyebrow,
  headline,
  description,
  bullets,
  ctaLabel,
  ctaHref,
  teaser,
  art,
}: {
  eyebrow: string;
  headline: string;
  description: string;
  bullets: string[];
  ctaLabel: string;
  ctaHref: string;
  teaser: ReactNode; // faux content shown blurred behind the lock
  art: ReactNode; // small preview shown in the modal
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="relative">
      {/* Blurred teaser */}
      <div aria-hidden className="pointer-events-none select-none blur-[5px] saturate-[0.85] opacity-70">
        {teaser}
      </div>

      {/* Lock overlay over the teaser */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-card shadow-card">
          <LockIcon />
        </span>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-xl border border-line bg-card px-4 py-2 text-sm font-medium text-ink shadow-card transition-colors hover:border-ink/30"
          >
            What&apos;s this?
          </button>
        )}
      </div>

      {/* Instant promo modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-line bg-card shadow-lift">
            <div className="grid md:grid-cols-[1.1fr_0.9fr]">
              {/* Left: pitch */}
              <div className="p-7">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-accent">
                    <LockIcon small />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                    {eyebrow}
                  </span>
                  <span className="rounded-full border border-accent/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                    Locked
                  </span>
                </div>

                <h2 className="mt-4 text-2xl font-semibold leading-tight tracking-tight text-ink">
                  {headline}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{description}</p>

                <ul className="mt-5 space-y-2.5">
                  {bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-ink">
                      <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-accent text-white" style={{ height: 18, width: 18 }}>
                        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12l5 5L20 7" />
                        </svg>
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>

                <div className="mt-7 flex flex-wrap items-center gap-4">
                  <ButtonLink href={ctaHref} size="md">
                    {ctaLabel}
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </ButtonLink>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="text-sm font-medium text-ink-faint transition-colors hover:text-ink"
                  >
                    Not now
                  </button>
                </div>
              </div>

              {/* Right: preview art */}
              <div className="relative hidden border-l border-line bg-surface/60 p-6 md:block">
                <div className="pointer-events-none select-none">{art}</div>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card/70 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LockIcon({ small = false }: { small?: boolean }) {
  return (
    <svg
      className={small ? "h-3.5 w-3.5" : "h-5 w-5 text-ink-soft"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
      <circle cx="12" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}
