"use client";

// The visitor's "today", and the matching engine, WITHOUT the round trip that
// used to sit between them.
//
// ── The defect this exists to remove ─────────────────────────────────────────
//
// Four client components — the front door, the public eligibility checker,
// onboarding's first win and the roadmap — each carried their own copy of this
// pair, comment and all:
//
//     const [today, setToday] = useState<Date | null>(null);
//     useEffect(() => setToday(new Date()), []);
//     …
//     useEffect(() => {
//       if (!today) { setPlan(null); return; }
//       import("@/lib/data/key-dates").then((m) => setPlan(m.build…(…)));
//     }, [today, …]);
//
// Read the order of events that produces. Paint one renders with no date and no
// plan. The first effect commits and schedules a re-render. Paint two renders
// with a date and still no plan. Only THEN does the second effect run and begin
// fetching the largest asynchronous chunk on the route — a chunk whose contents
// do not depend on `today`, or on anything else in that dependency array, in
// any way at all. A full render cycle was spent waiting to start a download that
// could have started immediately.
//
// The public checker was worse again: its import was also gated on the visitor
// having answered "what year are you in?", so the fetch began at the exact
// moment of highest intent instead of before it, and the answer arrived after a
// network round trip the page had had every opportunity to make in advance.
//
// The planner section solved this properly and the rest of the product never
// caught up — `todayISO` is resolved once in the loader there, and CLAUDE.md
// records the rule. This is the same discipline, for the surfaces that cannot
// take a server-resolved date because their countdowns are the visitor's own.
//
// ── What replaces it ─────────────────────────────────────────────────────────
//
// The load is separated from the date and started in a MOUNT-ONLY effect, so it
// begins in the first commit rather than in the second.
//
// **The first version of this scheduled it on `requestIdleCallback` instead, and
// measuring killed that idea.** The reasoning had been borrowed from `MapView`,
// which warms the next country's terrain on idle — but that asset is
// speculative, for a country nobody has clicked, whereas this chunk IS the
// page. Measured on the built site: the catalog chunk is 120 kB raw, **31.6 kB
// gzipped**, the largest lazy chunk on the route, and the idle callback did not
// fire early — it fired at its own 2000 ms ceiling, 2.2 seconds after the
// initial bundle. That is slower than the waterfall it was meant to fix.
//
// A prefetch belongs on idle. The current page's own content does not. Both of
// these surfaces render the plan as their reason for existing, so it loads at
// once.

import { useEffect, useState } from "react";
import type { Competition, ExtracurricularsPlan } from "./key-dates";

/**
 * Call the loader at most once and hand every later caller the same promise.
 *
 * A dynamic `import()` is already idempotent — the module registry caches it —
 * so this is not what makes it cheap. What it buys is a NAME: somewhere to warm
 * the chunk from that is not the component which happens to need it first.
 */
function once<T>(load: () => Promise<T>): () => Promise<T> {
  let started: Promise<T> | null = null;
  return () => (started ??= load());
}

/**
 * The ~2,700-entry catalog and its matching engine.
 *
 * Deliberately dynamic. `key-dates` builds a lookup map over the whole catalog
 * at module load, so it cannot be tree-shaken and a static import would put the
 * dataset in the initial JS of every route that touches it.
 */
export const catalogModule = once(() => import("./key-dates"));

/** The roadmap builder, which reaches `key-dates` and is heavy for that reason. */
export const roadmapModule = once(() => import("./roadmap"));

/**
 * The visitor's own date, resolved after hydration.
 *
 * Null on the server and on the first client paint, and that is not a placeholder
 * to be optimised away: the countdown on every card is relative to the reader's
 * clock, and a server-rendered one hydrates into a different number for anyone
 * whose day has turned. Anything that only needs a date to SORT by — the
 * planner — takes `todayISO` from its loader instead and never calls this.
 *
 * Five components declared this same three-line pair, each with its own comment
 * explaining the hydration reason. It is one line now, in one place, and the
 * reason is written down once.
 */
export function useToday(): Date | null {
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => setToday(new Date()), []);
  return today;
}

/**
 * Start fetching a heavy module on mount, before anything asks for it.
 *
 * The load has to be its OWN effect and not a branch inside the effect that
 * needs the result, because the two run one render apart: a mount effect fires
 * in the first commit, while an effect depending on `today` cannot run until
 * `today` exists, which takes a state update and a re-render. That gap is the
 * defect this module was written for — a render cycle spent before a download
 * that had no dependency on anything in it.
 *
 * No cleanup, deliberately. An import in flight cannot be aborted and should not
 * be: the chunk lands in the module registry either way, and the next mount then
 * pays nothing.
 */
export function useWarmModule(load: () => Promise<unknown>): void {
  useEffect(() => {
    void load();
  }, [load]);
}

/**
 * A stable empty factor list.
 *
 * Every surface without an analysis passes "no factors", and passing `[]` inline
 * would be a fresh array on every render — a dependency that always differs, an
 * effect that always re-runs, and a plan rebuilt over 172 rows for no reason.
 * Exported so the three call sites share ONE array rather than three.
 */
export const NO_FACTORS: { key: string; score: number }[] = [];

export type OpportunityPlanInput = {
  /** Null until hydration resolves it; the plan stays null with it. */
  today: Date | null;
  faculties: string[];
  factors: { key: string; score: number }[];
  graduationYear?: number;
  homeCountry?: string | null;
  liveCompetitions?: Competition[];
  /**
   * A second condition the plan waits on, for surfaces that need an answer
   * first. It gates the PLAN and never the load — which is the correction this
   * module exists to make.
   */
  ready?: boolean;
};

/**
 * The matched, annotated opportunity list for one student.
 *
 * Null while the chunk is in flight; every caller already renders a skeleton or
 * nothing for that. `faculties`, `factors` and `liveCompetitions` must be stable
 * references — memoised, or a module constant — or the effect re-runs on every
 * render. That requirement is not new; it is the same one the four hand-written
 * copies carried, and stating it here is the first time it has been written down.
 */
export function useOpportunityPlan({
  today,
  faculties,
  factors,
  graduationYear,
  homeCountry,
  liveCompetitions,
  ready = true,
}: OpportunityPlanInput): ExtracurricularsPlan | null {
  const [plan, setPlan] = useState<ExtracurricularsPlan | null>(null);

  // On mount, and on nothing else. See `useWarmModule`: this is the effect that
  // used to be missing, and its absence is what made the catalog wait for a
  // render it had no reason to wait for.
  useWarmModule(catalogModule);

  useEffect(() => {
    if (!today || !ready) {
      setPlan(null);
      return;
    }
    let cancelled = false;
    catalogModule().then((m) => {
      if (cancelled) return;
      setPlan(
        m.buildExtracurriculars({
          today,
          faculties,
          factors,
          graduationYear,
          homeCountry,
          liveCompetitions,
        }),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [
    today,
    ready,
    faculties,
    factors,
    graduationYear,
    homeCountry,
    liveCompetitions,
  ]);

  return plan;
}
