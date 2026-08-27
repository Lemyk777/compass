import type { FacultyValue } from "@/lib/data/faculties";

// HOW WE LEARN WHO SOMEONE IS WITHOUT ASKING THEM.
//
// The product asked "what field do you want to study?" and, when that failed,
// offered a quiz that asked slightly gentler versions of the same abstraction.
// Both require the answer the student came here BECAUSE THEY DO NOT HAVE. A
// fifteen-year-old cannot say "I value autonomy in my work"; they can say which
// of two Tuesdays sounds more like them.
//
// So: a beat is one concrete moment of real work, 15–25 words, containing no
// jargon and NAMING NO PROFESSION. Two at a time. Three answers — this one,
// neither, or "I don't get it".
//
// THREE RULES:
//
// 1. **Observations, never types.** Nothing here ever produces "you are an
//    Investigator". It produces "you picked the one where the result lands the
//    same evening, twice". A personality label is a claim we cannot support,
//    and the same discipline that keeps a countdown off an unconfirmed date
//    keeps a type off a student.
// 2. **Speak at three pairs, not eight.** A confused student will not reach the
//    eighth. Three is enough to say something true.
// 3. **"I don't get it" is a first-class answer** and contributes NO signal. It
//    is the button nobody builds, and it is also our own quality feedback: a
//    beat that collects them is badly written.
//
// The axes are the SHAPE of work, not the faculty. Faculties fall out of this
// as an output; they are never the question. Fixed per-option weights and pure
// scoring, the same pattern as `interest-quiz.ts`.
//
// PURE and free of prose registries — this one is safe in a client bundle.

/** The shape of work, which is what a person can actually recognise. */
export type WorkAxis =
  | "result_today"
  | "result_years"
  | "with_people"
  | "with_things"
  | "inside_rules"
  | "inside_fog"
  | "making_new"
  | "keeping_alive"
  | "alone"
  | "in_a_group";

export type Beat = {
  id: string;
  /** One concrete Tuesday. No jargon, no job title. */
  text: string;
  /** The same thing in plainer words, for "I don't get it". */
  plainer: string;
  /** What picking this says about the shape of work they lean toward. */
  axes: Partial<Record<WorkAxis, number>>;
  /** The fields this leans toward. An output, never the question. */
  fields: Partial<Record<FacultyValue, number>>;
};

export type BeatReaction = "picked" | "passed" | "unclear";

/** beatId → what they did with it. */
export type BeatAnswers = Record<string, BeatReaction>;

