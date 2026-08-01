// What a student said they would do about an opportunity, and when.
//
// Kept as a pure module on purpose: the actions that write it need a database
// and a session, but the vocabulary, validation and the phrasing of the
// commitment do not — and those are the parts worth checking automatically.
//
// The "when" question is an implementation intention (Gollwitzer & Sheeran,
// d = 0.65). Two rules from that literature shape the options below:
//   • the moment must be CONCRETE — "soon" is not an implementation intention;
//   • it must be answerable in one tap, or the friction eats the effect.

export type IntentStatus = "planning" | "applied" | "dropped";

export type OpportunityIntent = {
  opportunityId: string;
  status: IntentStatus;
  /** The moment they named, in their own words ("this weekend"). */
  startWhen?: string | null;
  /** Optional second half of the intention — where, or how they'll start. */
  startDetail?: string | null;
  /**
   * The student's own one-line answer to "why does this matter to you?".
   * Self-generated relevance (Hulleman & Harackiewicz) — the effect comes from
   * the student writing the reason, not from us telling them in the blurb.
   * Nullable and additive; backed by migration 0023 and degrades cleanly when
   * that migration has not been applied yet.
   */
  whyMatters?: string | null;
};

/**
 * The concrete moments we offer. Deliberately short and near-term: an
 * intention set three months out is indistinguishable from no intention, and
 * every one of these is a moment a school student can actually picture.
 */
export const START_OPTIONS = [
  "tonight",
  "tomorrow",
  "this weekend",
  "next week",
] as const;

export type StartOption = (typeof START_OPTIONS)[number];

/** Longest free-text we store for either half of the intention. */
export const INTENT_TEXT_MAX = 120;

/**
 * "Why does this matter to you?" gets a little more room than "this weekend" —
 * it is a reason, not a timing — but stays a single line: the mechanic is a
 * quick self-generated sentence, not an essay.
 */
export const WHY_MATTERS_MAX = 200;

export function isIntentStatus(v: unknown): v is IntentStatus {
  return v === "planning" || v === "applied" || v === "dropped";
}

/**
 * Trim and bound a free-text answer. Empty (or whitespace-only) becomes null so
 * "no answer" is one value in the database rather than three. `max` defaults to
 * INTENT_TEXT_MAX so every existing caller is unchanged.
 */
export function cleanIntentText(
  v: string | null | undefined,
  max: number = INTENT_TEXT_MAX
): string | null {
  if (v == null) return null;
  const trimmed = v.trim().replace(/\s+/g, " ");
  if (trimmed.length === 0) return null;
  return trimmed.slice(0, max);
}

/**
 * The sentence shown back to the student after they commit.
 *
 * Reflecting the intention back in the first person is part of the mechanic,
 * not decoration — the effect comes from having formed a concrete if-then plan,
 * and seeing it stated makes it a plan rather than a click.
 */
export function intentSentence(intent: OpportunityIntent): string {
  if (intent.status === "applied") return "You entered this.";
  if (intent.status === "dropped") return "You decided against this one.";
  const when = cleanIntentText(intent.startWhen);
  if (!when) return "You're doing this.";
  const detail = cleanIntentText(intent.startDetail);
  return detail
    ? `You're starting ${when} — ${detail}.`
    : `You're starting ${when}.`;
}

/** Index intents by opportunity id for O(1) lookup while rendering a list. */
export function indexIntents(
  intents: OpportunityIntent[]
): Record<string, OpportunityIntent> {
  const byId: Record<string, OpportunityIntent> = {};
  for (const i of intents) byId[i.opportunityId] = i;
  return byId;
}
