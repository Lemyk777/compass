import { cache } from "react";
import { guideSession } from "@/lib/guide/student-fields";
import { loadPickRefs } from "@/lib/planner/picks";
import { loadMaps } from "@/lib/planner/maps-load";
import { pickRef, type PickKind } from "@/lib/data/plan-picks";

// What a guide subject page needs to know about the plan, in one await.
//
// Deliberately the ONLY thing the guide asks the planner. A country page must
// not reach `lib/planner/load.ts` — that loader walks the catalog, the roadmap
// and the spine to build an agenda nobody on this page is going to read.
//
// Both reads underneath are `cache()`d, so a page asking for one subject and a
// list page asking for thirty cost the same single query. That matters: the
// from-home step renders a control per route on one page.

/** Just enough of a map to offer it as a destination. */
export type GuideMapTarget = { id: string; label: string };

export type PlanPickState = {
  /** A guest sees the control as a link to sign in, never as a disabled button. */
  signedIn: boolean;
  saved: boolean;
  /**
   * The reader's existing maps, so a subject they have just claimed can also go
   * onto one they are already thinking in.
   *
   * Empty for a guest and for anyone who has never started a map — and the
   * control renders NOTHING in that case rather than an empty menu or an
   * invitation to start one. This is the restraint the backlog flagged: there
   * is already one control in this rail, and a guide page must not become a
   * page about the planner.
   */
  maps: GuideMapTarget[];
};

const NO_MAPS: GuideMapTarget[] = [];

/** Every map the reader owns, shaped for the control. One cached read. */
const guideMaps = cache(async (userId: string): Promise<GuideMapTarget[]> => {
  const maps = await loadMaps(userId);
  return maps.map((m) => ({ id: m.id, label: m.label }));
});

/** Is this one subject already on the reader's plan, and where else could it go? */
export const guidePickState = cache(
  async (kind: PickKind, id: string): Promise<PlanPickState> => {
    const session = await guideSession();
    if (!session) return { signedIn: false, saved: false, maps: NO_MAPS };
    const [refs, maps] = await Promise.all([
      loadPickRefs(session.id),
      guideMaps(session.id),
    ]);
    return { signedIn: true, saved: refs.has(pickRef(kind, id)), maps };
  },
);

/**
 * The same answer for a whole list at once — one query for a page that renders
 * many controls, rather than one per control.
 */
export const guidePickSet = cache(
  async (): Promise<{
    signedIn: boolean;
    refs: Set<string>;
    maps: GuideMapTarget[];
  }> => {
    const session = await guideSession();
    if (!session) return { signedIn: false, refs: new Set(), maps: NO_MAPS };
    const [refs, maps] = await Promise.all([
      loadPickRefs(session.id),
      guideMaps(session.id),
    ]);
    return { signedIn: true, refs, maps };
  },
);
