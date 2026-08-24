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

import type { Opportunity } from "./key-dates";
// Runtime, and allowed to be: `opportunity-vocab` imports nothing and carries no
// catalog, which is the whole reason it exists. Before it, the canonical arrays
// were locked inside key-dates — unreachable from anything client-side — so
// every option list below was hand-written, and a hand-written `T[]` is checked
// for wrong members and never for missing ones. That is how `simulation` lost
// its tab and how `school` reached the admin form and nowhere else.
import {
  COMPETITION_CATEGORIES,
  COMPETITION_LEVELS,
  COST_MODELS,
  LEVEL_HINT,
  LEVEL_LABEL,
  type CompetitionCategory,
  type CompetitionLevel,
  type CostModel,
} from "./opportunity-vocab";

/** Single-select "kind" — owned by the sticky tabs, not by the filter panel. */
export type CategoryFilter = "all" | CompetitionCategory;

/**
 * The tab strip, in the order a student reads it — and it lives here, not in the
 * view, because a kind with no tab is a row nobody can reach.
 *
 * **This was a real bug and it is the reason both halves exist.** The view built
 * its tabs from a hand-written array. `community` was added to it; `simulation`
 * was not — so the catalog's one simulation counted inside "All" and could not
 * be filtered to, and the tab counts stopped summing to the total. That is
 * exactly what a reader notices: 10 + 48 + 26 + 10 + 9 + 10 is 113 against an
 * "All" of 114, and there is no way to find the missing one.
 *
 * The compiler catches a missing LABEL, because a `Record` over the union must
 * be complete. It could not catch a missing entry in an ordered array — an array
 * has no obligation to cover a union — so the ORDER was covered by a unit test
 * instead. Both are needed: the order is editorial (olympiads lead, because
 * they are the clearest evidence a student can produce) and cannot simply be
 * derived from the data model's own ordering.
 *
 * **The order is now compiler-checked too**, by storing it as a rank rather than
 * as a list: a `Record<CompetitionCategory, number>` must be complete, and
 * sorting the canonical array by it reproduces the editorial order exactly. The
 * unit test stays, because a test that has been proved to bite is worth more
 * than the type it duplicates — but the omission it was there to catch can no
 * longer reach it.
 */
export const CATEGORY_TAB_LABEL: Record<CompetitionCategory, string> = {
  olympiad: "Olympiads",
  competition: "Competitions",
  course: "Courses",
  summer_program: "Summer",
  research_program: "Research",
  community: "Community",
  // Plural of a thing you DO, not of a thing you enter — the catalog's own
  // wording for this kind, kept identical to the card's badge.
  simulation: "Try the work",
};

/**
 * Where each kind sits in the tab strip. A `Record`, so adding a kind without
 * placing it does not compile.
 */
const CATEGORY_RANK: Record<CompetitionCategory, number> = {
  olympiad: 0,
  competition: 1,
  course: 2,
  summer_program: 3,
  research_program: 4,
  community: 5,
  simulation: 6,
};

/** Editorial order, not the data model's — derived, so it cannot miss a kind. */
export const CATEGORY_ORDER: CompetitionCategory[] = [
  ...COMPETITION_CATEGORIES,
].sort((a, b) => CATEGORY_RANK[a] - CATEGORY_RANK[b]);

/** What the sticky tabs render: "All", then every kind, each with its label. */
export const CATEGORY_TABS: { key: CategoryFilter; label: string }[] = [
  { key: "all", label: "All" },
  ...CATEGORY_ORDER.map((key) => ({
    key: key as CategoryFilter,
    label: CATEGORY_TAB_LABEL[key],
  })),
];

/** What money means to a student, as four answerable questions. */
export const COST_BUCKETS = ["free", "funded", "free_start", "paid"] as const;
export type CostBucket = (typeof COST_BUCKETS)[number];

/** What we can honestly say about when it happens. */
export const TIMING_BUCKETS = ["closing", "dated", "open", "tba"] as const;
export type TimingBucket = (typeof TIMING_BUCKETS)[number];

/**
 * The two narrowings that used to happen invisibly, inside matching.
 *
 * This group is INVERTED from every other one here, and deliberately rather
 * than sloppily: everywhere else an empty array means "no narrowing", and here
 * the default is both ON. The honest default is still the student's own list —
 * what changed is that the narrowing is visible, counted, and reversible.
 * Turning one off asks "show me the ones I do not match either", which the
 * product previously gave no way to ask: both gates ran before this panel saw a
 * single row, and the one control that looked like a route to the rest read
 * "Show everything we track for you (114)", where "everything" was false.
 *
 * The cost of the inversion is that `activeFilterCount` counts this group by
 * what is MISSING. It is written down here because this is the one place in the
 * module where "empty means unset" does not hold.
 */
