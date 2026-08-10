import type { RegionKey } from "@/lib/data/world";

// Filtering the guide's two lists — 17 countries and 34 cities.
//
// The complaint this answers: the only way to find out whether a country suited
// you was to open it and read it, seventeen times. The field filter (`?f=`) was
// the sole narrowing tool and it is about SUBJECT, which is not the axis most
// students are actually stuck on.
//
// Three rules, deliberately the same as the opportunities filter panel
// (lib/data/opportunity-filter.ts) — a student should not have to learn two
// filtering behaviours inside one product:
//
//  1. **Groups are ANDed, options inside a group ORed.** "Europe or Asia, and
//     modelled" is the only reading a person predicts.
//  2. **Every option carries its own count**, and a group's counts are computed
//     with THAT GROUP'S selection lifted — otherwise picking "Europe" drops
//     every other region to 0 and the control tells you nothing about what
//     switching would do.
//  3. **A zero-count option stays visible and clickable.** Hiding it makes the
//     panel appear to change shape as you type, which reads as a bug.
//
// It lives in the URL, not in state — same as `?f=`. A filtered list is a thing
// a student sends to a parent or a teacher, and state cannot be sent.
//
// **Type-only imports on purpose.** This module is reached from a client
// component, and `world.ts` and `study-destinations.ts` are ~180kB between
// them. Nothing here touches either dataset: the caller maps its rows into
// `GuideRow` on the server and passes the results down, the same rule
// `WorkList` follows for career areas.

/**
 * The shape both lists are reduced to before filtering. Deliberately minimal:
 * everything the panel needs to decide, and nothing that would couple this
 * module to either dataset.
 */
export type GuideRow = {
  id: string;
  region: RegionKey;
  /** Pre-lowercased search haystack — name, country, and the one-line. */
  text: string;
  /**
   * Only countries have this: whether we model admission odds for it. Cities
   * pass `undefined`, and the option is then not offered.
   */
  modelled?: boolean;
};

export type GuideFilters = {
  q: string;
  regions: RegionKey[];
  modelledOnly: boolean;
};

export const NO_GUIDE_FILTERS: GuideFilters = {
  q: "",
  regions: [],
  modelledOnly: false,
};

/** The query keys. Short, because they sit next to `?f=` in a shared link. */
export const GUIDE_FILTER_KEYS = { q: "q", regions: "r", modelled: "m" } as const;

const ALL_REGIONS: RegionKey[] = [
  "central_asia",
  "europe",
  "asia_pacific",
  "middle_east",
  "north_america",
];

function one(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export function parseGuideFilters(
  sp: Record<string, string | string[] | undefined>,
): GuideFilters {
  const raw = one(sp[GUIDE_FILTER_KEYS.regions]);
  const regions = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is RegionKey => (ALL_REGIONS as string[]).includes(s));
  return {
    q: one(sp[GUIDE_FILTER_KEYS.q]).slice(0, 80),
    // De-duplicated: `?r=europe,europe` is a hand-edited URL, not a state the
    // panel can produce, and it would double-count nothing but still looks
    // wrong when serialised back out.
    regions: [...new Set(regions)],
    modelledOnly: one(sp[GUIDE_FILTER_KEYS.modelled]) === "1",
  };
}

/**
 * Back to query params. Absent rather than empty — `?q=&r=` is noise in a URL a
 * student is about to paste into a chat.
 */
export function guideFilterParams(f: GuideFilters): Record<string, string> {
  const out: Record<string, string> = {};
  if (f.q.trim()) out[GUIDE_FILTER_KEYS.q] = f.q.trim();
  if (f.regions.length) out[GUIDE_FILTER_KEYS.regions] = f.regions.join(",");
  if (f.modelledOnly) out[GUIDE_FILTER_KEYS.modelled] = "1";
  return out;
}

/** How many criteria are on — drives the badge and the "clear" affordance. */
export function activeGuideFilterCount(f: GuideFilters): number {
  return (f.q.trim() ? 1 : 0) + (f.regions.length ? 1 : 0) + (f.modelledOnly ? 1 : 0);
}

/**
 * All terms must appear, in any order, anywhere in the haystack.
 *
 * Substring rather than whole-word, because the useful queries here are
 * partial: "neth", "kore", "engin". An empty query matches everything.
 */
export function matchesGuideQuery(text: string, q: string): boolean {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  return terms.every((t) => text.includes(t));
}

export function matchesGuideFilters(row: GuideRow, f: GuideFilters): boolean {
  if (!matchesGuideQuery(row.text, f.q)) return false;
  if (f.regions.length && !f.regions.includes(row.region)) return false;
  if (f.modelledOnly && !row.modelled) return false;
  return true;
}

export function filterGuideRows(rows: GuideRow[], f: GuideFilters): GuideRow[] {
  return rows.filter((r) => matchesGuideFilters(r, f));
}

export type GuideFacets = {
  /** Per region, how many rows survive with the REGION group lifted. */
  regions: Record<string, number>;
  /** How many survive with the modelled toggle lifted. */
  modelled: number;
  /** How many survive everything — what the list actually shows. */
  total: number;
};

export function guideFacets(rows: GuideRow[], f: GuideFilters): GuideFacets {
  // Each group's own selection is lifted before counting it. Rule 2 above: a
  // count computed with the group applied answers "how many are already
  // showing", which the student can see, instead of "what would I get if I
  // clicked this", which is the only reason to look at a number on a control.
  const withoutRegion = rows.filter((r) =>
    matchesGuideFilters(r, { ...f, regions: [] }),
  );
  const withoutModelled = rows.filter((r) =>
    matchesGuideFilters(r, { ...f, modelledOnly: false }),
  );

  const regions: Record<string, number> = {};
  for (const key of ALL_REGIONS) {
    regions[key] = withoutRegion.filter((r) => r.region === key).length;
  }

  return {
    regions,
    modelled: withoutModelled.filter((r) => r.modelled).length,
    total: filterGuideRows(rows, f).length,
  };
}
