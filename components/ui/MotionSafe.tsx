"use client";

import { MotionConfig } from "framer-motion";

/**
 * Makes framer-motion obey `prefers-reduced-motion`. It does not on its own.
 *
 * This is the gap the global CSS guard cannot cover, and the reason it is easy
 * to miss: app/globals.css zeroes `animation-duration` and `transition-duration`
 * under the media query, which handles every CSS animation and transition in the
 * product — but framer does not use either. It drives inline `transform` and
 * `opacity` from JavaScript on every frame, so a rule about CSS durations is
 * invisible to it. A reader who has told their operating system that moving
 * content makes them unwell was still getting the spring on the direction band,
 * the cross-fade between the two intake questions, the layout FLIP when the
 * opportunity list reflows, the onboarding step slide and the landing map's
 * country switch — the five places in the product that actually animate.
 *
 * `reducedMotion="user"` is framer's own switch for this: with it set, position
 * and scale animations are dropped for a reader who asked, while opacity still
 * cross-fades, so a swap still reads as a swap rather than as a jump-cut.
 *
 * Mounted inside each component that already imports framer, never at the root.
 * Hoisting it to a shell would be tidier to read and would drag framer into the
 * guide's route bundles, which are server-rendered apart from two islands — the
 * same bundle rule that keeps the catalog out of the client and MotionCard out
 * of the shared Section chunk.
 */
export function MotionSafe({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
