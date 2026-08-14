import type { PickCounts } from "@/lib/data/plan-picks";

// THE ONE THING TO DO NEXT — the whole of the plan's guidance, in one pure
// function.
//
// The section's real failure was never the calendar or the board. It was that
// the only sentence addressed to the student appeared on an EMPTY plan and
// disappeared the moment anything existed in it, so the product accompanied
// nobody past their first action. This is the fix: a single move, always
// present, derived from where they actually are.
//
// Three rules govern what may come out of here, and each is a way the obvious
// version fails:
//
//   1. **Exactly one move.** A list of suggestions is the student's own
//      confusion handed back with our name on it. If two rules match, the
//      earlier one wins and the other waits its turn.
//   2. **Every move says WHY.** "Go and read about countries" is an
//      instruction; "you picked Data & AI — five countries actually hire for
//      it" is a reason, and a reason is the thing a consultant gives that a
//      form does not. `why` is not decoration and no branch may omit it.
//   3. **It never invents a fact.** Every number reaching this function is
//      counted from the registries or the student's own rows. Where we have
//      nothing honest to say, the move is phrased without a number rather than
//      with a guess — the same rule the empty planner's counts follow.
//
// PURE and testable, like everything else the planner reasons with: nothing in
// this section can be checked in a browser by an agent (it sits behind a
// session), so the logic lives where a test can reach it.

export type NextMoveId =
  | "overdue"
  | "cold-start"
  | "pick-work"
  | "pick-place"
  | "pick-city"
  | "commit"
  | "start"
  | "deadline"
  | "undated"
  | "steady";

export type NextMove = {
  id: NextMoveId;
  /** What is true right now, said to them. */
  headline: string;
  /** Why we are saying this, in one sentence. Never omitted. */
  why: string;
  action: { label: string; href: string };
  /**
   * A second, quieter way out — and at most one. Two alternatives beside a
   * recommendation is a menu, which is what this exists to replace.
   */
  alt?: { label: string; href: string };
  /**
   * `urgent` is a closed date and nothing else. It is the only tone allowed to
   * use the warning colour, so that colour keeps meaning "this one ran out".
   */
  tone: "urgent" | "open" | "steady";
};

export type NextMoveInput = {
  /** Fields of study on the profile. 0 means not stated, which is a valid answer. */
  fieldsStated: number;
  /** What they claimed out of the guide. */
  picks: PickCounts;
  /** Opportunities they said they would enter. */
  committed: number;
  /** Of those, how many they have actually started or finished. */
  started: number;
  /** Deadlines already closed with the thing still sitting in "not started". */
  overdue: number;
  /** Things in the catalog they can enter right now. */
  openToYou: number;
  /** Areas of work their fields open — walked out of the spine. */
  reachableAreas: number;
  /** Countries where that work lives — walked out of the spine. */
  reachableCountries: number;
  /** Cities we profile inside the countries they picked. */
  citiesInPicked: number;
  /** The nearest confirmed date in their plan, if there is one. */
  nextDeadline: { title: string; daysLeft: number } | null;
  /** How many dated things their plan holds at all. */
  dated: number;
};

/** `?f=all` when they stated nothing, so the guide widens instead of emptying. */
function guide(path: string, fieldsStated: number): string {
  return fieldsStated > 0 ? path : `${path}?f=all`;
}

