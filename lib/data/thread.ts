import type { PickCounts } from "@/lib/data/plan-picks";

// WHERE THE STUDENT IS, DERIVED.
//
// The companion shows "step 3 of 7", and that number must never be stored.
// Every condition below reads a fact that already exists somewhere: reactions in
// beat_reactions, picks in planner_path, commitments in opportunity_intents. A
// stored stage would be a second copy of something computable and would drift
// the first time this ladder changed — the same argument that keeps the spine a
// function and keeps `kind` off planner_path.
//
// TWO RULES, both test-enforced, and both are ways the obvious version lies:
//
// 1. **The stage is where they ARE, not the furthest thing they have touched.**
//    A student who committed to an olympiad before ever answering a pair is
//    still at the beginning. Taking the maximum instead would tell a lost person
//    they were nearly finished, which is the opposite of accompaniment.
// 2. **Nothing moves the stage backwards.** An overdue deadline is the MOVE's
//    business — see next-move.ts, where it outranks everything. A progress
//    figure that fell because something lapsed would read as punishment, and
//    this product does not treat not-entering as a verdict on a person.
//
// PURE. Nothing in this section can be checked in a browser by an agent (it sits
// behind a session), so the logic lives where a test can reach it.

export type StationId =
  | "sense"
  | "look"
  | "try"
  | "study"
  | "where"
  | "act"
  | "keep";

export const STATIONS: { id: StationId; index: number; label: string }[] = [
  { id: "sense", index: 1, label: "Who you are" },
  { id: "look", index: 2, label: "What the work is" },
  { id: "try", index: 3, label: "Trying it" },
  { id: "study", index: 4, label: "What you’d study" },
  { id: "where", index: 5, label: "Where they teach it" },
  { id: "act", index: 6, label: "Doing something real" },
  { id: "keep", index: 7, label: "Keeping it moving" },
];

export const STATION_TOTAL = STATIONS.length;

/**
 * Everything the ladder reads, and all of it already stored somewhere.
 *
 * "Opened the page" is deliberately NOT a condition anywhere below. Per-student
 * page reads are not recorded — `page_views` is the anonymous traffic table and
 * must stay that way — and recording them to drive a progress figure would be a
 * new tracking system built for a step counter. Taking something onto the plan
 * is the observable act, and it is already the guide→plan join.
 */
export type StationFacts = {
  /** Pairs with a real verdict — `beat_reactions`, via `pairsAnswered`. */
  pairsAnswered: number;
  /** What they claimed out of the guide — `planner_path`. */
  picks: PickCounts;
  /** Tries they have taken on — `opportunity_intents` on a try-shaped row. */
  tried: number;
  /** Opportunities they said they would enter — `opportunity_intents`. */
  committed: number;
  /** Of those, how many actually moved past "not started". */
  started: number;
  /**
   * Closed dates still sitting in "not started". Carried so callers can pass
   * ONE object to both this and the move ladder; it deliberately does not
   * affect the station. See rule 2.
   */
  overdue: number;
};

/**
 * The station, decided by the FIRST thing that is not yet true.
 *
 * The order is the argument, not the implementation: it runs from the question
 * that needs no self-knowledge to the one that needs the most — which is the
 * reverse of the order the product used to ask them in.
 */
export function station(facts: StationFacts): {
  id: StationId;
  index: number;
  total: number;
} {
  const at = (id: StationId) => {
    // Non-null: the ids are a closed union and the array covers all of them.
    const found = STATIONS.find((s) => s.id === id)!;
    return { id: found.id, index: found.index, total: STATION_TOTAL };
  };

  // 1 ── They have told us nothing about themselves, and we have not asked them
  // a question they cannot answer. Three pairs, because that is where the
  // engine can first say something honest.
  if (facts.pairsAnswered < 3) return at("sense");

  // 2 ── They know something about themselves and nothing about the work.
  if (facts.picks.work === 0) return at("look");

  // 3 ── Reading about work is not finding out whether you can stand it, and
  // this is the cheapest honest test there is.
  if (facts.tried === 0) return at("try");

  // 4 ── The step the product did not have at all: what you actually apply with.
  if (facts.picks.major === 0) return at("study");

  // 5 ── Where they teach it, and what it costs.
  if (facts.picks.place === 0) return at("where");

  // 6 ── Everything above is thinking. This is the gap the whole product
  // measures: an intention that never became an act.
  if (facts.committed === 0 || facts.started === 0) return at("act");

  // 7 ── Moving. The plan is not the point; the work is.
  return at("keep");
}
