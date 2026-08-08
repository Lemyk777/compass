// Filtering the matched opportunity list by the criteria the catalog already
// carries: money, timing, level, eligibility, and a plain name/blurb search.
//
// Matching (buildExtracurriculars) answers "what can this student enter"; this
// answers "of those, which ones am I looking for right now" — a different
// question, and the one the category tabs alone could not serve. It never
// widens the set, only narrows it, so nothing here can put an opportunity in
// front of a student who is not eligible for it.
//
// Two reasons this is a module and not ten lines inside the view:
//  • it is pure, so the rules are unit-tested in scripts/test-engine.ts instead
//    of being eyeballed through the UI;
//  • the bundle rule (see CLAUDE.md): key-dates builds a lookup map over the
//    whole ~2,700-entry catalog at module load, so everything here imports it
//    TYPE-ONLY. Nothing in this file may import a runtime value from it.
//
// Three rules the UI depends on, and none of them should be "improved":
//  1. AND across groups, OR inside a group. Two costs mean "either"; a cost and
//     a level mean "both". It is the only combination a person predicts.
//  2. "Free" never includes a row whose cost we have not verified. `varies` and
//     `unknown` belong to NO money bucket on purpose — a filter that quietly
//     lumps "we haven't checked" in with "free" is the same lie as a card that
//     does it, and this is the one error that costs a student's trust outright.
//  3. An empty group means "no opinion", never "nothing". Same rule as empty
//     faculties in the matcher: unknown facts never exclude.

import type {
  CompetitionCategory,
  CompetitionLevel,
  CostModel,
  Opportunity,
} from "./key-dates";

/** Single-select "kind" — owned by the sticky tabs, not by the filter panel. */
export type CategoryFilter = "all" | CompetitionCategory;

/** What money means to a student, as four answerable questions. */
export type CostBucket = "free" | "funded" | "free_start" | "paid";

/** What we can honestly say about when it happens. */
export type TimingBucket = "closing" | "dated" | "open" | "tba";

export type OpportunityFilters = {
  /** Free text over the name, what it is, and who can enter. */
  query: string;
  cost: CostBucket[];
  timing: TimingBucket[];
  levels: CompetitionLevel[];
  /** Hide what the student is not yet old enough / far enough through school for. */
  openOnly: boolean;
};

/** The neutral state — every filter off. Also the "cleared" target. */
export const NO_FILTERS: OpportunityFilters = {
  query: "",
  cost: [],
  timing: [],
  levels: [],
  openOnly: false,
};

/** A deadline this close is the reason someone opens a filter at all. */
export const CLOSING_SOON_DAYS = 30;

// ── The option lists (the UI renders straight from these) ────────────────────

export const COST_OPTIONS: {
  id: CostBucket;
  label: string;
  /** Said out loud on hover/long-press — the bucket boundaries are the product. */
  hint: string;
  models: CostModel[];
}[] = [
  {
    id: "free",
    label: "Free all the way",
    hint: "Nothing to pay at any stage, certificate included.",
    models: ["free", "funded"],
  },
  {
    id: "funded",
    label: "They pay you",
    hint: "Selected participants get a stipend or have their costs covered.",
    models: ["funded"],
  },
  {
    id: "free_start",
    label: "Free to start",
    hint: "Free to enter or learn, but money can appear later — a paid certificate, a later round, a paid tier.",
    models: ["free_then_paid", "free_cert_paid", "freemium"],
  },
  {
    id: "paid",
    label: "Costs money",
    hint: "There is a fee. Some of these have need-based aid.",
    models: ["one_time", "subscription", "paid_aid"],
  },
];

export const TIMING_OPTIONS: { id: TimingBucket; label: string; hint: string }[] = [
  {
    id: "closing",
    label: "Closing soon",
    hint: `A confirmed deadline within ${CLOSING_SOON_DAYS} days.`,
  },
  {
    id: "dated",
    label: "Has a real date",
    hint: "We have checked the deadline against the organiser's own page.",
  },
  {
    id: "open",
    label: "Start tonight",
    hint: "No deadline to miss — self-paced or rolling, open right now.",
  },
  {
    id: "tba",
    label: "Dates not announced",
    hint: "The next cycle has not been published yet. Worth knowing about early.",
  },
];

export const LEVEL_OPTIONS: { id: CompetitionLevel; label: string }[] = [
  { id: "international", label: "International" },
  { id: "national", label: "National" },
  { id: "regional", label: "Regional" },
];

const COST_MODELS: Record<CostBucket, CostModel[]> = Object.fromEntries(
  COST_OPTIONS.map((o) => [o.id, o.models]),
) as Record<CostBucket, CostModel[]>;

// ── The predicates ───────────────────────────────────────────────────────────

function matchesCost(o: Opportunity, bucket: CostBucket): boolean {
  // Absent cost is `unknown`, and `unknown` is in no bucket — see rule 2.
  return COST_MODELS[bucket].includes(o.cost ?? "unknown");
}

function matchesTiming(o: Opportunity, bucket: TimingBucket): boolean {
  switch (bucket) {
    case "closing":
      return (
        Boolean(o.dateConfirmed) &&
        o.daysToDeadline >= 0 &&
        o.daysToDeadline <= CLOSING_SOON_DAYS
      );
    case "dated":
      return Boolean(o.dateConfirmed);
    case "open":
      return Boolean(o.alwaysOpen);
    case "tba":
      // The honest third state: no confirmed date and nothing to start today.
      return !o.dateConfirmed && !o.alwaysOpen;
  }
}

