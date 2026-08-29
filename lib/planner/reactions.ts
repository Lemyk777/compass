import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isBeatReaction, type BeatAnswers } from "@/lib/data/beats";

// Server-only. ONE cached read per request, so the companion asking on a guide
// page and the planner asking on its own page cost a single query between them
// — the same discipline `guidePickState` and `guideView` already follow, and for
// the same reason: the companion renders on every page in the product.

/**
 * Everything this student has reacted to, as the map the scorer takes.
 *
 * A missing table means 0031 has not been applied by hand yet, and that
 * degrades to "no reactions" rather than to an error — because "no reactions"
 * is already a state the whole product handles: it is what every new student
 * looks like. There is nothing to special-case.
 *
 * Rows whose `reaction` is not one the registry knows are dropped rather than
 * coerced. Same rule as `parsePickRef`: a value we cannot name has no meaning
 * to guess at.
 */
export const loadReactions = cache(
  async (userId: string): Promise<BeatAnswers> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("beat_reactions")
      .select("beat_id, reaction")
      .eq("user_id", userId);

    if (error || !data) return {};

    const answers: BeatAnswers = {};
    for (const row of data) {
      if (typeof row.beat_id === "string" && isBeatReaction(row.reaction)) {
        answers[row.beat_id] = row.reaction;
      }
    }
    return answers;
  },
);
