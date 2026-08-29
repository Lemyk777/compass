// The four closed vocabularies of an opportunity — kind, level, tier, cost — in
// ONE place, array-first, each with a `Record`-typed label map beside it.
//
// ── Why this module exists ───────────────────────────────────────────────────
//
// Two rules in this codebase were in direct conflict, and the wrong one kept
// winning:
//
//   • **The one-list rule.** A vocabulary is declared once and every validator,
//     filter, facet and form derives from it. `COMPETITION_CATEGORIES` follows
//     it, and the comment above it says why: a hand-written `T[]` literal is
//     checked by the compiler for WRONG members and never for MISSING ones.
//   • **The bundle rule.** `key-dates.ts` builds a lookup map over the whole
//     ~2,700-entry catalog at module load, so it cannot be tree-shaken and no
//     client-reachable file may import a runtime value from it.
//
// The canonical arrays lived inside `key-dates.ts`. So every client-reachable
// option list had to hand-write its own copy, and the server-side validators
// then copied the client's copy. `level` ended up declared in FIVE places and
// `cost` in SIX, none of them checkable. The tell is visible inside a single Zod
// object in `app/partner/actions.ts`, where four consecutive fields read:
//
//     category: z.enum(COMPETITION_CATEGORIES),                    // derived
//     tier:     z.enum(["accessible", "selective", "elite"]),      // by hand
//     level:    z.enum(["international", "national", "regional"]), // by hand
//     cost:     z.enum([ ...nine strings... ]),                    // by hand
//
// The author knew the pattern — they used it one line above. What they did not
// have was an array they were allowed to point at.
//
// Two shipped defects came out of that, and both were silent:
//
//   • `school` was accepted by the admin write path and unknown to the read
//     path, so such a row sat in no level facet and no level filter could reach
//     it. Exactly the bug `simulation` caused one vocabulary over.
//   • `funded` — *they pay you*, the strongest cost signal we have — was
//     missing from the admin form's nine hardcoded options while the server
//     action validated against all ten. An admin adding a funded local olympiad
//     had no way to say so, and the row shipped as "cost unverified".
//
// ── The guarantee ────────────────────────────────────────────────────────────
//
// **Add a member to an array here and the build breaks until every `Record`
// below names it.** That is the whole point, and it is why the maps are
// `Record<Union, …>` rather than arrays of `{ id, label }`: the guarantee
// belongs to the compiler, not to a test that has to be remembered and not to a
// reviewer reading a diff.
//
// This module imports NOTHING. It carries no catalog, no registry and no
// component, so it is safe to reach from a client bundle, a server action, an
// edge function and a test alike — which is the property the old arrangement
// could not offer, and the reason five copies existed.
//
// `key-dates.ts` re-exports every name here, so existing imports still resolve.

// ── Level: how wide the field is ─────────────────────────────────────────────
//
// Ordered widest first, which is the order the student's filter renders. The
// partner form reverses it (an organiser thinks upward from their own city) and
// derives that from this array rather than restating it.
export const COMPETITION_LEVELS = [
  "international",
  "national",
  "regional",
  // The first rung, added 2026-08-24. It was already accepted by the admin
  // write path and unknown to everything that reads, so a school-level row was
  // invisible to the level filter and counted in no facet. It matters more than
  // its position suggests: Compass exists for students outside the first tier,
  // and a school-level competition is the kind most likely to actually exist in
  // Shymkent.
  "school",
] as const;
export type CompetitionLevel = (typeof COMPETITION_LEVELS)[number];

/** What a student calls each level, and what the filter facet is labelled. */
export const LEVEL_LABEL: Record<CompetitionLevel, string> = {
  international: "International",
  national: "National",
  regional: "Regional",
  school: "School",
};

/**
 * One line saying what the level means for the person entering.
 *
 * The money and timing groups in the filter each explain their own options and
 * the level group did not, which left a reader to infer four boundaries from
 * four adjectives. "School" is the one that needed it most: on its own it reads
 * as a kind of institution rather than as the narrowest rung.
 */