export const MATCH_BUCKETS = ["field", "region"] as const;
export type MatchBucket = (typeof MATCH_BUCKETS)[number];

const MATCH_LABEL: Record<MatchBucket, string> = {
  field: "In my fields",
  region: "Open where I live",
};

/**
 * Rendered in `MATCH_BUCKETS` order, and that is load-bearing rather than
 * tidy: this field is a SET, `withoutChip` rebuilds it, and an unstable order
 * makes two equal states compare unequal.
 */
export const MATCH_OPTIONS: { id: MatchBucket; label: string }[] =
  MATCH_BUCKETS.map((id) => ({ id, label: MATCH_LABEL[id] }));

export type OpportunityFilters = {
  /** Free text over the name, what it is, and who can enter. */
  query: string;
  cost: CostBucket[];
  timing: TimingBucket[];
  levels: CompetitionLevel[];
  /** Hide what the student is not yet old enough / far enough through school for. */
  openOnly: boolean;
  /** Which narrowings are ON. Both by default — see `MatchBucket`. */
  matched: MatchBucket[];
};

/**
 * The neutral state — every filter off, and both narrowings ON.
 *
 * "Neutral" here means "the student has chosen nothing", not "nothing is
 * narrowing the list": their own field and country still apply, because that is
 * the list they came for. The difference from before is that they can now see
 * it happening and switch it off.
 */
export const NO_FILTERS: OpportunityFilters = {
  query: "",
  cost: [],
  timing: [],
  levels: [],
  openOnly: false,
  matched: ["field", "region"],
};

/** A deadline this close is the reason someone opens a filter at all. */
export const CLOSING_SOON_DAYS = 30;

// ── The option lists (the UI renders straight from these) ────────────────────

type CostBucketMeta = {
  label: string;
  /** Said out loud on hover/long-press — the bucket boundaries are the product. */
  hint: string;
  models: CostModel[];
};

const COST_BUCKET_META: Record<CostBucket, CostBucketMeta> = {
  free: {
    label: "Free all the way",
    hint: "Nothing to pay at any stage, certificate included.",
    models: ["free", "funded"],
  },
  funded: {
    label: "They pay you",
    hint: "Selected participants get a stipend or have their costs covered.",
    models: ["funded"],
  },
  free_start: {
    label: "Free to start",
    hint: "Free to enter or learn, but money can appear later. A paid certificate, a later round, a paid tier.",
    models: ["free_then_paid", "free_cert_paid", "freemium"],
  },
  paid: {
    label: "Costs money",
    hint: "There is a fee. Some of these have need-based aid.",
    models: ["one_time", "subscription", "paid_aid"],
  },
};

export const COST_OPTIONS: ({ id: CostBucket } & CostBucketMeta)[] =
  COST_BUCKETS.map((id) => ({ id, ...COST_BUCKET_META[id] }));

/**
 * The models that belong to NO money bucket, named out loud instead of being
 * left as a gap in the table above.
 *
 * Rule 2 in this file's header is that "Free" never includes a cost we have not
 * verified, so `unknown` and `varies` are deliberately unbucketed — but a
 * deliberate omission and a forgotten one look identical in a list of four
 * buckets. Writing them down turns the difference into something a test can
 * assert: every cost model must appear in a bucket OR appear here, and a new
 * model that lands in neither fails the suite instead of silently vanishing
 * from the money filter.
 */
export const COST_MODELS_WITHOUT_A_BUCKET: CostModel[] = ["varies", "unknown"];

type TimingMeta = { label: string; hint: string };

const TIMING_META: Record<TimingBucket, TimingMeta> = {
  closing: {
    label: "Closing soon",
    hint: `A confirmed deadline within ${CLOSING_SOON_DAYS} days.`,
  },
  dated: {
    label: "Has a real date",
    hint: "We have checked the deadline against the organiser's own page.",
  },
  open: {
    label: "Start tonight",
    hint: "No deadline to miss, self-paced or rolling, open right now.",
  },
  tba: {
    label: "Dates not announced",
    hint: "The next cycle has not been published yet. Worth knowing about early.",
  },
};

export const TIMING_OPTIONS: ({ id: TimingBucket } & TimingMeta)[] =
  TIMING_BUCKETS.map((id) => ({ id, ...TIMING_META[id] }));

/**
 * The level facets, derived from the one canonical array.
 *
 * This list used to be hand-written, three entries against a three-member
 * union, and it was the live half of a shipped bug: the admin write path
 * accepted a fourth level (`school`) that nothing here had heard of, so such a
 * row was counted in no facet, reachable by no filter, and the level numbers
 * quietly stopped summing to the list total. Deriving it means adding a level
 * is one edit in `opportunity-vocab` and the build tells you what else to write.
 *
 * The hint is new with it. Money and timing each explain their own options and
 * this group did not, which mattered most for the level added: "School" alone
 * reads as a kind of institution rather than as the narrowest rung.
 */
