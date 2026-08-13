import { cache } from "react";
import { FACULTY_VALUES, type FacultyValue } from "@/lib/data/faculties";
import { loadStudentContext } from "@/lib/dashboard/load";
import { createClient } from "@/lib/supabase/server";
import type { SessionProfile } from "@/lib/auth/session";
import { plannerStarts, type PlannerStart } from "@/lib/data/planner-start";
import {
  buildPlanner,
  type PlannerCompetition,
  type PlannerOwnItem,
  type PlannerStatus,
  type PlannerView,
} from "@/lib/data/planner";

// Everything the planner's two pages need, fetched once.
//
// This is the ONLY place the planner reaches `key-dates` and `roadmap`, and it
// is server-only. Both build over the whole catalog at module load, so a
// runtime import from anything that reaches the browser would ship ~2,700
// entries to a student who asked for their own task list. The dynamic imports
// below keep them off even this module's static graph — the same move the three
// matching views make.
//
// `todayISO` is resolved HERE, once, and travels down as a string. Nothing in
// the planner's client components reads a clock: that is what makes the two
// views agree with each other, agree across hydration, and stay testable.

export type PlannerData = PlannerView & {
  todayISO: string;
  /** For the empty state: the two nearest things this student actually matches. */
  suggestions: { id: string; name: string; deadline: string }[];
  /**
   * Where a plan can start, for a student who cannot yet say what they want.
   *
   * This is the guide→planner bridge and the whole point of it: the counts come
   * from the SPINE, so what the plan offers as a first move is the same chain
   * the guide walks. Before this the planner knew nothing about the guide at
   * all, which is most of why the two read as separate products.
   *
   * Empty when the student already has a plan — the choice is the empty state,
   * and computing it for someone who does not need it would buy nothing and
   * cost a walk over five registries on every load.
   */
  starts: PlannerStart[];
};

const load = cache(
  async (userId: string, country: string | null, todayISO: string) =>
    loadUncached(userId, country, todayISO),
);

export function loadPlanner(session: SessionProfile): Promise<PlannerData> {
  return load(
    session.id,
    session.country,
    new Date().toISOString().slice(0, 10),
  );
}

