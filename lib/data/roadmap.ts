// The Roadmap engine — a runway-aware, date-anchored development plan.
//
// The old plan gave EVERY student the same "1 month / 3 months / 6 months"
// buckets, regardless of whether they had a full year before applications or
// only a few weeks. That's the thing this replaces. Here we:
//   1. compute how much runway the student actually has (from graduation year +
//      today, against the real US application deadlines),
//   2. classify them into a regime (building / focusing / sprinting /
//      submitting), and
//   3. emit PHASES anchored to real calendar dates, into which we schedule the
//      deterministic assets (SAT sittings, field-matched competitions) AND the
//      model's personalized action list — honestly demoting long-build moves
//      when there is no time left to act on them.
//
// Everything here is deterministic: same profile + same day → same roadmap.

import {
  buildStudyPlan,
  daysBetween,
  formatDate,
  SAT_REGISTER_URL,
  type Competition,
  type SatSitting,
} from "@/lib/data/key-dates";
import type { PlanAction, PlanActionKind } from "@/lib/ai/schema";

export type Regime =
  | "building"
  | "focusing"
  | "sprinting"
  | "submitting"
  | "unknown";

// Where a scheduled item came from — drives the icon/accent in the UI.
export type ActionSource = "sat" | "competition" | "profile" | "note";

export type RoadmapAction = {
  text: string;
  source: ActionSource;
  kind: PlanActionKind;
  why?: string;
  url?: string;
  // For dated items — the countdown anchor (registration/submission cutoff) and
  // a short tag chip ("Last sitting before your Early deadline", tier, …).
  anchorDate?: string;
  daysLeft?: number;
  tag?: string;
};

export type RoadmapPhase = {
  id: string;
  name: string;
  focus: string;
  rangeLabel: string;
  startISO: string;
  endISO: string | null;
  urgency: "now" | "soon" | "later";
  actions: RoadmapAction[];
};

export type Roadmap = {
  regime: Regime;
  hasGraduationYear: boolean;
  cycleLabel: string | null;
  operativeDeadlineISO: string | null;
  operativeDeadlineLabel: string | null; // "Early Action" | "Regular Decision"
  runwayDays: number | null;
  runwayMonths: number | null;
  headline: string;
  subhead: string;
  phases: RoadmapPhase[];
  // Long-build moves that can't realistically land before the deadline. Shown
  // honestly as "beyond this cycle" rather than pretended into a phase.
  deferred: RoadmapAction[];
};

export type RoadmapInputs = {
  today: Date;
  graduationYear?: number;
  faculties: string[];
  satScore?: number;
  // The model's flat, kind-tagged action list (analysis.timeline).
  planActions?: PlanAction[];
  liveSatSittings?: SatSitting[];
  liveCompetitions?: Competition[];
};

// ── Small date helpers (UTC, ISO date-only) ───────────────────────────────────
function toISO(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate()
  ).padStart(2, "0")}`;
}

function shiftISO(iso: string, days: number): string {
  const t =
    Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) +
    days * 86_400_000;
  const d = new Date(t);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate()
  ).padStart(2, "0")}`;
}

