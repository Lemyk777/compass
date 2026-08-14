import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { PlanPick } from "@/lib/data/plan-picks";

// Reading what the student claimed out of the guide.
//
// Split from `lib/planner/load.ts` on purpose: the GUIDE needs this too — every
// subject page has to know whether the thing being read is already on the plan
// — and the planner's loader reaches the catalog, the roadmap and the spine.
// Importing that from a guide page to answer one boolean would be the bundle
// trap in a different costume.
//
// `cache()`d for the same reason `guideView` is: a country page asks once for
// the button's state and the layout may ask again, and those were two round
// trips for one fact.

/**
 * The user's picks, newest first.
 *
 * **A missing table reads as "nothing picked", never as an error.** 0030 is
 * applied by hand like every migration here, and until it is, the guide's
 * subject pages must still render and the plan must still work — the same
 * degradation `planner_items` and `planner_map_nodes` get in `load.ts`. The
 * error is read rather than thrown, which is what makes that possible.
 */
export const loadPicks = cache(async (userId: string): Promise<PlanPick[]> => {
  const supabase = createClient();
  const { data } = await supabase
    .from("planner_path")
    .select("ref, label, href")
    .eq("user_id", userId)
    // Newest first: the thing they were just reading about is the thing they
    // are still thinking about, and burying it under a decision from March is
    // how a list stops being read at all.
    .order("added_at", { ascending: false });

  return (data ?? []) as PlanPick[];
});

/**
 * Just the refs, for the guide's "is this already on my plan" question.
 *
 * A Set rather than a list because the caller is asking about one subject and
 * `includes` over sixty rows on every card of a list page is the kind of thing
 * that only shows up once the data is real.
 */
export const loadPickRefs = cache(async (userId: string): Promise<Set<string>> => {
  const picks = await loadPicks(userId);
  return new Set(picks.map((p) => p.ref));
});