export const LEVEL_OPTIONS: {
  id: CompetitionLevel;
  label: string;
  hint: string;
}[] = COMPETITION_LEVELS.map((id) => ({
  id,
  label: LEVEL_LABEL[id],
  hint: LEVEL_HINT[id],
}));

const COST_BUCKET_MODELS: Record<CostBucket, CostModel[]> = Object.fromEntries(
  COST_OPTIONS.map((o) => [o.id, o.models]),
) as Record<CostBucket, CostModel[]>;

// ── The predicates ───────────────────────────────────────────────────────────

function matchesCost(o: Opportunity, bucket: CostBucket): boolean {
  // Absent cost is `unknown`, and `unknown` is in no bucket — see rule 2.
  return COST_BUCKET_MODELS[bucket].includes(o.cost ?? "unknown");
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

/**
 * Words to search over. Everything a student can see on the card front.
 *
 * Built once per row and remembered, because the search box is the one control
 * here that runs on every keystroke and this string does not depend on the
 * query. A single keystroke used to rebuild it seven times per row — once for
 * the visible list and once for each of the six faceting passes below — which
 * over 161 rows is 1,127 array literals, filters, joins and `toLowerCase`
 * calls to answer a question whose inputs had not changed.
 *
 * A WeakMap rather than a Map for the same reason `gateFor` uses one: an
 * `Opportunity` is rebuilt by `buildExtracurriculars` whenever the student's
 * own facts change, so keying on the row lets the entries go with it instead
 * of accumulating a copy of the catalog's prose per profile.
 */
const HAYSTACKS = new WeakMap<Opportunity, string>();

function haystack(o: Opportunity): string {
  let hay = HAYSTACKS.get(o);
  if (hay === undefined) {
    hay = [o.name, o.blurb, o.eligibility, o.city, o.partner?.name]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    HAYSTACKS.set(o, hay);
  }
  return hay;
}

/**
 * The query, split into the terms every row is tested against.
 *
 * Lifted out of the per-row test so a pass tokenises once instead of once per
 * row. Same rule as the haystack: the query is a property of the PASS, not of
 * the row being examined.
 */
function queryTerms(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

function matchesTerms(o: Opportunity, terms: string[]): boolean {
  if (terms.length === 0) return true;
  const hay = haystack(o);
  return terms.every((t) => hay.includes(t));
}

/** All terms must appear, in any order, anywhere. Empty query matches all. */
export function matchesQuery(o: Opportunity, query: string): boolean {
  return matchesTerms(o, queryTerms(query));
}

/**
 * The row test, with the query already tokenised for the whole pass.
 *
 * There used to be an exported `matchesFilters(o, f)` here that did its own
 * tokenising, and both callers below went through it. Hoisting the tokens out
 * left it with nothing to do that this does not, and nothing outside the module
 * had ever imported it — so it went, rather than staying as a wrapper kept
 * alive by a test written to keep it alive. The dead-export scan in
 * `scripts/test-engine.ts` is what noticed.
 */
function matchesCompiled(
  o: Opportunity,
  f: OpportunityFilters,
  terms: string[],
): boolean {
  // Groups are ANDed. A row survives when every narrowing still switched on
  // either does not apply to it, or applies and it passes.
  if (f.matched.includes("field") && o.offField) return false;
  if (f.matched.includes("region") && o.offRegion) return false;
  if (f.openOnly && o.notYetEligible) return false;
  if (f.cost.length > 0 && !f.cost.some((b) => matchesCost(o, b))) return false;
  if (f.timing.length > 0 && !f.timing.some((b) => matchesTiming(o, b)))
    return false;
  if (f.levels.length > 0 && !f.levels.includes(o.level)) return false;
  return matchesTerms(o, terms);
}

export function filterOpportunities(
  items: Opportunity[],
  f: OpportunityFilters,
): Opportunity[] {
  // There used to be a cheap identity here — "no active filters, return the
  // list untouched" — and it is now WRONG rather than merely unnecessary. The
  // neutral state narrows: both match options are on by default, so a student
  // who has touched nothing must still get their own list rather than all 172.
  // Skipping the pass returned everything, which is the opposite of the bug
  // this group was added to fix.
  //
  // The saving it bought was one pass over ~172 rows on a render that already
  // walks them to draw cards.
  const terms = queryTerms(f.query);
  return items.filter((o) => matchesCompiled(o, f, terms));
}

/** How many criteria are on. Drives the badge on the button and `browsing`. */
export function activeFilterCount(f: OpportunityFilters): number {
  return (
    (f.query.trim() === "" ? 0 : 1) +
    f.cost.length +
    f.timing.length +
    f.levels.length +
    (f.openOnly ? 1 : 0) +
    // Counted by what is MISSING, because this group's default is "on". A
    // widened list is an active choice and must open the full list, exactly
    // like every other filter here.
    (NO_FILTERS.matched.length - f.matched.length)
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
  /**
   * What would survive with each narrowing LIFTED — "how many would I see if
   * this one were off". Same faceting rule as every other group, and the number
   * that turns "the catalog is larger" from an excuse into a control.
   */
  matched: Record<MatchBucket, number>;
};

export function opportunityFacets(
  items: Opportunity[],
  f: OpportunityFilters,
): OpportunityFacets {
  // Tokenised once for all six passes below. No patch any of them applies
  // touches the query, so re-splitting it inside each one — and then again for
  // every row inside each one — was work with no input change behind it.
  const terms = queryTerms(f.query);
  const without = (patch: Partial<OpportunityFilters>) => {
    const lifted = { ...f, ...patch };
    return items.filter((o) => matchesCompiled(o, lifted, terms));
  };

  const forCost = without({ cost: [] });
  const forTiming = without({ timing: [] });
  const forLevels = without({ levels: [] });
  const forEligibility = without({ openOnly: false });
  // Built from `MATCH_BUCKETS` rather than written out. The `as Record<…>` cast
  // this replaces was the one shape in this function the compiler could not
  // check: a cast asserts completeness instead of proving it, so a third
  // narrowing would have compiled with no count and rendered a facet reading
  // `undefined`.
  const matched = Object.fromEntries(
    MATCH_BUCKETS.map((id) => [
      id,
      without({ matched: f.matched.filter((m) => m !== id) }).length,
    ]),
  ) as Record<MatchBucket, number>;

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
    matched,
  };
}

/**
 * How much of the catalog this student is being shown, and out of how much.
 *
 * Computed, never written down. The control that used to sit here said "Show
 * everything we track for you (114)" — and "everything" was false: it was
 * everything we MATCHED. A student read it as "they only have 114 things", and
 * there was no route from that screen to the other 58.
 */
export function matchedCount(items: Opportunity[]): {
  shown: number;
  total: number;
} {
  return { shown: matchedOnly(items).length, total: items.length };
}

/**
 * Just the rows this student actually matches.
 *
 * **Every surface without a filter panel must call this**, and that is not a
 * style preference — matching stopped hiding rows so the panel could own the
 * narrowing, so a surface with no panel does no narrowing at all unless it asks.
 * The guest eligibility checker, the onboarding first-win screen and the
 * planner's loader are all in that position: without this a student in
 * Uzbekistan is shown a competition that only runs in Kazakhstan, which is the
 * exact failure the region tag exists to prevent.
 *
 * A unit test pins each of those three call sites, because the leak is silent —
 * nothing looks wrong, there are simply more rows than there should be.
 */
export function matchedOnly(items: Opportunity[]): Opportunity[] {
  return items.filter((o) => !o.offField && !o.offRegion);
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
  group: "query" | "cost" | "timing" | "levels" | "openOnly" | "matched";
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
  // A chip per narrowing the student has switched OFF. It reads as what they
  // did — widened the list — and dismissing it puts the narrowing back, so
  // there is always a way home from a list that suddenly got bigger.
  for (const opt of MATCH_OPTIONS) {
    if (!f.matched.includes(opt.id)) {
      chips.push({
        id: `matched:${opt.id}`,
        label:
          opt.id === "field"
            ? "Including other fields"
            : "Including other countries",
        group: "matched",
        value: opt.id,
      });
    }
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
    // Inverted, like the group itself: dismissing this chip puts the narrowing
    // BACK, because the chip exists to say "you have widened the list" rather
    // than "you have narrowed it".
    //
    // Restored in MATCH_OPTIONS order rather than appended. This field is a set,
    // and a set with an unstable order is a state object that compares unequal
    // to an identical one — which quietly breaks memoisation now and URL
    // round-tripping the moment anyone serialises it.
    case "matched":
      return {
        ...f,
        matched: MATCH_OPTIONS.map((o) => o.id).filter(
          (id) => f.matched.includes(id) || id === chip.value,
        ),
      };
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

/**
 * A category from the URL, or null.
 *
 * `/opportunities?kind=simulation` is what the thread's "try it for an
 * afternoon" move links to, and without this it landed on the "All" tab — the
 * release's own headline consequence (two clicks to a job simulation instead of
 * six) quietly not delivered. Anything unrecognised is null rather than an
 * error: a bad query string narrows nothing, it does not break the page.
 */
export function categoryFromParam(raw: unknown): CategoryFilter | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string") return null;
  const found = CATEGORY_TABS.find((t) => t.key === value);
  return found ? found.key : null;
}
