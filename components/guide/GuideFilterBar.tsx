"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { REGION_LABEL, type RegionKey } from "@/lib/data/world";
import {
  GUIDE_FILTER_KEYS,
  parseGuideFilters,
  type GuideFacets,
} from "@/lib/data/guide-filter";

// The narrowing controls for the country and city lists.
//
// Sits beside `FieldFilter`, not inside it, because the two answer different
// questions and one of them is shared with every other step of the guide:
// `?f=` narrows the WHOLE section by subject and persists as you move between
// steps, while these narrow THIS LIST only.
//
// Everything writes the URL, like `?f=` — a narrowed list is something a
// student sends to a parent, and state cannot be sent. `replace` and
// `scroll: false` for the same reasons the field chips use them: toggling four
// regions should not cost four presses of Back, and narrowing a list you are
// halfway down should not throw you to the top.
//
// `REGION_LABEL` is a five-entry constant, the only runtime import here. The
// datasets it sits next to in `world.ts` never enter this bundle — the rows and
// their counts are computed on the server and arrive as props.

/** Debounce for the search box. */
const TYPING_MS = 250;

export function GuideFilterBar({
  facets,
  /** What one row is called, for the count line: "countries" / "cities". */
  noun,
  nounOne,
  /** Offered only where it means something — countries have odds, cities don't. */
  offerModelled = false,
  total,
}: {
  facets: GuideFacets;
  noun: string;
  /**
   * And one of them. Passed rather than derived: stripping a trailing "s" turns
   * "cities" into "citie", and English plurals are not a job for a regex.
   */
  nounOne: string;
  offerModelled?: boolean;
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const filters = parseGuideFilters(Object.fromEntries(params.entries()));

  // The input is local so typing stays instant. The guide renders per request,
  // so writing the URL on every keystroke would put a server round trip between
  // the student and each letter.
  const [draft, setDraft] = useState(filters.q);
  const typed = useRef(false);

  function write(next: Record<string, string | null>) {
    const q = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === "") q.delete(k);
      else q.set(k, v);
    }
    const s = q.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  }

  useEffect(() => {
    if (!typed.current) return;
    const t = setTimeout(
      () => write({ [GUIDE_FILTER_KEYS.q]: draft.trim() || null }),
      TYPING_MS,
    );
    return () => clearTimeout(t);
    // `write` is recreated each render; depending on it would reset the timer on
    // every keystroke and the query would never settle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  // The URL is the source of truth: if it changes from somewhere else — Back,
  // or the clear button — the box has to follow it back.
  useEffect(() => {
    typed.current = false;
    setDraft(filters.q);
  }, [filters.q]);

  const toggleRegion = (r: RegionKey) => {
    const on = filters.regions.includes(r);
    const next = on
      ? filters.regions.filter((x) => x !== r)
      : [...filters.regions, r];
    write({ [GUIDE_FILTER_KEYS.regions]: next.join(",") || null });
  };

  const active =
    (filters.q.trim() ? 1 : 0) +
    (filters.regions.length ? 1 : 0) +
    (filters.modelledOnly ? 1 : 0);

  const regionKeys = Object.keys(facets.regions) as RegionKey[];

  return (
    <section
      aria-labelledby="guide-filter-heading"
      className="rounded-2xl border border-line bg-card px-4 py-3.5 sm:px-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2
          id="guide-filter-heading"
          className="text-sm font-semibold text-ink"
        >
          Narrow the list
        </h2>
        {active > 0 && (
          <button
            type="button"
            onClick={() =>
              write({
                [GUIDE_FILTER_KEYS.q]: null,
                [GUIDE_FILTER_KEYS.regions]: null,
                [GUIDE_FILTER_KEYS.modelled]: null,
              })
            }
            className="inline-flex min-h-11 items-center text-xs font-medium text-ink-faint underline-offset-2 transition-colors hover:text-ink hover:underline focus-visible:focus-ring"
          >
            Clear {active === 1 ? "filter" : "filters"}
          </button>
        )}
      </div>

      <label className="mt-2.5 block">
        <span className="sr-only">Search {noun}</span>
        <input
          type="search"
          value={draft}
          onChange={(e) => {
            typed.current = true;
            setDraft(e.target.value);
          }}
          placeholder={`Search ${noun} — a name, or what you want to do there`}
          className="h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-ink placeholder:text-ink-faint focus-visible:focus-ring"
        />
      </label>

      <ul className="mt-2.5 flex flex-wrap gap-2">
        {regionKeys.map((r) => {
          const on = filters.regions.includes(r);
          const n = facets.regions[r] ?? 0;
          return (
            <li key={r}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => toggleRegion(r)}
                // A zero stays clickable and only dims. Removing it would make
                // the row change shape while you type, which reads as a bug.
                className={`inline-flex h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-[background-color,border-color,color,transform] duration-200 ease-out active:scale-[0.96] active:duration-75 focus-visible:focus-ring motion-reduce:transform-none motion-reduce:transition-none ${
                  on
                    ? "border-accent bg-accent-soft text-accent-ink"
                    : "border-line bg-surface text-ink-soft hover:border-ink/30 hover:text-ink"
                } ${n === 0 && !on ? "opacity-50" : ""}`}
              >
                {REGION_LABEL[r]}
                <span data-num className="tabular-nums text-xs text-ink-faint">
                  {n}
                </span>
              </button>
            </li>
          );
        })}
        {offerModelled && (
          <li>
            <button
              type="button"
              aria-pressed={filters.modelledOnly}
              onClick={() =>
                write({
                  [GUIDE_FILTER_KEYS.modelled]: filters.modelledOnly
                    ? null
                    : "1",
                })
              }
              className={`inline-flex h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-[background-color,border-color,color,transform] duration-200 ease-out active:scale-[0.96] active:duration-75 focus-visible:focus-ring motion-reduce:transform-none motion-reduce:transition-none ${
                filters.modelledOnly
                  ? "border-accent bg-accent-soft text-accent-ink"
                  : "border-line bg-surface text-ink-soft hover:border-ink/30 hover:text-ink"
              } ${facets.modelled === 0 && !filters.modelledOnly ? "opacity-50" : ""}`}
            >
              We model your odds
              <span data-num className="tabular-nums text-xs text-ink-faint">
                {facets.modelled}
              </span>
            </button>
          </li>
        )}
      </ul>

      <p aria-live="polite" className="mt-2.5 text-xs text-ink-faint">
        {total === 0
          ? `Nothing matches. Try dropping a region, or search for less.`
          : `Showing ${total} ${total === 1 ? nounOne : noun}.`}
      </p>
    </section>
  );
}