async function loadUncached(
  userId: string,
  country: string | null,
  todayISO: string,
): Promise<PlannerData> {
  const supabase = createClient();
  const today = new Date(`${todayISO}T00:00:00Z`);

  const [ctx, ownResult, mapResult, keyDates, roadmapModule] =
    await Promise.all([
      loadStudentContext({ id: userId, country } as SessionProfile),
      // `select("*")`, and the error is read rather than thrown: a table that does
      // not exist yet (0028 unapplied) comes back as `{ data: null, error }`, so
      // it reads as "no tasks of your own" and the derived half of the planner
      // still renders. Same degradation every newer table gets in this codebase.
      supabase.from("planner_items").select("*").eq("user_id", userId),
      // Same degradation as above: 0029 unapplied reads as "no maps", not a throw.
      supabase.from("planner_map_nodes").select("map_id").eq("user_id", userId),
      import("@/lib/data/key-dates"),
      import("@/lib/data/roadmap"),
    ]);

  const ownRows = (ownResult.data ?? []) as Record<string, unknown>[];
  const mapCount = new Set(
    ((mapResult.data ?? []) as { map_id: string }[]).map((r) => r.map_id),
  ).size;

  // The catalog, with any confirmed live dates overlaid — then narrowed to the
  // handful the student actually committed to, which is all the pure builder
  // ever sees.
  const catalog = keyDates.resolveCompetitions(ctx.liveDates.competitions);
  const wanted = new Set(ctx.intents.map((i) => i.opportunityId));
  const committed: PlannerCompetition[] = catalog
    .filter((c) => wanted.has(c.id))
    .map((c) => ({
      id: c.id,
      name: c.name,
      deadline: c.deadline,
      dateConfirmed: c.dateConfirmed,
    }));

  const ownItems: PlannerOwnItem[] = (ownRows ?? []).map((r) => ({
    id: r.id as string,
    title: r.title as string,
    note: (r.note as string | null) ?? null,
    dueISO: (r.due_date as string | null) ?? null,
    status: ((r.status as string) ?? "todo") as PlannerStatus,
    href: (r.link_href as string | null) ?? null,
  }));

  // The roadmap contributes two things and only two: verified application
  // deadlines, and the phase labels the agenda uses as separators. Its ACTIONS
  // stay in the report — the planner holds things with a date and a state, and
  // an action has neither.
  const roadmap = roadmapModule.buildRoadmap({
    today,
    graduationYear: ctx.profileMeta.graduationYear,
    faculties: ctx.profileMeta.faculties,
    satScore: ctx.profileMeta.satScore,
    homeCountry: ctx.profileMeta.homeCountry,
    liveSatSittings: ctx.liveDates.satSittings,
    liveCompetitions: ctx.liveDates.competitions,
  });

  const satSittings =
    ctx.liveDates.satSittings.length > 0
      ? ctx.liveDates.satSittings
      : keyDates.SAT_SITTINGS;

  const view = buildPlanner({
    todayISO,
    intents: ctx.intents,
    committed,
    ownItems,
    satSittings: satSittings.map((s) => ({
      test: s.test,
      regDeadline: s.regDeadline,
    })),
    deadlines: roadmap.deadlines.map((d) => ({
      university: d.university,
      round: d.round,
      iso: d.iso,
    })),
    phases: roadmap.phases.map((p) => ({
      id: p.id,
      name: p.name,
      rangeLabel: p.rangeLabel,
      startISO: p.startISO,
    })),
  });

  // The empty state is not a dead end: with nothing committed, name two things
  // this student can actually enter rather than showing a blank column with a
  // link in it. Resolved on the server, so the catalog never crosses over.
  let suggestions: PlannerData["suggestions"] = [];
  let starts: PlannerStart[] = [];
  if (view.items.length === 0) {
    const plan = keyDates.buildExtracurriculars({
      today,
      faculties: ctx.profileMeta.faculties,
      factors: ctx.analysis?.factors ?? [],
      liveCompetitions: ctx.liveDates.competitions,
      homeCountry: ctx.profileMeta.homeCountry,
      graduationYear: ctx.profileMeta.graduationYear,
    });
    const enterable = plan.items.filter((o) => !o.notYetEligible);
    suggestions = enterable
      .filter((o) => o.dateConfirmed)
      .slice(0, 2)
      .map((o) => ({ id: o.id, name: o.name, deadline: o.deadline }));

    // THE BRIDGE. The spine is dynamically imported for the same reason
    // key-dates is: it reaches five prose registries and must not join this
    // module's static graph.
    const [{ spineForFaculty, areasForFields }, faculties] = [
      await import("@/lib/data/spine"),
      ctx.profileMeta.faculties,
    ];
    // Narrowed by FILTERING, not by casting: `profileMeta.faculties` is
    // `string[]`, and a profile saved before a field was renamed would
    // otherwise reach the spine as a key it has no entry for.
    const stated = faculties.filter((f): f is FacultyValue =>
      (FACULTY_VALUES as string[]).includes(f),
    );
    // Unknown facts never exclude — with nothing stated we count the whole
    // chain rather than offering a shorter list of choices.
    const fields = stated.length > 0 ? stated : FACULTY_VALUES;
    const countries = new Set<string>();
    for (const f of fields) {
      for (const stop of spineForFaculty(f).stops) countries.add(stop.country);
    }

    starts = plannerStarts({
      // The NARROWED list, not the raw column: everything downstream reasons
      // about "did they state a field", and a value we no longer recognise is
      // not a stated field.
      faculties: stated,
      areaCount: areasForFields(fields).length,
      placeCount: countries.size,
      openCount: enterable.length,
      mapCount,
    });
  }

  return { ...view, todayISO, suggestions, starts };
}
