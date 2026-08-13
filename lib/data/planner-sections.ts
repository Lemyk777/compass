// The planner's views, in one place.
//
// Same reason the guide has `guide-sections.ts`: the tabs and the headings all
// read this, so adding a view — mind maps are release 2 — is one edit rather
// than three that drift.
//
// The order is deliberate and it is not the obvious one. The agenda comes
// first, not the board, because a student with two commitments sees a full list
// in the agenda (their deadlines, the SAT cutoffs, the phases they are in) and
// a nearly empty board. Both are the same truth; only one of them reads as a
// working product on day one.
//
// Pure data, no imports — the tabs are a client island and this must stay free
// to travel into that bundle.

export type PlannerSectionId = "next" | "board" | "maps";

export type PlannerSection = {
  id: PlannerSectionId;
  href: string;
  /** Short form, for the tab. */
  label: string;
  /** The page's own h1. */
  title: string;
  /** One line: what this view answers. */
  blurb: string;
};

export const PLANNER_SECTIONS: PlannerSection[] = [
  {
    id: "next",
    href: "/planner",
    label: "What's next",
    title: "What's next",
    blurb:
      "Everything with a date, soonest first — what you said you'd enter, when the SAT closes, and the deadlines you're working towards.",
  },
  {
    id: "board",
    href: "/planner/board",
    label: "Board",
    title: "Your board",
    blurb:
      "Everything you're actually carrying, in three columns: not started, in progress, done. Move a card with the arrows on it.",
  },
  {
    id: "maps",
    href: "/planner/maps",
    label: "Maps",
    title: "Your maps",
    blurb:
      "Think a question through in branches — where could I study, what would each one need — and send any branch to your plan when you decide.",
  },
];

export function plannerSection(id: PlannerSectionId): PlannerSection {
  // Non-null: the ids are a closed union and the array covers all of them.
  return PLANNER_SECTIONS.find((s) => s.id === id)!;
}
