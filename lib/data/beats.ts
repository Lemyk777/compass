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
    text: "You sit with a company's own numbers and look for the place where it is lying to itself. By evening, you find it.",
    plainer:
      "Reading a company's financial records to spot what does not add up, and finding it the same day.",
    axes: { result_today: 2, with_things: 1, inside_rules: 1, alone: 1 },
    fields: { business_economics: 2 },
  },
  {
    id: "holds-by-morning",
    text: "Your work has to hold ten thousand people by morning. Right now it does not. You spend the night finding out why.",
    plainer:
      "Something you built keeps breaking under heavy use, and you have until morning to work out the cause.",
    axes: { result_today: 2, with_things: 2, inside_fog: 1, alone: 1 },
    fields: { computer_science: 2 },
  },
  {
    id: "same-question-fortieth",
    text: "The same frightened question, for the fortieth time this week, from someone who has never been told the answer plainly.",
    plainer:
      "Explaining something worrying and complicated to one anxious person after another, all day.",
    axes: { with_people: 2, result_today: 1, keeping_alive: 1 },
    fields: { medicine_health: 2, humanities_social: 1 },
  },
  {
    id: "one-sentence-fought",
    text: "One sentence, argued over for three days, because whichever way it is written decides what thousands of people may do.",
    plainer:
      "Spending days on the exact wording of a rule, because small changes to it change what people are allowed to do.",
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
    text: "The scale model of the bridge you built snaps under half the weight it is meant to hold, and you spend the afternoon working out exactly which beam gave way.",
    plainer:
      "A model you built to test a bridge design breaks under weight, and you spend the day working out which part failed.",
    axes: { with_things: 2, result_today: 1, alone: 1, making_new: 1 },
    fields: { engineering: 2 },
  },
  {
    id: "forty-seconds-in",
    text: "The whole piece falls apart forty seconds in because two of you disagree about the timing, and you have to find the fix together before the room fills up.",
    plainer:
      "A group performance goes wrong early because two people disagree about the timing, and you have to fix it together before the audience arrives.",
    axes: { in_a_group: 2, result_today: 1, inside_fog: 1 },
    fields: { arts_design: 2 },
  },
  {
    id: "redrawn-nine-times",
    text: "The part you have redrawn nine times over two years finally slides into place on the first try, and no one outside the room will ever know it took nine.",
    plainer:
      "A physical part you have redesigned many times over a long project finally fits correctly the first time you test it, though nobody else will know how many tries it took.",
    axes: { result_years: 2, with_things: 1, inside_rules: 1, alone: 1 },
    fields: { engineering: 2 },
  },
  {
    id: "pattern-or-accident",
    text: "Nobody in the room yet knows whether the pattern in this morning's numbers is real or an accident, and only another six months of the same work will tell you.",
    plainer:
      "A pattern shows up in your data, but nobody can yet tell if it means something real or is just chance, and it will take another six months of testing to find out.",
    axes: { inside_fog: 2, result_years: 1, alone: 1 },
    fields: { natural_sciences: 2 },
  },
  {
    id: "six-guesses-one-machine",
    text: "Six of you stand around the machine that has stopped the whole line, each with a different guess about the cause, until one guess turns out to be the right one.",
    plainer:
      "A machine breaks down and stops an entire production line, and a group of you each guess at the cause until one guess turns out to be correct.",
    axes: { in_a_group: 2, with_things: 1, result_today: 1 },
    fields: { engineering: 2 },
  },
  {
    id: "still-fine-by-sunrise",
    text: "You are the last check before the lights go down for the night, and the whole shift comes down to whether everyone on the ward is still fine by sunrise.",
    plainer:
      "You are the last person to check on a group of patients before night, and the whole night's work is judged by whether they are all still okay by morning.",
    axes: { keeping_alive: 2, with_people: 1, result_today: 1 },
    fields: { medicine_health: 2 },
  },
  {
    id: "eleventh-measurement",
    text: "You run the same measurement for the eleventh time, alone in the room after everyone else has gone home, because the number refuses to match what it should.",
    plainer:
      "You repeat the same scientific measurement over and over, alone after everyone else has left, because the result keeps not matching what the theory predicts.",
    axes: { inside_fog: 2, alone: 1, result_years: 1 },
    fields: { natural_sciences: 2 },
  },
  {
    id: "what-they-heard-in-common",
    text: "A room of forty people disagree about why their town is emptying out, and by the end of the evening you have to stand up and say what you heard in common.",
    plainer:
      "Forty people in a town meeting all give different reasons for the same problem, and by the end of the night you have to summarise what they actually agreed on.",
    axes: { with_people: 2, in_a_group: 1, result_today: 1 },
    fields: { humanities_social: 2 },
  },
  {
    id: "blank-at-nine",
    text: "The canvas is blank at nine in the morning, and something real is on it by the time the light changes — you could not have told anyone beforehand what it would be.",
    plainer:
      "You start with a completely blank canvas in the morning and have made something real on it by the afternoon, without knowing in advance what it would turn out to be.",
    axes: { making_new: 2, alone: 1 },
    fields: { arts_design: 2 },
  },
  {
    id: "before-it-is-gone",
    text: "The only two people left who remember how the old festival was actually run are both past eighty, and this year it is on you to write it all down before it is gone.",
    plainer:
      "Only two very old people still remember how a local tradition used to work, and it is your job this year to record it properly before that knowledge disappears.",
    axes: { keeping_alive: 2, result_years: 1, with_people: 1 },
    fields: { humanities_social: 2 },
  },
  {
    id: "not-sure-the-seventh-time",
    text: "Nobody can tell you whether it is finished. You have redone the same corner of it six times and still are not sure if the seventh time will be the one that is right.",
    plainer:
      "There is no test that tells you when a piece of creative work is done — you redo the same small part six times and still cannot be sure the seventh attempt is right.",
    axes: { inside_fog: 2, alone: 1 },
    fields: { arts_design: 2 },
  },
  {
    id: "no-version-of-almost",
    text: "What you built either unlocks the next screen or it does not — there is no version of almost — and at midnight it still does not, for a reason you cannot see yet.",
    plainer:
      "Code you wrote either works correctly or it does not, with nothing in between, and at midnight it still is not working, for a reason you have not found yet.",
    axes: { inside_rules: 2, with_things: 1, result_today: 1, alone: 1 },
    fields: { computer_science: 2 },
  },
  {
    id: "four-minutes-to-know",
    text: "The reading either matches what your idea predicted or it wipes the idea out completely, and the machine finishes the run in the next four minutes.",
    plainer:
      "A lab measurement will either confirm or completely disprove an idea you had, and the equipment finishes producing that result in the next four minutes.",
    axes: { result_today: 2, alone: 1 },
    fields: { natural_sciences: 2 },
  },
  {
    id: "one-shared-answer-by-five",
    text: "Twelve strangers who disagree about what happened have to leave the room with one shared answer by five o'clock, and getting them there is entirely on you.",
    plainer:
      "A group of twelve people who disagree about the facts of a case must agree on one shared conclusion by five o'clock, and guiding them to it is your job.",
    axes: { with_people: 2, in_a_group: 1, result_today: 1 },
    fields: { law: 2 },
  },
  {
    id: "losing-money-every-month",
    text: "The little shop your family has run for eleven years is losing money every month, and this week you are the one who has to decide whether it survives another season.",
    plainer:
      "A small family business has been losing money every month, and this week you have to decide whether to keep it running for another season or close it.",
    axes: { keeping_alive: 2, result_years: 1, alone: 1 },
    fields: { business_economics: 2 },
  },
  {
    id: "one-fixed-amount",
    text: "Everyone in the room wants a different share of the same fixed amount of money, and the meeting does not end until all of you agree on one split.",
    plainer:
      "A group of people each want a different share of the same limited amount of money, and the meeting continues until everyone agrees on how to divide it.",
    axes: { in_a_group: 2, with_people: 1, result_today: 1 },
    fields: { business_economics: 2 },
  },
  {
    id: "started-as-nothing",
    text: "Yesterday this did not exist. This morning you opened a blank file, and by tonight thousands of people will tap on something that started out as nothing.",
    plainer:
      "You start building something from a completely empty file in the morning, and by the end of the day thousands of people will be using the finished version.",
    axes: { making_new: 2, result_today: 1, alone: 1 },
    fields: { computer_science: 2 },
  },
  {
    id: "numbers-that-wont-show-it",
    text: "The tests keep coming back normal, but something is still clearly wrong, and it is on you to work out what the numbers are not showing yet.",
    plainer:
      "Medical test results keep coming back within the normal range, even though something is clearly still wrong, and you have to work out what the numbers are missing.",
    axes: { inside_fog: 2, with_people: 1 },
    fields: { medicine_health: 2 },
  },
  {
    id: "written-for-a-world-without-this",
    text: "The rule everyone is relying on was written for a world without this technology in it, and it is on you to work out what it actually means now.",
    plainer:
      "An old rule that people still depend on was written before a new technology existed, and you have to work out how that rule should be understood now.",
    axes: { inside_rules: 2, inside_fog: 1, result_years: 1 },
    fields: { law: 2 },
  },
  {
    id: "a-dozen-different-versions",
    text: "A dozen people in the same small town each tell you a different version of what happened, and by tonight you have to decide which parts you actually believe.",
    plainer:
      "Twelve different people in the same town each give you a different account of the same event, and by the end of the day you must decide what you think really happened.",
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

/** The next pair to ask, or null when the sequence is finished. */
export function nextPair(answers: BeatAnswers): [Beat, Beat] | null {
  for (const [a, b] of BEAT_PAIRS) {
    if (answers[a] === undefined && answers[b] === undefined) {
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
    "You lean toward work with a rule you can check yourself against. That is not caution — it is a real and useful preference about how you like to be judged.",
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