export const LEVEL_HINT: Record<CompetitionLevel, string> = {
  // Parallel on purpose: what the scope IS, then what it means for the person
  // entering. The second half is the part a student cannot work out alone, and
  // it is where the honesty rule bites — "the hardest to place in" is a fact
  // about an international final and leaving it out would make this a ladder of
  // prestige rather than a ladder of chances.
  international: "Open worldwide. The widest field, and the hardest to place in.",
  national: "Country-wide, and often the route to an international one.",
  regional: "Your city or region. Fewer entrants, and you can often turn up in person.",
  school: "Run inside schools. The first rung, and the easiest to enter.",
};

// ── Tier: how hard the prize is ──────────────────────────────────────────────
//
// Matched against the student's own strength, which is what makes the list open
// on things they can win rather than on the most impressive rows in the pool.
export const COMPETITION_TIERS = ["accessible", "selective", "elite"] as const;
export type CompetitionTier = (typeof COMPETITION_TIERS)[number];

/** On a card, where the reader is scanning and there is no room for a sentence. */
export const TIER_LABEL: Record<CompetitionTier, string> = {
  accessible: "Good first one",
  selective: "Step up",
  elite: "The big one",
};

// ── Kind: what sort of thing it is ───────────────────────────────────────────
//
// The pool is designed to GROW well beyond competitions, so the union is
// pre-widened and adding a kind is data-only: the filter's tabs derive from the
// kinds actually present in the catalog.
export const COMPETITION_CATEGORIES = [
  "competition",
  "olympiad",
  "course",
  "research_program",
  "summer_program",
  // A PLACE rather than an event: a forum, a club network, a citizen-science
  // platform, an open-source month. The distinguishing fact is that there is
  // nothing to win and usually nothing to miss — you join, and you keep going —
  // so almost every row here is `alwaysOpen`.
  //
  // It earns its own kind because "where do I find people doing this" is a
  // different question from "what can I enter", and filing it under
  // `competition` answered neither. It is also the honest answer for a student
  // who is twelve, or has no money, or lives somewhere none of the programmes
  // reach: joining costs nothing and starts today.
  "community",
  // A TRY, not an entry. A job simulation is unpaid, ungraded, has no deadline
  // and nothing to win: you do the actual tasks of a job for a few hours and
  // find out whether you can stand it. That is a different question from every
  // other kind here, and it is the best-evidenced answer we have to "what do I
  // want to study" — the self-efficacy literature names simulations directly,
  // and the platforms report completers as roughly twice as likely to be hired.
  //
  // We LINK OUT and never build these (release 3, PLANNER_PLAN.md §3).
  "simulation",
] as const;
export type CompetitionCategory = (typeof COMPETITION_CATEGORIES)[number];

/**
 * What a student calls each kind of thing, in full.
 *
 * The union's own values are database spellings — `research_program` — and any
 * surface that prints one raw shows a reader an enum. Everything with room for
 * the full name reads this.
 */
export const CATEGORY_LABEL: Record<CompetitionCategory, string> = {
  olympiad: "Olympiad",
  competition: "Competition",
  course: "Course",
  research_program: "Research program",
  summer_program: "Summer program",
  community: "Community",
  simulation: "Try the work",
};

/**
 * The same names, shortened for a chip on a dense card.
 *
 * The difference is deliberate and it is exactly one word — "Research" against
 * "Research program" — but it had been expressed by components keeping private
 * copies of the whole map rather than by naming the two forms. The card
 * documented its copy as intentional; the landing page's hero quietly held a
 * third, so the front page said "Research" and the page it opened said
 * "Research program". A difference worth keeping is worth naming.
 */
export const CATEGORY_LABEL_SHORT: Record<CompetitionCategory, string> = {
  ...CATEGORY_LABEL,
  research_program: "Research",
};