function monthYear(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** ISO a ≤ b (string compare is safe for YYYY-MM-DD). */
const isoLTE = (a: string, b: string) => a <= b;

// A phase template before clamping/scheduling. `kinds` are the model-action
// kinds that live in this phase; dated assets (SAT/competitions) are placed by
// their calendar date instead.
type PhaseTpl = {
  id: string;
  name: string;
  focus: string;
  startISO: string;
  endISO: string | null;
  kinds: PlanActionKind[];
};

// ── Regime → phase skeleton ───────────────────────────────────────────────────
// Each builder returns contiguous, date-anchored phases. `E`/`R` are the Early
// and Regular deadlines; `op` is whichever is the operative (soonest future) one.
function phasesFor(
  regime: Regime,
  todayISO: string,
  E: string,
  R: string,
  op: string
): PhaseTpl[] {
  const opIsEarly = op === E;
  const beforeE = (d: number) => shiftISO(E, -d);
  // The Regular-round tail only makes sense while Early is still the operative
  // deadline (so both rounds are ahead) and Regular is genuinely in the future.
  const regularTail: PhaseTpl[] =
    opIsEarly && daysBetween(todayISO, R) > 0
      ? [
          {
            id: "regular",
            name: "Regular round",
            focus: "Submit any remaining Regular Decision applications and finish aid forms.",
            startISO: E,
            endISO: R,
            kinds: ["decision", "logistics"],
          },
        ]
      : [];

  switch (regime) {
    case "building":
      return [
        {
          id: "foundation",
          name: "Foundation",
          focus:
            "You have a rare amount of runway — spend it building the base of a real 'spike', not just polishing what's there.",
          startISO: todayISO,
          endISO: shiftISO(todayISO, 120),
          kinds: ["profile", "activity", "test"],
        },
        {
          id: "build",
          name: "Build window",
          focus:
            "Go deep: a research project, an olympiad run, or a summer program is what turns a solid profile into a standout one.",
          startISO: shiftISO(todayISO, 120),
          endISO: beforeE(90),
          kinds: ["research", "activity", "test", "profile"],
        },
        {
          id: "run-up",
          name: "Pre-application run-up",
          focus:
            "Lock your scores, shortlist schools, and start essays while your profile work lands.",
          startISO: beforeE(90),
          endISO: E,
          kinds: ["essay", "logistics", "decision", "test"],
        },
        {
          id: "season",
          name: "Application season",
          focus: "Submit Early where it helps you, then finish Regular.",
          startISO: E,
          endISO: R,
          kinds: ["decision", "logistics", "essay"],
        },
      ];

    case "focusing":
      return [
        {
          id: "now",
          name: "Right now",
          focus:
            "Six-to-twelve months is enough for one or two decisive moves — pick them and start; don't scatter your effort.",
          startISO: todayISO,
          endISO: shiftISO(todayISO, 45),
          kinds: ["profile", "test", "activity"],
        },
        {
          id: "build-prep",
          name: "Build + prep",
          focus:
            "Lift your test score and deepen a single activity while you begin drafting essays.",
          startISO: shiftISO(todayISO, 45),
          endISO: beforeE(60),
          kinds: ["test", "activity", "research", "essay", "profile"],
        },
        {
          id: "run-up",
          name: "Pre-application",
          focus: "Finalize your list, your essays, and your recommenders.",
          startISO: beforeE(60),
          endISO: E,
          kinds: ["essay", "logistics", "decision"],
        },
        {
          id: "season",
          name: "Application season",
          focus: "Submit Early where it helps, then finish Regular.",
          startISO: E,
          endISO: R,
          kinds: ["decision", "logistics"],
        },
      ];

    case "sprinting":
      return [
        {
          id: "triage",
          name: "This month — triage",
          focus:
            "There isn't time to build a new spike before you apply — maximize what you already have. Lock your school list and start essays now.",
          startISO: todayISO,
          endISO: shiftISO(todayISO, 30),
          kinds: ["decision", "essay", "logistics", "test"],
        },
        {
          id: "before-deadline",
          name: "Before your deadline",
          focus:
            "Polish essays, secure recommenders, and decide Early vs Regular.",
          startISO: shiftISO(todayISO, 30),
          endISO: op,
          kinds: ["essay", "logistics", "decision", "test"],
        },
        ...regularTail,
      ];

    case "submitting":
      return [
        {
          id: "final",
          name: "Final stretch",
          focus:
            "This is execution, not profile-building. Finish essays, hit submit, and confirm every portal, fee waiver, and recommender.",
          startISO: todayISO,
          endISO: op,
          kinds: ["essay", "logistics", "decision", "test"],
        },
        ...regularTail,
      ];

    default:
      return [];
  }
}

// Clamp phase windows to start no earlier than today, and drop any that have
// collapsed to zero/negative length after clamping.
function normalizePhases(tpls: PhaseTpl[], todayISO: string): PhaseTpl[] {
  return tpls
    .map((p) => ({ ...p, startISO: p.startISO < todayISO ? todayISO : p.startISO }))
    .filter((p) => p.endISO === null || p.startISO < p.endISO);
}

function urgencyOf(todayISO: string, startISO: string): RoadmapPhase["urgency"] {
  const d = daysBetween(todayISO, startISO);
  return d <= 7 ? "now" : d <= 75 ? "soon" : "later";
}

function rangeLabel(startISO: string, endISO: string | null): string {
  const start = monthYear(startISO);
  if (!endISO) return `From ${start}`;
  const end = monthYear(endISO);
  return start === end ? start : `${start} – ${end}`;
}

/** First phase whose date window contains `iso`; falls back to the last phase. */
function phaseIndexForDate(phases: PhaseTpl[], iso: string): number {
  for (let i = 0; i < phases.length; i++) {
    const { startISO, endISO } = phases[i];
    if (isoLTE(startISO, iso) && (endISO === null || iso < endISO)) return i;
  }
  return phases.length - 1;
}

// ── The engine ────────────────────────────────────────────────────────────────
export function buildRoadmap(inputs: RoadmapInputs): Roadmap {
  const {
    today,
    graduationYear,
    faculties,
    satScore,
    planActions = [],
    liveSatSittings,
    liveCompetitions,
  } = inputs;

  const todayISO = toISO(today);

  // Reuse the deterministic dated calendar (deadlines, SAT sittings,
  // field-matched competitions) — the roadmap only re-arranges it by runway.
  const study = buildStudyPlan({
    today,
    graduationYear,
    faculties,
    satScore,
    liveSatSittings,
    liveCompetitions,
  });

  // ── No graduation year: we can't anchor a runway. Prompt for it, but still
  // surface the upcoming dated assets so the page is never empty. ──────────────
  if (!graduationYear) {
    const actions: RoadmapAction[] = [
      ...satActions(study.satSteps),
      ...competitionActions(study.competitions),
      ...planActions
        .slice()
        .sort((a, b) => a.priority - b.priority)
        .map(planToAction),
    ];
    const phases: RoadmapPhase[] = actions.length
      ? [
          {
            id: "upcoming",
            name: "Upcoming",
            focus:
              "Add your graduation year to anchor these to your real deadlines — here's what's on the calendar meanwhile.",
            rangeLabel: `From ${monthYear(todayISO)}`,
            startISO: todayISO,
            endISO: null,
            urgency: "now",
            actions,
          },
        ]
      : [];
    return {
      regime: "unknown",
      hasGraduationYear: false,
      cycleLabel: null,
      operativeDeadlineISO: null,
      operativeDeadlineLabel: null,
      runwayDays: null,
      runwayMonths: null,
      headline: "Add your graduation year to unlock your roadmap",
      subhead:
        "How much runway you have completely changes the plan — a student with a year to go and one with a month should not get the same advice.",
      phases,
      deferred: [],
    };
  }

  const E = `${graduationYear - 1}-11-01`; // Early Action/Decision ≈ Nov 1
  const R = `${graduationYear}-01-05`; // Regular Decision ≈ Jan 5

  // Operative deadline = the soonest one still ahead. If both have passed, the
  // primary window has closed; treat it as a submitting/wrap-up state anchored
  // just ahead of today so the plan still renders.
  let op: string;
  let opLabel: string;
  if (daysBetween(todayISO, E) >= 0) {
    op = E;
    opLabel = "Early Action / Decision";
  } else if (daysBetween(todayISO, R) >= 0) {
    op = R;
    opLabel = "Regular Decision";
  } else {
    op = shiftISO(todayISO, 30);
    opLabel = "Regular Decision";
  }

  const runwayDays = daysBetween(todayISO, op);
  const runwayMonths = runwayDays / 30.44;

  const regime: Regime =
    daysBetween(todayISO, E) < 0 && daysBetween(todayISO, R) < 0
      ? "submitting"
      : runwayMonths >= 12
        ? "building"
        : runwayMonths >= 6
          ? "focusing"
          : runwayMonths >= 2
            ? "sprinting"
            : "submitting";

  const tpls = normalizePhases(phasesFor(regime, todayISO, E, R, op), todayISO);
  // Guarantee at least one phase to schedule into.
  const skeleton: PhaseTpl[] = tpls.length
    ? tpls
    : [
        {
          id: "final",
          name: "Final stretch",
          focus: "Finish and submit your applications.",
          startISO: todayISO,
          endISO: op,
          kinds: ["essay", "logistics", "decision", "test"],
        },
      ];

  const buckets: RoadmapAction[][] = skeleton.map(() => []);
  const deferred: RoadmapAction[] = [];

  // Whether the regime still has time to act on long-build moves. When it
  // doesn't, those model actions are surfaced honestly as "beyond this cycle".
  const canBuild = regime === "building" || regime === "focusing";
  const BUILD_KINDS: PlanActionKind[] = ["profile", "research", "activity"];

  // 1) SAT sittings. For short runways, only sittings whose scores can still
  // land before the deadline are useful this cycle — the rest are dropped and
  // replaced with an honest note.
  const usableSat = canBuild
    ? study.satSteps
    : study.satSteps.filter((s) => daysBetween(s.test, op) >= 21);
  for (const a of satActions(usableSat)) {
    buckets[phaseIndexForDate(skeleton, a.anchorDate ?? todayISO)].push(a);
  }
  if (!canBuild && usableSat.length === 0 && satScore != null) {
    buckets[0].push({
      text: "No SAT sitting lands in time — the score schools will see is your current one, so don't wait on a retake.",
      source: "note",
      kind: "test",
    });
  }

  // 2) Field-matched, date-confirmed competitions, placed by their deadline.
  for (const a of competitionActions(study.competitions)) {
    buckets[phaseIndexForDate(skeleton, a.anchorDate ?? todayISO)].push(a);
  }

  // 3) The model's personalized actions, routed by kind into the first phase
  // that hosts that kind. Long-build moves in a no-time regime are deferred.
  for (const pa of planActions.slice().sort((a, b) => a.priority - b.priority)) {
    const action = planToAction(pa);
    if (!canBuild && BUILD_KINDS.includes(pa.kind)) {
      deferred.push(action);
      continue;
    }
    const idx = skeleton.findIndex((p) => p.kinds.includes(pa.kind));
    if (idx === -1) deferred.push(action);
    else buckets[idx].push(action);
  }

  const phases: RoadmapPhase[] = skeleton.map((p, i) => ({
    id: p.id,
    name: p.name,
    focus: p.focus,
    rangeLabel: rangeLabel(p.startISO, p.endISO),
    startISO: p.startISO,
    endISO: p.endISO,
    urgency: urgencyOf(todayISO, p.startISO),
    actions: buckets[i],
  }));

  const { headline, subhead } = framing(regime, runwayDays, runwayMonths, opLabel);

  return {
    regime,
    hasGraduationYear: true,
    cycleLabel: study.cycleLabel,
    operativeDeadlineISO: op,
    operativeDeadlineLabel: opLabel,
    runwayDays,
    runwayMonths,
    headline,
    subhead,
    phases,
    deferred,
  };
}

// ── Asset → action mappers ────────────────────────────────────────────────────
function satActions(steps: ReturnType<typeof buildStudyPlan>["satSteps"]): RoadmapAction[] {
  return steps.map((s) => ({
    text: `SAT test day — ${formatDate(s.test)}`,
    source: "sat" as const,
    kind: "test" as const,
    why: `Register by ${formatDate(s.regDeadline)}`,
    url: SAT_REGISTER_URL,
    anchorDate: s.regDeadline,
    daysLeft: s.daysToDeadline,
    tag: s.lastBeforeApps ? "Last sitting before your Early deadline" : undefined,
  }));
}

function competitionActions(
  comps: ReturnType<typeof buildStudyPlan>["competitions"]
): RoadmapAction[] {
  return comps.map((c) => ({
    text: c.name,
    source: "competition" as const,
    kind: "research" as const,
    why: c.blurb,
    url: c.url,
    anchorDate: c.deadline,
    daysLeft: c.daysToDeadline,
    tag: c.level,
  }));
}

function planToAction(pa: PlanAction): RoadmapAction {
  return { text: pa.text, source: "profile", kind: pa.kind };
}

// ── Honest, runway-specific framing ───────────────────────────────────────────
function runwayPhrase(days: number, months: number): string {
  if (days <= 0) return "no time left before your deadline";
  if (months < 2) return `about ${days} days before your deadline`;
  return `about ${Math.round(months)} months before your deadline`;
}

function framing(
  regime: Regime,
  runwayDays: number,
  runwayMonths: number,
  opLabel: string
): { headline: string; subhead: string } {
  const runway = runwayPhrase(runwayDays, runwayMonths);
  switch (regime) {
    case "building":
      return {
        headline: `You have ${runway} — time to build`,
        subhead: `That's enough runway to genuinely raise your profile, not just polish it. This plan front-loads the profile-building work now and leaves the ${opLabel} logistics for last.`,
      };
    case "focusing":
      return {
        headline: `You have ${runway} — time to focus`,
        subhead: `Enough for one or two decisive moves, not a full rebuild. This plan picks the highest-leverage work and phases in essays and logistics toward your ${opLabel} deadline.`,
      };
    case "sprinting":
      return {
        headline: `You have ${runway} — this is a sprint`,
        subhead: `Not enough time to build a new spike before you apply, so this plan maximizes what you already have: lock the list, write, and submit. Longer-term profile moves are noted separately for next cycle.`,
      };
    default:
      return {
        headline: `You have ${runway} — time to submit`,
        subhead: `This is pure execution. Everything below is about finishing essays, securing recommenders, and getting applications in cleanly.`,
      };
  }
}
