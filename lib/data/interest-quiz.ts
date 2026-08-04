import type { FacultyValue } from "@/lib/data/faculties";

// A short, optional interest quiz for students who don't yet know what they
// want — the counter-move to a field question a 13-year-old can't answer. It is
// deliberately DETERMINISTIC (no model call): each option carries fixed weights
// onto the eight faculties, we sum them, and the top few become a suggested
// field selection that feeds the same Opportunities matching everyone else uses.
//
// It is not a personality test and makes no claim to be one. It is a nudge from
// "I have no idea" to "here are three things worth exploring", which the student
// can then edit. Keep it to ~6 questions: long enough to separate the fields,
// short enough that finishing it never feels like the intake we removed.

export type QuizOption = {
  id: string;
  label: string;
  /** Points this option adds to each faculty. */
  weights: Partial<Record<FacultyValue, number>>;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: QuizOption[];
};

export const INTEREST_QUIZ: QuizQuestion[] = [
  {
    id: "afternoon",
    prompt: "Which sounds like the best way to spend a free afternoon?",
    options: [
      {
        id: "build",
        label: "Taking something apart to see how it works — or building it",
        weights: { engineering: 2 },
      },
      {
        id: "code",
        label: "Writing code for an app, a game, or a bot",
        weights: { computer_science: 2 },
      },
      {
        id: "make",
        label: "Drawing, designing, filming, or making music",
        weights: { arts_design: 2 },
      },
      {
        id: "read",
        label: "Reading about people, history, or why society works the way it does",
        weights: { humanities_social: 2 },
      },
    ],
  },
  {
    id: "headline",
    prompt: "Which headline would you click first?",
    options: [
      {
        id: "science",
        label: "A new discovery about space, the brain, or how matter works",
        weights: { natural_sciences: 2 },
      },
      {
        id: "medicine",
        label: "A breakthrough treatment for a disease",
        weights: { medicine_health: 2 },
      },
      {
        id: "law",
        label: "A landmark court ruling that changes the rules",
        weights: { law: 2 },
      },
      {
        id: "startup",
        label: "How a small startup grew into a giant",
        weights: { business_economics: 2 },
      },
    ],
  },
  {
    id: "team-role",
    prompt: "On a team, the role you slide into is…",
    options: [
      {
        id: "maker",
        label: "The one who makes the thing actually work",
        weights: { engineering: 1, computer_science: 1 },
      },
      {
        id: "planner",
        label: "The planner — timeline, budget, who does what",
        weights: { business_economics: 2 },
      },
      {
        id: "voice",
        label: "The voice — writing, presenting, persuading",
        weights: { humanities_social: 1, law: 1 },
      },
      {
        id: "designer",
        label: "The one who makes it look and feel right",
        weights: { arts_design: 2 },
      },
    ],
  },
  {
    id: "problem",
    prompt: "The kind of problem you'd happily get lost in:",
    options: [
      {
        id: "logic",
        label: "A hard logic or maths puzzle",
        weights: { computer_science: 1, engineering: 1, natural_sciences: 1 },
      },
      {
        id: "people",
        label: "Why a person or a group behaves the way they do",
        weights: { humanities_social: 2, medicine_health: 1 },
      },
      {
        id: "fair",
        label: "What the fair call is when rules or rights collide",
        weights: { law: 2 },
      },
      {
        id: "grow",
        label: "How to grow money, a brand, or an audience",
        weights: { business_economics: 2 },
      },
    ],
  },
  {
    id: "proud",
    prompt: "You'd feel proudest one day to…",
    options: [
      {
        id: "design",
        label: "Design a bridge, a machine, or a spacecraft",
        weights: { engineering: 2 },
      },
      {
        id: "ship",
        label: "Ship software millions of people use",
        weights: { computer_science: 2 },
      },
      {
        id: "heal",
        label: "Treat, heal, or care for people",
        weights: { medicine_health: 2 },
      },
      {
        id: "discover",
        label: "Discover something new about how the world works",
        weights: { natural_sciences: 2 },
      },
    ],
  },
  {
    id: "class",
    prompt: "The class you'd take even if nobody made you:",
    options: [
      {
        id: "stem",
        label: "Physics, Chemistry, or Biology",
        weights: { natural_sciences: 2 },
      },
      {
        id: "econ",
        label: "Economics or Business",
        weights: { business_economics: 2 },
      },
      {
        id: "humanities",
        label: "Literature, History, or Psychology",
        weights: { humanities_social: 2 },
      },
      {
        id: "arts",
        label: "Art, Design, or Music",
        weights: { arts_design: 2 },
      },
    ],
  },
];

export type QuizResult = { faculty: FacultyValue; score: number };

/** Answers are a map of questionId → chosen optionId. */
export type QuizAnswers = Record<string, string>;

/**
 * Score a (possibly partial) set of answers into faculties, highest first.
 * Only faculties with a positive score are returned, so an abandoned quiz never
 * "recommends" a field the student never leaned toward.
 */
export function scoreInterestQuiz(answers: QuizAnswers): QuizResult[] {
  const totals = new Map<FacultyValue, number>();
  for (const q of INTEREST_QUIZ) {
    const optionId = answers[q.id];
    if (!optionId) continue;
    const option = q.options.find((o) => o.id === optionId);
    if (!option) continue;
    for (const [faculty, weight] of Object.entries(option.weights) as [
      FacultyValue,
      number,
    ][]) {
      totals.set(faculty, (totals.get(faculty) ?? 0) + weight);
    }
  }
  return [...totals.entries()]
    .map(([faculty, score]) => ({ faculty, score }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

/** The top N suggested faculties from a completed quiz (default 3). */
export function topFacultiesFromQuiz(
  answers: QuizAnswers,
  n = 3
): FacultyValue[] {
  return scoreInterestQuiz(answers)
    .slice(0, n)
    .map((r) => r.faculty);
}
