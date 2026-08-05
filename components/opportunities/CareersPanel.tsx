"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { careerAreasForFaculties, type CareerArea } from "@/lib/data/careers";
import { FACULTY_LABEL, type FacultyValue } from "@/lib/data/faculties";
import { ValuesRefine } from "@/components/opportunities/ValuesRefine";
import {
  rankAreasByValues,
  scoreValues,
  type ValuesAnswers,
} from "@/lib/data/values";

// "Where could this lead?" — the careers layer. Optional and collapsed by
// default (the ergonomic rule: only the two questions are ever in the way).
// Once a student has a field, this answers what they could actually become and
// how you get there, sitting right above the opportunities that build toward it.
// Data-free (no key-dates import) so it never pulls the catalog into the bundle.
//
// It shows AREAS of work with the jobs inside them, never one prescribed
// profession: we can't know which of these a student is reaching for, and a
// sphere plus its roles is both honest and much likelier to contain it.
//
// The optional values refine (ValuesRefine) reorders those areas by what the
// student says they want out of work. It is kept in localStorage, not the
// profile: it changes nothing on the server — not the matched opportunities,
// not eligibility, not the analysis — so a column and a migration would buy
// nothing. Promote it if it ever needs to feed something server-side.

const VALUES_KEY = "compass.work-values.v1";

export function CareersPanel({ faculties }: { faculties: FacultyValue[] }) {
  const groups = careerAreasForFaculties(faculties);
  const [open, setOpen] = useState(false);

  // Read after mount — localStorage doesn't exist during SSR, and starting from
  // {} on both sides keeps hydration honest.
  const [values, setValues] = useState<ValuesAnswers>({});
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(VALUES_KEY);
      if (raw) setValues(JSON.parse(raw) as ValuesAnswers);
    } catch {
      // A blocked or corrupt store just means no refine. Never a crash.
    }
  }, []);

  function persist(next: ValuesAnswers) {
    setValues(next);
    try {
      if (Object.keys(next).length === 0) {
        window.localStorage.removeItem(VALUES_KEY);
      } else {
        window.localStorage.setItem(VALUES_KEY, JSON.stringify(next));
      }
    } catch {
      // The answer still applies for this visit; it just won't be remembered.
    }
  }

  // Cheap enough to redo every render: a handful of areas per field, sorted.
  const scores = scoreValues(values);
  const ranked = groups.map((g) => ({
    faculty: g.faculty,
    rows: rankAreasByValues(g.areas, scores),
  }));

  if (groups.length === 0) return null;

  const fieldNames = groups.map((g) => FACULTY_LABEL[g.faculty]).join(" & ");

  return (
    <div className="rounded-2xl border border-line/70 bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 rounded-2xl p-5 text-left focus-visible:focus-ring"
      >
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-ink">
            Where {fieldNames} can lead
          </span>
          <span className="mt-0.5 block text-xs text-ink-soft">
            Areas of work, the jobs inside each one, and the path in — optional
          </span>
        </span>
        <Chevron open={open} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-5 px-5 pb-5">
              <p className="text-xs leading-relaxed text-ink-faint">
                Directions, not a verdict — nobody picks one of these at 14, and
                most people move between them.
              </p>

              <ValuesRefine
                answers={values}
                onAnswer={(questionId, optionId) =>
                  persist({ ...values, [questionId]: optionId })
                }
                onClear={() => persist({})}
              />

              {ranked.map((g) => (
                <div key={g.faculty}>
                  {ranked.length > 1 && (
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-faint">
                      {FACULTY_LABEL[g.faculty]}
                    </p>
                  )}
                  <ul className="mt-2 space-y-2.5">
                    {g.rows.map((r) => (
                      <CareerAreaRow
                        key={r.area.title}
                        area={r.area}
                        fits={r.fits}
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CareerAreaRow({ area, fits }: { area: CareerArea; fits: boolean }) {
  return (
    <li
      className={`rounded-xl border p-3.5 ${
        fits ? "border-accent/50 bg-accent-soft/25" : "border-line bg-surface/50"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium text-ink">{area.title}</p>
        {fits && (
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-ink">
            Closest to what you said
          </span>
        )}
      </div>
      <p className="mt-0.5 text-sm leading-relaxed text-ink-soft">
        {area.what}
      </p>
      {/* The jobs inside the sphere. A list, not a recommendation — the student
          narrows it, we don't. */}
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {area.roles.map((role) => (
          <li
            key={role}
            className="rounded-lg border border-line bg-card px-2 py-1 text-xs text-ink-soft"
          >
            {role}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs leading-relaxed text-ink-faint">
        <span className="font-medium text-ink-soft">Path:</span> {area.path}
      </p>
    </li>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-5 w-5 shrink-0 text-ink-faint transition-transform duration-200 ${
        open ? "rotate-180" : ""
      }`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