export const BEATS: Beat[] = [
  {
    id: "numbers-lie",
    text: "You go through a company's accounts looking for the number that does not add up. You find it by evening.",
    plainer:
      "Reading a company's financial records to find what does not add up. You find it the same day.",
    axes: { result_today: 2, with_things: 1, inside_rules: 1, alone: 1 },
    fields: { business_economics: 2 },
  },
  {
    id: "holds-by-morning",
    text: "You built something that breaks whenever too many people open it at once. You have until morning to find out why.",
    plainer:
      "Something you built keeps breaking under heavy use. You have until morning to find the cause.",
    axes: { result_today: 2, with_things: 2, inside_fog: 1, alone: 1 },
    fields: { computer_science: 2 },
  },
  {
    id: "same-question-fortieth",
    text: "Someone has had frightening news that nobody explained properly. You explain it to them, for the fortieth time this week.",
    plainer:
      "Explaining something worrying and complicated to one anxious person after another, all day.",
    axes: { with_people: 2, result_today: 1, keeping_alive: 1 },
    fields: { medicine_health: 2, humanities_social: 1 },
  },
  {
    id: "one-sentence-fought",
    text: "You argue over the wording of a single sentence for three days. How it is written decides what thousands of people may do.",
    plainer:
      "Days spent on the exact wording of a rule. Small changes to it change what people may do.",
    axes: { inside_rules: 2, with_people: 1, result_years: 1 },
    fields: { law: 2 },
  },
  // ── The remaining beats. Faculty coverage: engineering, computer_science,
  // business_economics, natural_sciences, humanities_social, medicine_health,
  // law and arts_design each carry three beats as their dominant field.
  // Axis coverage: both ends of every dichotomy (result_today/result_years,
  // with_people/with_things, inside_rules/inside_fog, making_new/keeping_alive,
  // alone/in_a_group) appear more than once. ──────────────────────────────────
  {
    id: "model-that-snapped",
    text: "You built a model bridge and it snapped at half the weight it should hold. You work out which beam went first.",
    plainer:
      "A model built to test a bridge design breaks under weight. You work out which part failed first.",
    axes: { with_things: 2, result_today: 1, alone: 1, making_new: 1 },
    fields: { engineering: 2 },
  },
  {
    id: "forty-seconds-in",
    text: "You are playing live and the group loses the timing forty seconds in. You pull it back together without stopping.",
    plainer:
      "A live music performance loses its timing early. The players correct it together without stopping.",
    axes: { in_a_group: 2, result_today: 1, inside_fog: 1 },
    fields: { arts_design: 2 },
  },
  {
    id: "redrawn-nine-times",
    text: "You redrew one small part nine times over two years. It slides into place first try, and nobody outside will know.",
    plainer:
      "A physical part is redrawn many times over a long project. When it finally fits, nobody outside notices.",
    axes: { result_years: 2, with_things: 1, inside_rules: 1, alone: 1 },
    fields: { engineering: 2 },
  },
  {
    id: "pattern-or-accident",
    text: "You spot a pattern in this morning's numbers that might be nothing. You spend six more months finding out which.",
    plainer:
      "Research data shows a pattern that might be chance. Six more months of testing decide which.",
    axes: { inside_fog: 2, result_years: 1, alone: 1 },
    fields: { natural_sciences: 2 },
  },
  {
    id: "six-guesses-one-machine",
    text: "You stand round a machine that has stopped the whole production line. Five people are guessing the cause, and all five differ.",
    plainer:
      "A factory machine has stopped the whole line. Five people each name a different cause, and one is right.",
    axes: { in_a_group: 2, with_things: 1, result_today: 1 },
    fields: { engineering: 2 },
  },
  {
    id: "still-fine-by-sunrise",
    text: "You are the last person to check on everyone before the night shift. Whether they are all fine by sunrise is on you.",
    plainer:
      "You make the last check on a ward of patients before night. Whether they are all well by dawn is on you.",
    axes: { keeping_alive: 2, with_people: 1, result_today: 1 },
    fields: { medicine_health: 2 },
  },
  {
    id: "eleventh-measurement",
    text: "You run the same measurement an eleventh time, alone in the room. The number still refuses to come out right.",
    plainer:
      "A scientific measurement is repeated alone, late at night. The number still does not match the theory.",
    axes: { inside_fog: 2, alone: 1, result_years: 1 },
    fields: { natural_sciences: 2 },
  },
  {
    id: "what-they-heard-in-common",
    text: "You listen to forty people argue about why their town is emptying. Then you stand up and say what they agreed on.",
    plainer:
      "Forty residents at a town meeting give different reasons for the same problem. You say what they agreed on.",
    axes: { with_people: 2, in_a_group: 1, result_today: 1 },
    fields: { humanities_social: 2 },
  },
  {
    id: "blank-at-nine",
    text: "You start the morning with a blank canvas and no idea what goes on it. By evening something real is finished.",
    plainer:
      "An artwork starts as an empty canvas with no plan. By evening something finished exists.",
    axes: { making_new: 2, alone: 1 },
    fields: { arts_design: 2 },
  },
  {
    id: "before-it-is-gone",
    text: "Two people are the last who remember how a village festival was run. You write it all down before they are gone.",
    plainer:
      "Two very old people are the last who remember a village tradition. Writing it down this year falls to you.",
    axes: { keeping_alive: 2, result_years: 1, with_people: 1 },
    fields: { humanities_social: 2 },
  },
  {
    id: "not-sure-the-seventh-time",
    text: "You redo the same corner of your drawing for a seventh time. Nobody can tell you whether it is finished, including you.",
    plainer:
      "In creative work nothing tells you when a piece is done. You redo one corner again and still cannot be sure.",
    axes: { inside_fog: 2, alone: 1 },
    fields: { arts_design: 2 },
  },
  {
    id: "no-version-of-almost",
    text: "You spend the night hunting for why your code will not run. It either works or it does not, with nothing between.",
    plainer:
      "Computer code either runs or it does not, with nothing in between. It is midnight and yours still does not.",
    axes: { inside_rules: 2, with_things: 1, result_today: 1, alone: 1 },
    fields: { computer_science: 2 },
  },
  {
    id: "four-minutes-to-know",
    text: "You wait four minutes for a single reading. It will either confirm the idea you have worked on for months, or end it.",
    plainer:
      "A lab reading will confirm months of work or end it. The instrument finishes in four minutes.",
    axes: { result_today: 2, alone: 1 },
    fields: { natural_sciences: 2 },
  },
  {
    id: "one-shared-answer-by-five",
    text: "You sit down twelve strangers who all disagree about what happened. By five o'clock they leave with one shared answer.",
    plainer:
      "Twelve people on a jury disagree about what happened. Getting them to one answer by five is your job.",
    axes: { with_people: 2, in_a_group: 1, result_today: 1 },
    fields: { law: 2 },
  },
  {
    id: "losing-money-every-month",
    text: "You decide this week whether a family shop survives another season. It has been losing money every month.",
    plainer:
      "A small family business loses money every month. You decide this week whether it stays open.",
    axes: { keeping_alive: 2, result_years: 1, alone: 1 },
    fields: { business_economics: 2 },
  },
  {
    id: "one-fixed-amount",
    text: "You have one fixed pot of money and a table of people who each want more. They leave agreeing on one split.",
    plainer:
      "A fixed budget, and everyone at the table wants more of it. Nobody leaves until they agree on the split.",
    axes: { in_a_group: 2, with_people: 1, result_today: 1 },
    fields: { business_economics: 2 },
  },
  {
    id: "started-as-nothing",
    text: "You open an empty file in the morning. By tonight thousands of people are tapping something that did not exist.",
    plainer:
      "Software starts as an empty file in the morning. By evening thousands of people are using it.",
    axes: { making_new: 2, result_today: 1, alone: 1 },
    fields: { computer_science: 2 },
  },
  {
    id: "numbers-that-wont-show-it",
    text: "You keep getting results that say normal, and something is clearly still wrong. You work out what the tests are missing.",
    plainer:
      "Medical tests keep reading normal while something is clearly wrong. You work out what they are missing.",
    axes: { inside_fog: 2, with_people: 1 },
    fields: { medicine_health: 2 },
  },
  {
    id: "written-for-a-world-without-this",
    text: "You read a rule that was written before this technology existed. You work out what it is supposed to mean now.",
    plainer:
      "A law written before this technology existed still binds people. You decide what it means now.",
    axes: { inside_rules: 2, inside_fog: 1, result_years: 1 },
    fields: { law: 2 },
  },
  {
    id: "a-dozen-different-versions",
    text: "You hear a dozen people give different versions of the same event. Tonight you decide which parts you believe.",
    plainer:
      "Twelve people in one town describe the same event differently. By tonight you choose what to believe.",
    axes: { with_people: 2, inside_fog: 1, result_today: 1 },
    fields: { humanities_social: 2 },
  },
];

