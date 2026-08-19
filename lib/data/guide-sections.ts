// The guide's four sub-sections, in one place.
//
// This registry is the whole reason the section stopped being a single scroll:
// the tabs, the index cards and the "next step" footer on every page all read
// it, so adding or renaming a step is one edit rather than four that drift.
//
// The order is a zoom IN, and getting it backwards was a real bug: cities came
// before countries, so the guide asked a student to consider Berlin and then
// zoomed out to Germany. A country contains cities, so it comes first.
//
// what kinds of work a field opens → the countries that host it → the cities
// inside them → and what you can enter from home without moving at all. The
// last step is deliberately last and deliberately present; a guide that only
// says "leave" is a bad guide for our students.
//
// Cities remain their own step rather than living only inside country pages,
// and that is not laziness: 9 of the 22 hubs sit in countries we do not profile
// — including Almaty, Astana, Tashkent and Tbilisi, which is the entire home
// region. Nesting them out of existence would delete our own students' cities
// from the map. What changed is that the list is now grouped BY country, so the
// containment is visible wherever it exists.
//
// Pure data, no imports — the tabs are a client island and this must stay free
// to travel into that bundle.

export type GuideSectionId =
  | "work"
  | "majors"
  | "cities"
  | "places"
  | "from-home";

export type GuideSection = {
  id: GuideSectionId;
  /** Position in the zoom, shown as the step number. */
  step: number;
  href: string;
  /** Short form, for the tab. */
  label: string;
  /** The page's own h1. */
  title: string;
  /** One line: what this step answers. */
  blurb: string;
};

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "work",
    step: 1,
    href: "/guide/work",
    label: "Kinds of work",
    title: "Kinds of work",
    blurb:
      "Areas of work a field opens. Not one prescribed job. Each one lists the actual titles people hold inside it and how you get there.",
  },
  {
    // Between the work and the country, because the major is what you actually
    // apply WITH. The chain ran from "what kind of work" straight to "which
    // country" and skipped the one row a student fills in on a form.
    id: "majors",
    step: 2,
    href: "/guide/majors",
    label: "What you’d study",
    title: "What you would actually study",
    blurb:
      "The subject you apply with. What the first year is really made of, what it costs you, and who should study something else instead.",
  },
  {
    id: "places",
    step: 3,
    href: "/guide/places",
    label: "Countries",
    title: "The countries, in full",
    blurb:
      "The places students actually argue about: what only each one gives you, what it genuinely costs, what admissions weighs, and who should go somewhere else instead.",
  },
  {
    id: "cities",
    step: 4,
    href: "/guide/cities",
    label: "Cities",
    title: "The cities inside them",
    blurb:
      "A country is not one job market. These are the cities the work actually clusters in. Each with its honest catch and the real way in, including the ones at home.",
  },
  {
    id: "from-home",
    step: 5,
    href: "/guide/from-home",
    label: "From home",
    title: "You don’t have to move",
    blurb:
      "Routes that pay, teach or judge you from where you already are. Leaving is one answer. It is not the only one.",
  },
];

export function guideSection(id: GuideSectionId): GuideSection {
  // Non-null: the ids are a closed union and the array covers all of them.
  return GUIDE_SECTIONS.find((s) => s.id === id)!;
}

/** The step after this one, for the footer that keeps the zoom moving. */
export function nextGuideSection(id: GuideSectionId): GuideSection | undefined {
  const i = GUIDE_SECTIONS.findIndex((s) => s.id === id);
  return i === -1 ? undefined : GUIDE_SECTIONS[i + 1];
}

/**
 * The name that ties a card to the page it opens, so the browser morphs the one
 * into the other instead of cutting. Both sides must produce the identical
 * string, which is the entire reason it is a function and not two literals.
 *
 * A `view-transition-name` must be a CSS custom-ident and unique in the
 * document: the `guide-` prefix keeps it from starting with a digit, and the
 * subject's own id keeps it unique within a list.
 */
export function guideMorph(
  kind: "area" | "major" | "hub" | "place",
  id: string,
): string {
  return `guide-${kind}-${id}`;
}
