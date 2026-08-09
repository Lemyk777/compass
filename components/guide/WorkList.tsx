"use client";

import { useEffect, useState } from "react";
import { GuideCard } from "@/components/guide/parts";
import { ValuesRefine } from "@/components/opportunities/ValuesRefine";
import type { CareerArea } from "@/lib/data/careers";
import {
  rankAreasByValues,
  scoreValues,
  type ValuesAnswers,
} from "@/lib/data/values";

// The areas-of-work list. Client only because of one thing: the optional values
// refine reorders it, and the answers live in localStorage.
//
// It takes the areas as PROPS rather than importing careers.ts. The whole
// registry is ~500 lines of prose and every byte of it used to ship to the
// browser with the old single-page guide; this way only the matched subset
// travels, and the same trick as the opportunities catalog keeps a dataset out
// of a route's bundle. The hrefs are built on the server for the same reason —
// `areaSlug` lives next to the data.

const VALUES_KEY = "compass.work-values.v1";

export type WorkGroup = {
  faculty: string;
  label: string;
  /** `href` and `morph` are built on the server — `areaSlug` lives with the data. */
  areas: { area: CareerArea; href: string; morph: string }[];
};

export function WorkList({ groups }: { groups: WorkGroup[] }) {
  const [values, setValues] = useState<ValuesAnswers>({});

  // Shared with the answers given anywhere else in the product — same key, so a
  // student never answers these twice.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(VALUES_KEY);
      if (raw) setValues(JSON.parse(raw) as ValuesAnswers);
    } catch {
      // Blocked or corrupt store just means no refine. Never a crash.
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
      // Applies for this visit; just won't be remembered.
    }
  }

  const scores = scoreValues(values);

  return (
    <div className="space-y-6">
      <ValuesRefine
        answers={values}
        onAnswer={(questionId, optionId) =>
          persist({ ...values, [questionId]: optionId })
        }
        onClear={() => persist({})}
      />

      {groups.map((g) => {
        const byTitle = new Map(g.areas.map((a) => [a.area.title, a]));
        const ranked = rankAreasByValues(
          g.areas.map((a) => a.area),
          scores,
        );
        return (
          // A group label used to be 12px and `ink-faint` — smaller and paler
          // than the 14px body inside the very cards it was labelling, which is
          // a label the eye finds after the content instead of before it. It is
          // the heading of eight sections in a 39-card list, so it gets a rule
          // and a size above what it groups: 48px and a hairline between fields,
          // 10px between cards inside one.
          <section
            key={g.faculty}
            className="space-y-3 border-t border-line pt-6"
          >
            <h2 className="text-base font-semibold tracking-tight text-ink">
              {g.label}
            </h2>
            <ul className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {ranked.map((r) => {
                const row = byTitle.get(r.area.title);
                return (
                  <li key={r.area.title}>
                    <GuideCard
                      href={row?.href ?? "/guide/work"}
                      transitionName={row?.morph}
                      title={r.area.title}
                      line={r.area.what}
                      badge={r.fits ? "Closest to what you said" : undefined}
                      emphasis={r.fits}
                      cta={`${r.area.roles.length} jobs inside`}
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
