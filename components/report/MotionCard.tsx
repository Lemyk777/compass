"use client";

import { motion } from "framer-motion";
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
  return (
    <motion.div
      layout="position"
      className={cn(
        "rounded-2xl border border-line/70 bg-card p-5 shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
