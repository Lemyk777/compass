// The planner's views, in one place.
//
// Same reason the guide has `guide-sections.ts`: the switcher, the window and
// the landing page all read this, so adding a view is one edit rather than
// several that drift.
//
// **They are VIEWS now, not routes, and that is the change that mattered.**
// They used to be `/planner`, `/planner/board` and `/planner/maps` — three
// pages behind a control shaped like a tab strip, so "switching view" was a
// full navigation: the server ran again, the period you had stepped to was
// lost, and the section read as three products sharing a header. One route
// (`/planner?view=…`) with one loader is what "one window" actually means, and
// it is the settled pattern everywhere this is solved well — Notion, Linear,
// Trello all switch views over one dataset without going anywhere.
//
// The query parameter is still a real URL, so a view can be linked and shared.
// What it is NOT is a navigation: the window replaces the history entry rather
// than pushing one, because Back from a plan should leave the plan, not walk
// backwards through which lens you were looking through.
//
// The order is deliberate and it is not the obvious one. The agenda comes
// first, not the board, because a student with two commitments sees a full list
// in the agenda (their deadlines, the SAT cutoffs, the phases they are in) and
// a nearly empty board. Both are the same truth; only one of them reads as a
// working product on day one.
//
// Pure data, no imports — the switcher is a client island and this must stay
// free to travel into that bundle.

export type PlannerSectionId = "next" | "board" | "maps";

export type PlannerSection = {
  id: PlannerSectionId;
  /** The `?view=` value. Short, because a student may well read the URL. */
  view: string;
  /** A shareable address for this view. */
  href: string;
  /** Short form, for the switcher. */
  label: string;
  /** The page's own heading, when one is needed. */
  title: string;
  /** One line: what this view answers. */
  blurb: string;
};

export const PLANNER_SECTIONS: PlannerSection[] = [
  {
    id: "next",
    view: "next",
    href: "/planner?view=next",
    label: "What's next",
    title: "What's next",
    blurb:
      "Everything with a date, soonest first. What you said you'd enter, when the SAT closes, and the deadlines you're working towards.",
  },
  {
    id: "board",
    view: "board",
    href: "/planner?view=board",
    label: "Board",
    title: "Your board",
    blurb:
      "Everything you're actually carrying, in three columns: not started, in progress, done. Move a card with the arrows on it.",
  },
  {
    id: "maps",
    view: "map",
    href: "/planner?view=map",
    label: "Maps",
    title: "Your maps",
    blurb:
      "Think a question through in branches: where could I study, what would each one need. Then send any branch to your plan when you decide.",
  },
];

export function plannerSection(id: PlannerSectionId): PlannerSection {
  // Non-null: the ids are a closed union and the array covers all of them.
  return PLANNER_SECTIONS.find((s) => s.id === id)!;
}

/**
 * Which view a `?view=` value names, defaulting to the first.
 *
 * Unknown values fall back rather than erroring, because this reads a query
 * string: an old link, a typo or a truncated share all arrive here, and none of
 * them is worth an error page when the answer "show them the agenda" is
 * available and correct.
 */
export function plannerViewFromParam(v: string | string[] | undefined): PlannerSectionId {
  const raw = Array.isArray(v) ? v[0] : v;
  return (
    PLANNER_SECTIONS.find((s) => s.view === raw)?.id ?? PLANNER_SECTIONS[0].id
  );
}
