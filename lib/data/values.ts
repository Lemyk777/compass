import type { CareerArea } from "@/lib/data/careers";

// "What do you actually want out of work?" — the optional refine on top of the
// interest quiz. Interests alone are a thin signal: two students who both pick
// Computer Science want different lives, and one of them will hate the job the
// other is aiming at.
//
// Three questions, fixed weights, pure scoring — same rules as the interest
// quiz: DETERMINISTIC, no model call, and never mandatory.
//
// What it is allowed to do is deliberately narrow. It **reorders career areas
// inside the fields the student already chose** and says which ones sit closest
// to what they told us. It does NOT change the fields themselves, because the
// fields drive which opportunities we show, and "I want to earn well" is not
// evidence about what a 14-year-old should enter next month. It also never
// hides an area — the whole list stays, in a different order.
//
// The tags on each area are generalisations about a kind of work, not promises
// about a salary; the UI says so, because pay and security vary enormously by
// country and employer and we are mostly serving students outside the countries
// these generalisations were written about.

export type ValueAxis =
  | "money"
  | "impact"
  | "freedom"
  | "stability"
  | "people"
  | "creating";

export const VALUE_LABEL: Record<ValueAxis, string> = {
  money: "Earning well",
  impact: "Helping people",
  freedom: "Independence",
  stability: "Security",
  people: "Working with people",
  creating: "Making things",
};

export type ValuesOption = {
  id: string;
  label: string;
  /** Points this option adds to each value axis. */
  weights: Partial<Record<ValueAxis, number>>;
};

export type ValuesQuestion = {
  id: string;
  prompt: string;
  options: ValuesOption[];
};

export const VALUES_QUIZ: ValuesQuestion[] = [
  {
    id: "worth-it",
    prompt: "Ten years from now, what would make you say the job was worth it?",
    options: [
      {
        id: "pay",
        label: "It pays well, and I can support myself and the people I care about",
        weights: { money: 2 },
      },
      {
        id: "help",
        label: "It changes something for people who need it",
        weights: { impact: 2 },
      },
      {
        id: "own",
        label: "I answer to myself, my own hours, my own projects",
        weights: { freedom: 2 },
      },
      {
        id: "steady",
        label: "It's steady, and I'll always be needed, wherever I end up",
        weights: { stability: 2 },
      },
    ],
  },
  {
    id: "bother",
    // Asked as an aversion on purpose: people are far clearer about what they
    // can't stand than about what they want.
    prompt: "Which of these would bother you most?",
    options: [
      {
        id: "same",
        label: "Doing the same thing every day for years",
        weights: { freedom: 1, creating: 1 },
      },
      {
        id: "less",
        label: "Earning less than people who studied less than me",
        weights: { money: 2 },
      },
      {
        id: "pointless",
        label: "Work that doesn't help anyone in particular",
        weights: { impact: 2 },
      },
      {
        id: "alone",
        label: "Working alone, with no team around me",
        weights: { people: 2 },
      },
    ],
  },
  {
    id: "matters",
    prompt: "Which matters more to you, honestly?",
    options: [
      {
        id: "build",
        label: "Building things I can point at",
        weights: { creating: 2 },
      },
      {
        id: "demand",
        label: "A job that's in demand in any country",
        weights: { stability: 2 },
      },
      {
        id: "trusted",
        label: "Being the person others come to for help",
        weights: { people: 1, impact: 1 },
      },
      {
        id: "choose",
        label: "Choosing for myself what I work on",
        weights: { freedom: 2 },
      },
    ],
  },
];

/** Answers are a map of questionId → chosen optionId. */
export type ValuesAnswers = Record<string, string>;
export type ValueScores = Partial<Record<ValueAxis, number>>;

/** Score a (possibly partial) set of answers onto the value axes. */
export function scoreValues(answers: ValuesAnswers): ValueScores {
  const totals: ValueScores = {};
  for (const q of VALUES_QUIZ) {
    const optionId = answers[q.id];
    if (!optionId) continue;
    const option = q.options.find((o) => o.id === optionId);
    if (!option) continue;
    for (const [axis, weight] of Object.entries(option.weights) as [
      ValueAxis,
      number,
    ][]) {
      totals[axis] = (totals[axis] ?? 0) + weight;
    }
  }
  return totals;
}

/** The axes the student leaned on, strongest first (ties keep quiz order). */
export function topValues(scores: ValueScores, n = 3): ValueAxis[] {
  const order = Object.keys(VALUE_LABEL) as ValueAxis[];
  return order
    .filter((axis) => (scores[axis] ?? 0) > 0)
    .sort((a, b) => (scores[b] ?? 0) - (scores[a] ?? 0))
    .slice(0, n);
}

/** How well one career area lines up with what the student said. */
export function areaValueScore(area: CareerArea, scores: ValueScores): number {
  return area.values.reduce((sum, axis) => sum + (scores[axis] ?? 0), 0);
}

/**
 * Career areas reordered by fit, best first. Nothing is ever dropped and ties
 * keep their curated order, so an unanswered (or contradictory) quiz leaves the
 * list exactly as it was — the refine can only ever change the ORDER.
 */
export function rankAreasByValues(
  areas: CareerArea[],
  scores: ValueScores,
): { area: CareerArea; score: number; fits: boolean }[] {
  const scored = areas.map((area, index) => ({
    area,
    score: areaValueScore(area, scores),
    index,
  }));
  const best = Math.max(0, ...scored.map((s) => s.score));
  return scored
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ area, score }) => ({
      area,
      score,
      // Only badge a real, non-trivial match: something must have been answered
      // AND this area must be at the top of what it produced.
      fits: best > 0 && score === best,
    }));
}
