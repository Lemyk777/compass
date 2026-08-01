// Endowed-progress readiness — "how far along is this profile already?"
//
// WHY (research rule 8, OPPORTUNITIES_RESEARCH.md): a progress checklist that
// opens PART-FILLED converts better than one that opens at zero (Nunes & Drèze,
// endowed progress — a head start on a loyalty card nearly doubled completion at
// identical real effort). It is the counter-move to the 44% of signups who
// filled in nothing: we already know some of these facts (country from signup,
// often the school year), so the bar should never start empty.
//
// Kept as a pure module on purpose: computing the checklist needs only a handful
// of booleans, and the phrasing/ordering is the part worth checking in a test.
// The dashboard layout derives the booleans from the profile row and hands them
// here; nothing here touches a database or a session.
//
// Deliberately NOT coercive. FirstWin (onboarding) makes the point that a
// student who leaves should still leave with something and that we don't drive
// completion with a bar — so this lives on the DASHBOARD, for someone who has
// already bounced once, and its copy says plainly that none of it is required.

export type ReadinessKey =
  | "year"
  | "country"
  | "faculties"
  | "curriculum"
  | "destinations"
  | "activities"
  | "tests";

/** The plain facts the checklist is computed from — all booleans. */
export type ReadinessFacts = Record<ReadinessKey, boolean>;

export type ReadinessItem = {
  key: ReadinessKey;
  label: string;
  /** One line on what filling this in actually buys the student. */
  hint: string;
  done: boolean;
};

export type Readiness = {
  items: ReadinessItem[];
  done: number;
  total: number;
  allDone: boolean;
};

// Fixed logical order. `href` is intentionally not stored here — every item
// routes to the intake, and the caller owns the basePath.
const CATALOG: { key: ReadinessKey; label: string; hint: string }[] = [
  {
    key: "country",
    label: "Where you're based",
    hint: "surfaces local competitions, not just the global ones",
  },
  {
    key: "year",
    label: "Your school year",
    hint: "sets which opportunities are open to you right now",
  },
  {
    key: "faculties",
    label: "What you're into",
    hint: "matches opportunities to your fields",
  },
  {
    key: "curriculum",
    label: "Your curriculum & grades",
    hint: "lets Compass compare you to admitted students",
  },
  {
    key: "destinations",
    label: "Where you want to study",
    hint: "unlocks admission odds for each country",
  },
  {
    key: "activities",
    label: "Activities & honors",
    hint: "the heart of what a profile is judged on",
  },
  {
    key: "tests",
    label: "Test scores",
    hint: "SAT / TOEFL and the like, once you have them",
  },
];

/**
 * Build the readiness checklist from the known facts. Country and school year
 * lead the list because they are the two we most often already know — so the
 * head start is visible at the top, which is the whole point of endowing it.
 */
export function buildReadiness(facts: ReadinessFacts): Readiness {
  const items: ReadinessItem[] = CATALOG.map((c) => ({
    key: c.key,
    label: c.label,
    hint: c.hint,
    done: facts[c.key] === true,
  }));
  const done = items.filter((i) => i.done).length;
  return { items, done, total: items.length, allDone: done === items.length };
}