/**
 * The order the pairs are asked in, and it is a curated sequence rather than a
 * shuffle: the first pair has to be the one that is easiest to have an opinion
 * about, because it is the first thing the student ever does here.
 *
 * Each beat appears in exactly one pair — a beat seen twice would be counted
 * twice, and a student who saw it twice would think the product had lost track.
 */
export const BEAT_PAIRS: [string, string][] = [
  ["numbers-lie", "holds-by-morning"],
  ["same-question-fortieth", "one-sentence-fought"],
  ["model-that-snapped", "forty-seconds-in"],
  ["blank-at-nine", "before-it-is-gone"],
  ["what-they-heard-in-common", "eleventh-measurement"],
  ["no-version-of-almost", "not-sure-the-seventh-time"],
  ["six-guesses-one-machine", "still-fine-by-sunrise"],
  ["redrawn-nine-times", "pattern-or-accident"],
  ["four-minutes-to-know", "one-shared-answer-by-five"],
  ["losing-money-every-month", "a-dozen-different-versions"],
  ["one-fixed-amount", "started-as-nothing"],
  ["numbers-that-wont-show-it", "written-for-a-world-without-this"],
];

const PAIR_INDEX = new Map<string, number>();
BEAT_PAIRS.forEach(([a, b], i) => {
  PAIR_INDEX.set(a, i);
  PAIR_INDEX.set(b, i);
});

const BY_ID = new Map(BEATS.map((b) => [b.id, b]));

const REACTION_SET = new Set<string>(["picked", "passed", "unclear"]);

/**
 * Is this an id the registry actually contains?
 *
 * Lives here rather than in the server action because a bound belongs with the
 * thing it bounds, and because the action is a `"use server"` module a test
 * cannot import. The action is a public HTTP endpoint, so this is the whole
 * defence against an arbitrary string reaching the database under the name of a
 * beat.
 */
export function isKnownBeat(id: string): boolean {
  return BY_ID.has(id);
}

export function isBeatReaction(v: unknown): v is BeatReaction {
  return typeof v === "string" && REACTION_SET.has(v);
}

/** A pair counts as answered when at least one of its beats got a real verdict. */
export function pairsAnswered(answers: BeatAnswers): number {
  const done = new Set<number>();
  for (const [id, reaction] of Object.entries(answers)) {
    if (reaction === "unclear") continue;
    const i = PAIR_INDEX.get(id);
    if (i !== undefined) done.add(i);
  }
  return done.size;
}

/**
 * The next pair to ask, or null when the sequence is finished.
 *
 * `unclear` leaves a pair OPEN. It means "I don't understand this sentence",
 * not "I have decided" — treating it as seen threw the pair away the moment a
 * student asked for it to be rephrased, which is the opposite of what that
 * button is for, and it disagreed with `pairsAnswered`, which does not count
 * such a pair either. One of the two had to move; this is the one that was
 * wrong.
 */
