"use client";

import { cn } from "@/lib/utils";
import React from "react";

// Section + Card are used across nearly every dashboard/report view, so they
// must stay dependency-light. The entrance fade is a CSS keyframe (`.section-in`
// in globals.css) rather than framer-motion — visually identical (opacity + a
// 10px rise over 0.4s), but it ships zero JS and keeps framer out of the shared
// bundle. When a card needs a true reflow (position) animation, use MotionCard
// (components/report/MotionCard.tsx), which scopes framer to that one view.

export function Section({
  title,
  hint,
  children,
  className = "",
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("section-in w-full", className)}>
      <div className="mb-3">
        <h2 className="text-lg font-semibold tracking-tight text-ink">
          {title}
        </h2>
        {hint && <p className="mt-0.5 text-sm text-ink-soft">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

// No hover lift, and this is not a nitpick. A card that rises under the cursor
// is making a promise — "I am one thing, and clicking me does something" — and
// almost none of these are clickable. Every panel on Opportunities and in the
// report lifted identically to the ones that really are links, so the one
// affordance the product had for "this leads somewhere" meant nothing. Links
// keep their own hover (border-accent, a half-step translate); a container that
// merely holds content stays still.
export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line/70 bg-card p-5 shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}
