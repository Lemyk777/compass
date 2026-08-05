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
  onEditYear,
  onEditFields,
}: {
  grade: number | null;
  faculties: FacultyValue[];
  nearest: { name: string; days: number } | null;
  totalOpen: number;
  /** Re-open the school-year question. Omitted ⇒ the chip is static. */
  onEditYear?: () => void;
  /** Re-open the field question (and with it the interest quiz). */
  onEditFields?: () => void;
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
        {/* Both answers are editable from here. They used to be dead text: the
            questions only ever rendered while an answer was MISSING, so once a
            student answered, there was no way back to change it — and the
            interest quiz, which lives inside the field question, became
            unreachable forever. The answer you can see is the answer you can
            change. */}
        <Segment done={grade != null} onEdit={onEditYear} label="Change your school year">
          {grade != null ? (
            <>
              Year <span data-num>{grade}</span>
            </>
          ) : (
            "add your year"
          )}
        </Segment>
        <Arrow />
        <Segment
          done={fieldLabel != null}
          onEdit={onEditFields}
          label="Change your fields, or take the interest quiz"
        >
          {fieldLabel ?? "pick a field"}
        </Segment>
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
  onEdit,
  label,
}: {
  children: React.ReactNode;
  done?: boolean;
  accent?: boolean;
  onEdit?: () => void;
  label?: string;
}) {
  const cls = `inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
    accent
      ? "bg-ivy text-white"
      : done
        ? "bg-card text-ink shadow-sm ring-1 ring-line/60"
        : "border border-dashed border-ink/25 text-ink-faint"
  }`;

  if (!onEdit) {
    return (
      <motion.span variants={segment} layout className={cls}>
        {children}
      </motion.span>
    );
  }

  return (
    <motion.button
      type="button"
      variants={segment}
      layout
      onClick={onEdit}
      title={label}
      aria-label={label}
      className={`${cls} hover:ring-2 hover:ring-ivy/40 focus-visible:focus-ring`}
    >
      {children}
      <PencilGlyph />
    </motion.button>
  );
}

/** Small affordance so an editable answer doesn't look like static text. */
function PencilGlyph() {
  return (
    <svg
      className="h-3 w-3 opacity-50"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function Arrow() {
  return (
    <motion.span variants={segment} className="text-ink-faint" aria-hidden>
      &rarr;
    </motion.span>
  );
}