// ── Cost: what taking part actually costs ────────────────────────────────────
//
// The second question after "can I enter this", and getting it wrong is the
// fastest way to lose a student's trust: a card that says "free" and ends in a
// paywalled certificate reads as a lie even when the learning really was free.
// So the distinction the catalog carries is not free/paid but ten specific
// bargains, and `unknown` is a real answer rather than a missing one.
//
// Ordered best-to-worst for the student, which is the order both forms render
// and the order a reader scans for the answer they were hoping for.
export const COST_MODELS = [
  "funded",
  "free",
  "free_cert_paid",
  "free_then_paid",
  "freemium",
  "one_time",
  "subscription",
  "paid_aid",
  "varies",
  "unknown",
] as const;
export type CostModel = (typeof COST_MODELS)[number];

/**
 * What each bargain is called, and one line saying what it means.
 *
 * The labels come from the partner form, which was the only surface that had
 * ever written them for a human. The admin quick-add rendered the database
 * spellings through `replace(/_/g, " ")` — "free cert paid", "paid aid" — so
 * the same field was a considered question in one console and a raw enum in the
 * other. One vocabulary means the good copy reaches both.
 */
export const COST_LABEL: Record<CostModel, { label: string; hint: string }> = {
  funded: {
    label: "Free, and funded",
    hint: "Selected participants get a stipend, or their costs are covered.",
  },
  free: {
    label: "Free",
    hint: "Nothing to pay at any stage, certificate included.",
  },
  free_cert_paid: {
    label: "Free, paid certificate",
    hint: "The learning is free; the certificate at the end costs money.",
  },
  free_then_paid: {
    label: "Free to enter, paid later",
    hint: "A fee only if you get through a round.",
  },
  freemium: {
    label: "Free tier, paid plan",
    hint: "A real free tier, with an optional upgrade on top.",
  },
  one_time: { label: "One-off fee", hint: "A single entry fee." },
  subscription: {
    label: "Subscription",
    hint: "Paid monthly or yearly to use it at all.",
  },
  paid_aid: {
    label: "Paid, aid available",
    hint: "It costs money, but need-based aid or waivers exist.",
  },
  varies: {
    label: "Depends on the school",
    hint: "The fee is set locally, so there is no single figure to state.",
  },
  unknown: {
    label: "Not checked yet",
    hint: "We haven’t verified this one. The card says so and points at the official page.",
  },
};

// ── An opportunity's ID, and why the shape rather than the membership ────────
//
// `saveOpportunityIntent` writes the row that `/admin/intents` counts, and it
// is the ONLY behavioural signal this product collects. It used to accept any
// string of 1–120 characters. Its neighbour four files away, `recordReaction`,
// refuses a `beatId` the registry does not contain — the same job, done
// properly — which is this repository's most frequent bug shape: a rule
// enforced in one place and not in the one beside it.
//
// **Membership is the wrong check here, and it would have been a regression.**
// A valid id is not only a curated catalog row: an admin quick-add writes
// `slugId(name)` and a partner post writes `${partnerUuid}-${slug}`, both into
// `competition_deadlines`, and both are real things a student can commit to.
// Validating against `COMPETITION_BY_ID` would have silently refused every
// commitment to a partner's own posting — a worse failure than the hole,
// because it would look like the button simply not working.
//
// So this is a SHAPE check, the same call `isPickId` makes in `plan-picks.ts`.
// Measured against every writer before it was chosen: all 192 catalog rows
// pass, `slugId("Турнир городов")` → `opportunity-mtbt3qkb` passes, and a
// partner post at its 80-character ceiling passes. `../../etc/passwd`,
// `<script>…`, `a b c` and `""` do not.
//
// 96 rather than 80, because the ceiling belongs to today's two writers and a
// third would not think to ask. It is a bound on nonsense, not a schema.
export function isOpportunityId(id: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,95}$/.test(id);
}
