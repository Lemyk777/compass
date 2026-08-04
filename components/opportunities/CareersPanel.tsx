"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { careersForFaculties, type Career } from "@/lib/data/careers";
import { FACULTY_LABEL, type FacultyValue } from "@/lib/data/faculties";

// "Where could this lead?" — the careers layer. Optional and collapsed by
// default (the ergonomic rule: only the two questions are ever in the way).
// Once a student has a field, this answers what they could actually become and
// how you get there, sitting right above the opportunities that build toward it.
// Data-free (no key-dates import) so it never pulls the catalog into the bundle.

export function CareersPanel({ faculties }: { faculties: FacultyValue[] }) {
  const groups = careersForFaculties(faculties);
  const [open, setOpen] = useState(false);
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
            Real careers, what they&rsquo;re actually like, and the path in —
            optional
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
              {groups.map((g) => (
                <div key={g.faculty}>
                  {groups.length > 1 && (
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-faint">
                      {FACULTY_LABEL[g.faculty]}
                    </p>
                  )}
                  <ul className="mt-2 space-y-2.5">
                    {g.careers.map((c) => (
                      <CareerRow key={c.title} c={c} />
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

function CareerRow({ c }: { c: Career }) {
  return (
    <li className="rounded-xl border border-line bg-surface/50 p-3.5">
      <p className="text-sm font-medium text-ink">{c.title}</p>
      <p className="mt-0.5 text-sm leading-relaxed text-ink-soft">{c.what}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">
        <span className="font-medium text-ink-soft">Path:</span> {c.path}
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