/** "5 countries" / "1 country" — never "1 countries", never a bare number. */
function count(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/**
 * The move, decided by the FIRST rule that matches.
 *
 * The order is the argument, not the implementation. It runs from what has
 * already gone wrong, through the question they are furthest from answering,
 * to the thing that is closest to happening — because a student who has let a
 * deadline pass does not need to be told about Berlin, and a student with a
 * deadline in nine days does not need to be sent back to step one.
 */
export function nextMove(input: NextMoveInput): NextMove {
  const { picks } = input;
  const anyPick = picks.work + picks.place + picks.hub + picks.route > 0;

  // 1 ── Something closed while they were not looking. Nothing outranks this,
  // and the copy refuses to read as a scolding: not entering is information
  // about the student, not a verdict on them.
  if (input.overdue > 0) {
    return {
      id: "overdue",
      headline:
        input.overdue === 1
          ? "One thing closed while it was still sitting in 'not started'."
          : `${input.overdue} things closed while they were still in 'not started'.`,
      why: "If you entered, move it to done. If you didn't, that is worth knowing too — it usually means the thing was never really yours, and dropping it clears the way for something that is.",
      action: { label: "Sort them out", href: "/planner?view=board" },
      tone: "urgent",
    };
  }

  // 2 ── Nothing at all. The first move is the most concrete thing that exists,
  // because it needs no self-knowledge: a real deadline you can meet at your
  // age. Asking "what do you want to study" here is the form this product
  // exists to avoid.
  if (!anyPick && input.committed === 0) {
    return {
      id: "cold-start",
      headline: "Your plan is empty, which is the normal way to arrive.",
      why: "Most people can't say what they want to study, and no screen is going to produce that answer. Start with something real instead: a thing you can actually enter, at your age, this year — the answer assembles out of what you do.",
      action: {
        label:
          input.openToYou > 0
            ? `See the ${count(input.openToYou, "thing", "things")} open to you`
            : "See what you can enter",
        href: "/opportunities",
      },
      alt: {
        label: "Or read what a kind of work is really like",
        href: guide("/guide/work", input.fieldsStated),
      },
      tone: "open",
    };
  }

  // 3 ── They are doing things, or have stated a field, but have never said
  // what any of it is FOR. This is the question under "what do I want to
  // study", asked in the one form that has an answer.
  if (picks.work === 0) {
    return {
      id: "pick-work",
      headline: "You haven't put a kind of work on your plan yet.",
      why:
        input.reachableAreas > 0
          ? `Your fields open ${count(input.reachableAreas, "area of work", "areas of work")}. Each one states what the day is actually like and who should look elsewhere — which is the half a brochure leaves out.`
          : "Each area of work states what the day is actually like, what the catch is, and who should look elsewhere — which is the half a brochure leaves out.",
      action: {
        label: "Look at the kinds of work",
        href: guide("/guide/work", input.fieldsStated),
      },
      tone: "open",
    };
  }

  // 4 ── They know what work. They have not asked where it lives. Countries
  // before cities: a country contains cities, and the guide's zoom shipped
  // backwards once already.
  if (picks.place === 0) {
    return {
      id: "pick-place",
      headline: `You've marked ${count(picks.work, "kind of work", "kinds of work")}. Next is where that work actually is.`,
      why:
        input.reachableCountries > 0
          ? `${count(input.reachableCountries, "country", "countries")} in the guide host it. Each one says what it costs, what admissions weighs, and what happens after you graduate there — including the ones where the answer is 'stay'.`
          : "A country profile says what it costs, what admissions weighs, and what happens after you graduate there — including the ones where the answer is 'stay'.",
      action: {
        label: "See what each country costs and demands",
        href: guide("/guide/places", input.fieldsStated),
      },
      tone: "open",
    };
  }

  // 5 ── A country is not one labour market. Only offered when the countries
  // they picked actually contain cities we profile — otherwise this would send
  // them to a list with nothing of theirs in it.
  if (picks.hub === 0 && input.citiesInPicked > 0) {
    return {
      id: "pick-city",
      headline: "A country is not one job market.",
      why: `The ${count(picks.place, "country", "countries")} on your plan hold ${count(input.citiesInPicked, "city", "cities")} we've written up — and the cost, the language and the way in differ more between two cities than most people expect.`,
      action: {
        label: "See the cities inside them",
        href: guide("/guide/cities", input.fieldsStated),
      },
      tone: "open",
    };
  }

  // 6 ── They have thought it through and done nothing about it. This is the
  // gap the whole product measures: an intention that never became an act.
  if (input.committed === 0) {
    return {
      id: "commit",
      headline: "You know roughly where you're going. Nothing is booked yet.",
      why: "Reading about it changes nothing on its own — the thing that moves an application is having entered something. Pick one you can actually meet this year and put a date on it.",
      action: {
        label:
          input.openToYou > 0
            ? `See the ${count(input.openToYou, "thing", "things")} open to you`
            : "See what you can enter",
        href: "/opportunities",
      },
      tone: "open",
    };
  }

  // 7 ── Committed, never started. We ask "when will you start?" precisely so
  // this state is observable; saying nothing about it would waste the answer.
  if (input.started === 0) {
    return {
      id: "start",
      headline: `You said you'd enter ${count(input.committed, "thing", "things")}. None of them has moved.`,
      why: "The gap between saying and starting is where almost everything is lost, and it closes with one small first step rather than with a decision. Move one to 'in progress' and the rest gets easier.",
      action: { label: "Open your board", href: "/planner?view=board" },
      tone: "open",
    };
  }

  // 8 ── Everything is moving and something is close. A date we can stand
  // behind is the only thing allowed to become a countdown.
  if (input.nextDeadline) {
    const { title, daysLeft } = input.nextDeadline;
    return {
      id: "deadline",
      headline:
        daysLeft <= 0
          ? `${title} closes today.`
          : `${title} closes in ${count(daysLeft, "day", "days")}.`,
      why: "It is the next dated thing you're carrying, so it is the one worth protecting time for this week. Everything else on your plan can wait behind it.",
      action: { label: "See what's next", href: "/planner?view=next" },
      tone: daysLeft <= 7 ? "urgent" : "steady",
    };
  }

  // 9 ── Carrying things, none of which has a date we can stand behind. Said
  // plainly rather than hidden: an unannounced date is the organiser's silence,
  // not our omission, and a student planning around a guess is worse off than
  // one who knows there is nothing to plan around.
  if (input.dated === 0) {
    return {
      id: "undated",
      headline: "Nothing you're carrying has an announced date yet.",
      why: "We won't put a countdown on a date we can't check against the organiser's own page. In the meantime the useful move is to widen what you're carrying, so your year doesn't depend on one organiser publishing on time.",
      action: { label: "See what else you can enter", href: "/opportunities" },
      tone: "steady",
    };
  }

  // 10 ── Nothing is wrong and nothing is urgent. Still one move, and it is the
  // honest one: the plan is not the point, the work is.
  return {
    id: "steady",
    headline: "Your plan is moving, and nothing needs rescuing this week.",
    why: "This is the state worth staying in. The one thing that keeps it true is widening slowly — one more thing entered is worth more than any amount of re-reading what you already decided.",
    action: { label: "See what else you can enter", href: "/opportunities" },
    alt: {
      label: "Or think a decision through on a map",
      href: "/planner?view=map",
    },
    tone: "steady",
  };
}
