import type { FacultyValue } from "@/lib/data/faculties";

// WHERE A PLAN STARTS, for a student who cannot yet say what they want.
//
// The owner's call (release 3, PLANNER_PLAN.md §1) is that the empty planner
// offers a CHOICE — not a blank board, and not one prescribed next move, because
// a single recommendation is a judgement about a student we have not met. The
// research adds the constraint that makes the choice worth anything:
//
//   **every option has to be a thing that HAPPENS, not a category.**
//
// "Pick a field" is a form with different paint, and a form is exactly what a
// student who cannot answer "what do I want to study" is unable to fill in.
// Each option below ends somewhere they can act, and its `tells` line says what
// they will know afterwards — which is the part that makes choosing possible
// without already knowing the answer.
//
// This module is PURE and imports nothing but a type: the counts are handed to
// it by the loader, which is what keeps the spine's five prose registries off
// this file and out of any bundle that renders the choice.

export type PlannerStartId = "enter" | "work" | "places" | "map";

export type PlannerStart = {
  id: PlannerStartId;
  /** The action, in the student's words. Never a noun phrase — a thing to do. */
  label: string;
  /** What they will know afterwards. This is what makes a choice choosable. */
  tells: string;
  href: string;
  /** A real number from the data, or null when we have nothing honest to say. */
  count: number | null;
  /** What the number counts, singular/plural handled by the caller. */
  unit: string;
};

/** What the loader must gather. Kept tiny so the query stays one pass. */
export type PlannerStartInput = {
  /** The student's stated fields. Empty is a valid answer meaning "not stated". */
  faculties: FacultyValue[];
  /** Areas of work the chosen fields open — from the spine. */
  areaCount: number;
  /** Countries where that work lives — from the spine. */
  placeCount: number;
  /** Things this student can actually enter now. */
  openCount: number;
  /** Maps they have already started. */
  mapCount: number;
};

/**
 * The choice, in the order a confused student can actually take it.
 *
 * The order is an argument, not a layout. It runs from the most concrete thing
 * that exists today to the most abstract:
 *
 *   1. something you can enter now — real, dated, and it needs no self-knowledge;
 *   2. what a kind of work is actually like — the question under "what do I
 *      want to study", asked in a form that has an answer;
 *   3. what a country actually costs and demands — the constraint most students
 *      discover last and should meet first;
 *   4. think it through as a map — offered last on purpose. It is the only one
 *      that asks the student to supply the structure, so it is the wrong first
 *      step for exactly the person this screen is for.
 *
 * A student with no stated fields still gets all four: the counts widen instead
 * of the list shortening, because unknown facts never exclude.
 */
export function plannerStarts(input: PlannerStartInput): PlannerStart[] {
  const stated = input.faculties.length > 0;

  return [
    {
      id: "enter",
      label: "See what I can enter right now",
      tells: stated
        ? "Real deadlines, at your age, in your fields — and what each one costs."
        : "Real deadlines you can meet at your age, and what each one costs.",
      href: "/opportunities",
      count: input.openCount || null,
      unit: "open to you",
    },
    {
      id: "work",
      label: "Find out what this kind of work is really like",
      // Not "explore careers". The guide's areas each state a catch and a
      // "look elsewhere if" — that is the thing worth promising here, because
      // it is the half a brochure leaves out.
      tells: "What the day is like, what the catch is, and who should look elsewhere.",
      href: stated ? "/guide/work" : "/guide/work?f=all",
      count: input.areaCount || null,
      unit: "kinds of work",
    },
    {
      id: "places",
      label: "See what a country actually costs and demands",
      tells: "Money, admissions, and what happens after you graduate there.",
      href: stated ? "/guide/places" : "/guide/places?f=all",
      count: input.placeCount || null,
      unit: "countries in full",
    },
    {
      id: "map",
      label: input.mapCount > 0 ? "Go back to thinking it through" : "Think it through on a map",
      tells: "Put the options side by side, then send any branch straight to this plan.",
      href: "/planner/maps",
      count: input.mapCount || null,
      unit: "maps of yours",
    },
  ];
}