/** Words to search over. Everything a student can see on the card front. */
function haystack(o: Opportunity): string {
  return [o.name, o.blurb, o.eligibility, o.city, o.partner?.name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/** All terms must appear, in any order, anywhere. Empty query matches all. */
export function matchesQuery(o: Opportunity, query: string): boolean {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const hay = haystack(o);
  return terms.every((t) => hay.includes(t));
}

export function matchesFilters(o: Opportunity, f: OpportunityFilters): boolean {
  if (f.openOnly && o.notYetEligible) return false;
  if (f.cost.length > 0 && !f.cost.some((b) => matchesCost(o, b))) return false;
  if (f.timing.length > 0 && !f.timing.some((b) => matchesTiming(o, b))) return false;
  if (f.levels.length > 0 && !f.levels.includes(o.level)) return false;
  return matchesQuery(o, f.query);
}

export function filterOpportunities(
  items: Opportunity[],
  f: OpportunityFilters,
): Opportunity[] {
  // Cheap identity when nothing is set — the default render must not pay for a
  // feature nobody has touched yet.
  if (activeFilterCount(f) === 0) return items;
  return items.filter((o) => matchesFilters(o, f));
}

/** How many criteria are on. Drives the badge on the button and `browsing`. */
export function activeFilterCount(f: OpportunityFilters): number {
  return (
    (f.query.trim() === "" ? 0 : 1) +
    f.cost.length +
    f.timing.length +
    f.levels.length +
    (f.openOnly ? 1 : 0)
  );
}

// ── Counts, so a filter is a decision rather than a guess ────────────────────
//
// Each group is counted with ITS OWN selection lifted (proper faceting): with
// "Free" on, the money counts still say how many are funded or paid, because
// the question that row answers is "what happens if I pick this instead" — not
// "how many of the four I already chose". Every other group stays applied.

export type OpportunityFacets = {
  cost: Record<CostBucket, number>;
  timing: Record<TimingBucket, number>;
  levels: Record<CompetitionLevel, number>;
  /** What would survive the "only what I can enter now" toggle. */
  openNow: number;
};

export function opportunityFacets(
  items: Opportunity[],
  f: OpportunityFilters,
): OpportunityFacets {
  const without = (patch: Partial<OpportunityFilters>) =>
    items.filter((o) => matchesFilters(o, { ...f, ...patch }));

  const forCost = without({ cost: [] });
  const forTiming = without({ timing: [] });
  const forLevels = without({ levels: [] });
  const forEligibility = without({ openOnly: false });

  const cost = {} as Record<CostBucket, number>;
  for (const o of COST_OPTIONS) {
    cost[o.id] = forCost.filter((x) => matchesCost(x, o.id)).length;
  }
  const timing = {} as Record<TimingBucket, number>;
  for (const o of TIMING_OPTIONS) {
    timing[o.id] = forTiming.filter((x) => matchesTiming(x, o.id)).length;
  }
  const levels = {} as Record<CompetitionLevel, number>;
  for (const o of LEVEL_OPTIONS) {
    levels[o.id] = forLevels.filter((x) => x.level === o.id).length;
  }

  return {
    cost,
    timing,
    levels,
    openNow: forEligibility.filter((x) => !x.notYetEligible).length,
  };
}

// ── The active-filter summary ────────────────────────────────────────────────
//
// One removable chip per thing that is on. It exists because a filter you
// cannot see is a filter you forget you set, and then the empty list reads as
// "Compass has nothing for me" rather than "I asked for funded regional
// olympiads closing this month".

export type FilterChip = {
  /** Stable react key, unique across groups. */
  id: string;
  label: string;
  group: "query" | "cost" | "timing" | "levels" | "openOnly";
  /** The option removed when the chip is dismissed (absent for the toggles). */
  value?: string;
};

export function activeChips(f: OpportunityFilters): FilterChip[] {
  const chips: FilterChip[] = [];
  if (f.query.trim() !== "") {
    chips.push({ id: "query", label: `“${f.query.trim()}”`, group: "query" });
  }
  for (const b of f.cost) {
    const o = COST_OPTIONS.find((x) => x.id === b);
    if (o) chips.push({ id: `cost:${b}`, label: o.label, group: "cost", value: b });
  }
  for (const b of f.timing) {
    const o = TIMING_OPTIONS.find((x) => x.id === b);
    if (o) chips.push({ id: `timing:${b}`, label: o.label, group: "timing", value: b });
  }
  for (const l of f.levels) {
    const o = LEVEL_OPTIONS.find((x) => x.id === l);
    if (o) chips.push({ id: `level:${l}`, label: o.label, group: "levels", value: l });
  }
  if (f.openOnly) {
    chips.push({ id: "openOnly", label: "Only what I can enter now", group: "openOnly" });
  }
  return chips;
}

/** Remove exactly what one chip stands for. */
export function withoutChip(
  f: OpportunityFilters,
  chip: FilterChip,
): OpportunityFilters {
  switch (chip.group) {
    case "query":
      return { ...f, query: "" };
    case "openOnly":
      return { ...f, openOnly: false };
    case "cost":
      return { ...f, cost: f.cost.filter((x) => x !== chip.value) };
    case "timing":
      return { ...f, timing: f.timing.filter((x) => x !== chip.value) };
    case "levels":
      return { ...f, levels: f.levels.filter((x) => x !== chip.value) };
  }
}

/** Toggle one option in a multi-select group. */
export function toggleFilter<K extends "cost" | "timing" | "levels">(
  f: OpportunityFilters,
  group: K,
  value: OpportunityFilters[K][number],
): OpportunityFilters {
  const current = f[group] as string[];
  const next = current.includes(value as string)
    ? current.filter((x) => x !== value)
    : [...current, value as string];
  return { ...f, [group]: next } as OpportunityFilters;
}