export function nextPair(answers: BeatAnswers): [Beat, Beat] | null {
  const open = (id: string) =>
    answers[id] === undefined || answers[id] === "unclear";
  for (const [a, b] of BEAT_PAIRS) {
    if (open(a) && open(b)) {
      const left = BY_ID.get(a);
      const right = BY_ID.get(b);
      // A pair naming a missing beat is skipped rather than thrown on: the test
      // makes it impossible to ship, and a student is not the right person to
      // find out about it.
      if (left && right) return [left, right];
    }
  }
  return null;
}

/**
 * The axes they lean toward, strongest first.
 *
 * **Only `picked` counts.** Passing on something is not evidence about the
 * other thing — a student can dislike both — and `unclear` is explicitly not a
 * preference. Iterating the registry rather than the answers is what makes an
 * unknown key inert, the same property `scoreInterestQuiz` has.
 */
export function scoreBeats(
  answers: BeatAnswers,
): { axis: WorkAxis; score: number }[] {
  const totals = new Map<WorkAxis, number>();
  for (const beat of BEATS) {
    if (answers[beat.id] !== "picked") continue;
    for (const [axis, weight] of Object.entries(beat.axes) as [
      WorkAxis,
      number,
    ][]) {
      totals.set(axis, (totals.get(axis) ?? 0) + weight);
    }
  }
  return [...totals.entries()]
    .map(([axis, score]) => ({ axis, score }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

/** The fields those choices lean toward — an output of the engine, never its question. */
export function topFieldsFromBeats(
  answers: BeatAnswers,
  n = 3,
): FacultyValue[] {
  const totals = new Map<FacultyValue, number>();
  for (const beat of BEATS) {
    if (answers[beat.id] !== "picked") continue;
    for (const [faculty, weight] of Object.entries(beat.fields) as [
      FacultyValue,
      number,
    ][]) {
      totals.set(faculty, (totals.get(faculty) ?? 0) + weight);
    }
  }
  return [...totals.entries()]
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([faculty]) => faculty);
}

/**
 * What we noticed, said back to them — and the reason the engine reads as a
 * person rather than as a form.
 *
 * It waits for three pairs, it names the axis they actually leaned on, and it
 * NEVER names a type. There is one line per axis and it describes the choosing,
 * not the chooser.
 */
const AXIS_OBSERVATION: Record<WorkAxis, string> = {
  result_today:
    "Twice now you have picked the one where the result lands the same evening. That is rarer than you would think, and it rules a lot of work in and out on its own.",
  result_years:
    "You keep choosing the work whose result arrives years later. Most people cannot stand that, and the fields that need it are short of people who can.",
  with_people:
    "Every one you picked has another person in it. That is a preference about the whole shape of a working day, not about a subject.",
  with_things:
    "You keep choosing the ones where the thing you are working on is not a person. It makes the day quieter, and it is worth knowing about yourself early.",
  inside_rules:
    "You lean toward work with a rule you can check yourself against. That is not caution. It is a real and useful preference about how you like to be judged.",
  inside_fog:
    "You keep picking the ones where nobody knows the answer yet. Most jobs are not like that, and the ones that are will not feel like a leap to you.",
  making_new:
    "Every one you chose starts with a blank page. That is a specific appetite, and it is worth aiming at deliberately rather than hoping to find it.",
  keeping_alive:
    "You keep choosing the work of keeping something running rather than starting something. That work is undersold and it is where most of the world actually is.",
  alone:
    "You picked the ones you would do largely by yourself. Worth knowing before you choose a field where the day is mostly meetings.",
  in_a_group:
    "You keep choosing the work that happens between people. That points at whole fields, and it rules out a few that look similar from outside.",
};

/**
 * How many answered pairs an observation is worth speaking at.
 *
 * It speaks on the pair that EARNED it and then goes quiet, rather than
 * standing there forever. Without this the same paragraph followed the reader
 * across all 88 guide pages, the catalog and the plan, for as long as the
 * leading axis held — which is the "never repeats itself" rule broken in the
 * most tiring way available: not by saying two things, but by saying one thing
 * without stopping.
 */
const SPEAKS_AT = [3, 6, 9, 12];

export function observationFromBeats(answers: BeatAnswers): string | null {
  const done = pairsAnswered(answers);
  // Rule 2: three pairs, not eight — and only on the pair that earned it.
  if (!SPEAKS_AT.includes(done)) return null;
  const [strongest] = scoreBeats(answers);
  // Everything picked was unclear or nothing was picked at all — we have no
  // grounds, so we say nothing rather than something shaped like a finding.
  if (!strongest || strongest.score < 2) return null;
  return AXIS_OBSERVATION[strongest.axis];
}
