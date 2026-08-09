"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import React from "react";

// A Card variant that smoothly animates its POSITION when the surrounding list
// reflows (e.g. switching category tabs on the Opportunities view: sections
// appear/disappear and the rest slide into place). This is the one place that
// genuinely needs framer-motion's FLIP layout animation — keeping it in its own
// module means framer is loaded ONLY on the views that import MotionCard, and
// never rides along in the shared Section/Card chunk.
//
// `layout="position"` animates only position (not size), so text inside doesn't
// squash-then-stretch on reflow — identical to the previous Card behaviour.
export function MotionCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  // The one framer feature this file exists for is the layout FLIP, and it is
  // pure movement — precisely what a reader who has asked for reduced motion is
  // asking not to be shown. The CSS guard in globals.css cannot switch it off:
  // framer drives inline transforms from JavaScript, so a rule about CSS
  // animation durations never reaches it.
  //
  // `useReducedMotion` here rather than the `MotionSafe` provider used
  // elsewhere, because this renders once per card — dozens of times on the
  // opportunities list — and that would be one context provider per card.
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      layout={reduceMotion ? false : "position"}
      className={cn(
        // No hover lift — see the note on Card in Section.tsx. These two must
        // not drift apart: they are the same surface, and a reader cannot be
        // expected to learn that one kind of panel reacts and the other doesn't.
        "rounded-2xl border border-line/70 bg-card p-5 shadow-sm",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}
