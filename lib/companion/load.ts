import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { guideSession, studentFields } from "@/lib/guide/student-fields";
import { loadReactions } from "@/lib/planner/reactions";
import {
  nextPair,
  observationFromBeats,
  pairsAnswered,
  type Beat,
} from "@/lib/data/beats";
import { station, type StationFacts, type StationId } from "@/lib/data/thread";
import { nextMove, type NextMove } from "@/lib/data/next-move";
import { countPicks, type PlanPick } from "@/lib/data/plan-picks";

// EVERYTHING THE COMPANION NEEDS, RESOLVED ON THE SERVER.
//
// The companion renders on every page of the student's product, which is what
// makes this file necessary rather than convenient: the heavy registries stay
// HERE, and the client receives serialisable values and pre-rendered nodes. Any
// runtime import of `key-dates`, `careers`, `world`, `study-destinations` or
// `spine` from a client component would ship thousands of lines to every route
// the companion appears on — which, by design, is all of them. Same discipline
// `lib/planner/load.ts` follows, same trap `key-dates.ts` sets.
//
// ONE cached read per request. A guide page and the planner both ask; they get
// one answer and one set of queries between them.

export type CompanionView = {
  station: { id: StationId; index: number; total: number };
  /**
   * What we noticed about them, or null when there is nothing new to say.
   *
   * Null renders NOTHING — never a placeholder, never "no news". A companion
   * that fills silence with filler is a companion nobody reads after the first
   * week.
   */
  said: string | null;
  /**
   * The next move, or NULL once we stop being able to judge it honestly.
   *
   * From the moment a student has committed to something, the move depends on
   * facts this loader does not carry — what is overdue, what is dated, which
   * deadline is nearest. Handing the ladder zeroes there does not produce vague
   * copy, it produces a FALSE one: every such student fell into "nothing you're
   * carrying has an announced date yet", which is a claim, not an omission.
   *
   * So we stop, and point at the plan, which loads those facts properly. That
   * also removes the contradiction of two ladders reasoning from different
   * inputs on the same screen.
   */
  move: NextMove | null;
  /** The next two things to react to, or null once the sequence is finished. */
  pair: { left: Beat; right: Beat } | null;
};

export const loadCompanion = cache(
  async (): Promise<CompanionView | null> => {
    // A guest gets no companion. Nothing here is about a person we have not
    // met, and inventing a stage for one would be the form-with-different-paint
    // this whole thing exists to remove.
    const session = await guideSession();
    if (!session) return null;

    const supabase = createClient();

    // Every read the ladder needs, in parallel, and not one of them touches a
    // prose registry.
    const [fields, answers, picksResult, intentsResult] = await Promise.all([
      studentFields(),
      loadReactions(session.id),
      supabase
        .from("planner_path")
        .select("ref, label, href")
        .eq("user_id", session.id),
      supabase
        .from("opportunity_intents")
        .select("status")
        .eq("user_id", session.id),
    ]);

    // Both degrade to "nothing yet" on a missing table, the same way every
    // newer table in this codebase does: an unapplied migration must read as an
    // empty plan, not as an error on every page in the product.
    const picks: PlanPick[] = (picksResult.data ?? []) as PlanPick[];
    const intents = (intentsResult.data ?? []) as { status: string }[];

    const committed = intents.length;
    const started = intents.filter(
      (i) => i.status === "doing" || i.status === "applied",
    ).length;

    const facts: StationFacts = {
      pairsAnswered: pairsAnswered(answers),
      picks: countPicks(picks),
      // A try is a commitment to something try-shaped, counted the same way as
      // any other intent — that is where the fact already lives, and a second
      // table for "did they try" would be the snapshot this product refuses
      // everywhere else.
      tried: started,
      committed,
      started,
      // The companion does not carry the agenda, so it cannot know what lapsed.
      // The planner passes the real figure to the same ladder; here the move is
      // the non-urgent one, which is the honest answer when we have not looked.
      overdue: 0,
    };

    // Only while the sequence is still the point. A student with a running plan
    // being asked "which of these two Tuesdays is more like you?" is being
    // taken backwards — the questions belong to the stage that needs them.
    const at = station(facts);
    const pair = at.id === "sense" || at.id === "look" ? nextPair(answers) : null;

    return {
      station: at,
      said: observationFromBeats(answers),
      // Zeroes are safe ONLY up to here. Every branch reachable while nothing
      // is committed is written so a zero produces its number-free phrasing
      // rather than "0 countries" — rule 3, it never invents a figure. Past
      // that point the branches need agenda facts this loader does not carry,
      // and handing them zeroes produced an assertion rather than a vaguer
      // sentence. So it stops. See the note on `move` above.
      move:
        committed > 0
          ? null
          : nextMove({
              fieldsStated: fields.length,
              picks: facts.picks,
              committed: facts.committed,
              started: facts.started,
              tried: facts.tried,
              overdue: facts.overdue,
              openToYou: 0,
              reachableAreas: 0,
              reachableMajors: 0,
              reachableCountries: 0,
              citiesInPicked: 0,
              nextDeadline: null,
              dated: 0,
            }),
      pair: pair ? { left: pair[0], right: pair[1] } : null,
    };
  },
);
