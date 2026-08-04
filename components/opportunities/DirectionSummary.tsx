"use client";

import { motion, type Variants } from "framer-motion";
import { FACULTY_LABEL, type FacultyValue } from "@/lib/data/faculties";

// The "boarding pass": a compact line that fills in as the student answers the
// two questions, so the surface reads as one journey rather than a stack of
// prompts. Deliberately non-coercive — it shows what's known and gently marks
// what isn't, never a "profile 30% complete" bar.
//
// Animations are done with framer-motion (already in the bundle on this view via
// MotionCard) rather than a copied third-party component, so they match the
// app's own motion language: a soft spring, a short stagger, nothing flashy.

const EASE = [0.22, 1, 0.36, 1] as const;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};
const segment: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 320, damping: 26 },
  },
};

export function DirectionSummary({
  grade,
  faculties,
  nearest,
  totalOpen,
}: {
  grade: number | null;
  faculties: FacultyValue[];
  nearest: { name: string; days: number } | null;
  totalOpen: number;
}) {
  const fieldLabel =
    faculties.length === 0
      ? null
      : faculties.length <= 2
        ? faculties.map((f) => FACULTY_LABEL[f]).join(" · ")
        : `${faculties.length} fields`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="overflow-hidden rounded-2xl border border-ivy/20 bg-gradient-to-br from-ivy-soft/70 via-card to-accent-soft/40 p-4 sm:p-5"
    >
      <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ivy-ink/70">
        Your direction, so far
      </p>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm"
      >
        <Segment done={grade != null}>
          {grade != null ? (
            <>
              Year <span data-num>{grade}</span>
            </>
          ) : (
            "add your year"
          )}
        </Segment>
        <Arrow />
        <Segment done={fieldLabel != null}>{fieldLabel ?? "pick a field"}</Segment>
        {nearest && (
          <>
            <Arrow />
            <Segment done accent>
              next: {nearest.name} ·{" "}
              <span data-num>{nearest.days}</span>d
            </Segment>
          </>
        )}
      </motion.div>
      {grade != null && totalOpen > 0 && (
        <motion.p
          variants={segment}
          initial="hidden"
          animate="show"
          className="mt-2.5 text-xs text-ink-soft"
        >
          <span data-num className="font-semibold text-ink">
            {totalOpen}
          </span>{" "}
          open to you right now.
        </motion.p>
      )}
    </motion.div>
  );
}

function Segment({
  children,
  done,
  accent,
}: {
  children: React.ReactNode;
  done?: boolean;
  accent?: boolean;
}) {
  return (
    <motion.span
      variants={segment}
      layout
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors ${
        accent
          ? "bg-ivy text-white"
          : done
            ? "bg-card text-ink shadow-sm ring-1 ring-line/60"
            : "border border-dashed border-ink/25 text-ink-faint"
      }`}
    >
      {children}
    </motion.span>
  );
}

function Arrow() {
  return (
    <motion.span variants={segment} className="text-ink-faint" aria-hidden>
      &rarr;
    </motion.span>
  );
}
