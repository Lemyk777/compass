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
import { resolveSchoolDeadlines } from "@/lib/data/app-deadlines";
import { resolveUniversityDeadlines } from "@/lib/data/intl-deadlines";
import type { DestinationCode } from "@/lib/data/destinations";
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

// The student's target universities in one country (US = school names; others =
// the `university` strings from that country's program picks).
export type CountryTargets = { code: DestinationCode; universities: string[] };

// A dated, VERIFIED application deadline for one of the student's target schools.
export type DeadlineMarker = {
  code: DestinationCode;
  university: string | null; // null for aggregated US markers
  round: string;
  iso: string;
  daysLeft: number;
  source?: string;
  note?: string;
};

export type Roadmap = {
  regime: Regime;
  hasGraduationYear: boolean;
  cycleLabel: string | null;
  // The operative deadline = the EARLIEST future one across the chosen countries.
  operativeDeadlineISO: string | null;
  operativeDeadlineLabel: string | null; // e.g. "US Early Action / Decision"
  // Every future deadline across the chosen countries, earliest first — so the
  // header can show that the runway is anchored to the soonest of several.
  deadlines: DeadlineMarker[];
  runwayDays: number | null;
  runwayMonths: number | null;
  headline: string;
  subhead: string;
  phases: RoadmapPhase[];
  // Long-build moves that can't realistically land before the deadline. Shown
  // honestly as "beyond this cycle" rather than pretended into a phase.
  deferred: RoadmapAction[];
  // Target schools whose deadline we could NOT verify to the day (rolling, or
  // per-programme). Shown as "confirm these" with the official link and NO
  // countdown — never a guessed date.
  unconfirmedDeadlines: RoadmapAction[];
};

export type RoadmapInputs = {
  today: Date;
  graduationYear?: number;
  faculties: string[];
  satScore?: number;
  // Student's ISO-2 country — gates LOCAL (region-tagged) competitions.
  homeCountry?: string | null;
  // The student's target universities per country — the runway is anchored to
  // the EARLIEST VERIFIED deadline across them (US via app-deadlines, others via
  // the hand-verified intl-deadlines dataset).
  targets?: CountryTargets[];
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

// Built once, for the reason written up on `formatDate` in opportunity-format:
// passing an options object to `toLocaleDateString` constructs and discards an
// Intl.DateTimeFormat on every call. This one labels every phase of a roadmap,
// so it is called a dozen times per build rather than once.
const MONTH_YEAR = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function monthYear(iso: string): string {
  return MONTH_YEAR.format(new Date(iso + "T00:00:00Z"));
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
// Each builder returns contiguous, date-anchored phases anchored to `op` (the
// earliest deadline across the chosen countries) and `last` (the latest one). A
// shared "Application season" tail spans [op, last] whenever later deadlines
// remain, so a multi-country plan (e.g. US in November, Korea in May) sequences
// naturally.
function phasesFor(
  regime: Regime,
  todayISO: string,
  op: string,
  last: string
): PhaseTpl[] {
  const beforeOp = (d: number) => shiftISO(op, -d);
  // The season tail covers the stretch between the first and last deadline.
  const seasonTail: PhaseTpl[] =
    daysBetween(op, last) > 0
      ? [
          {
            id: "season",
            name: "Application season",
            focus:
              "Submit to your earliest deadline first, then work through the later-closing countries and finish aid forms.",
            startISO: op,
            endISO: last,
            kinds: ["decision", "logistics", "essay"],
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
          endISO: beforeOp(90),
          kinds: ["research", "activity", "test", "profile"],
        },
        {
          id: "run-up",
          name: "Pre-application run-up",
          focus:
            "Lock your scores, shortlist schools, and start essays while your profile work lands.",
          startISO: beforeOp(90),
          endISO: op,
          kinds: ["essay", "logistics", "decision", "test"],
        },
        ...seasonTail,
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
          endISO: beforeOp(60),
          kinds: ["test", "activity", "research", "essay", "profile"],
        },
        {
          id: "run-up",
          name: "Pre-application",
          focus: "Finalize your list, your essays, and your recommenders.",
          startISO: beforeOp(60),
          endISO: op,
          kinds: ["essay", "logistics", "decision"],
        },
        ...seasonTail,
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
          name: "Before your first deadline",
          focus:
            "Polish essays, secure recommenders, and decide which deadlines to hit first.",
          startISO: shiftISO(todayISO, 30),
          endISO: op,
          kinds: ["essay", "logistics", "decision", "test"],
        },
        ...seasonTail,
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
        ...seasonTail,
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

// Gather every target school's deadline. US schools resolve through the curated
// per-school dataset (app-deadlines.ts); other countries through the verified
// intl-deadlines dataset. Verified dates become dated markers (with a
// countdown); anything we can't stand behind becomes an honest "confirm this"
// note with the official link and NO date.
function gatherDeadlines(
  targets: CountryTargets[],
  today: Date,
  graduationYear: number
): { confirmed: DeadlineMarker[]; unconfirmed: RoadmapAction[] } {
  const confirmed: DeadlineMarker[] = [];
  const unconfirmed: RoadmapAction[] = [];
  const seen = new Set<string>();

  const addUnconfirmed = (uni: string, why: string, url?: string) => {
    if (seen.has(uni)) return;
    seen.add(uni);
    unconfirmed.push({
      text: `${uni} — confirm the deadline`,
      source: "note",
      kind: "decision",
      why,
      ...(url ? { url } : {}),
    });
  };

  for (const { code, universities } of targets) {
    if (code === "US") {
      // Aggregate the US list to the two runway-relevant dates — the earliest
      // early-round and the earliest Regular Decision. Per-school detail lives on
      // the odds page, so we don't repeat every school here.
      const all = universities.flatMap((u) =>
        resolveSchoolDeadlines(u, today, graduationYear)
      );
      const earlyStages = new Set(["ED", "ED2", "EA", "REA"]);
      const futureEarly = all
        .filter((d) => d.daysLeft >= 0 && earlyStages.has(d.stage))
        .sort((a, b) => a.daysLeft - b.daysLeft);
      const futureRD = all
        .filter((d) => d.daysLeft >= 0 && d.stage === "RD")
        .sort((a, b) => a.daysLeft - b.daysLeft);
      if (futureEarly[0])
        confirmed.push({
          code,
          university: null,
          round: "US early rounds (earliest on your list)",
          iso: futureEarly[0].date,
          daysLeft: futureEarly[0].daysLeft,
        });
      if (futureRD[0])
        confirmed.push({
          code,
          university: null,
          round: "US Regular Decision (earliest on your list)",
          iso: futureRD[0].date,
          daysLeft: futureRD[0].daysLeft,
        });
      continue;
    }

    // Non-US: the hand-verified per-university dataset.
    for (const uni of universities) {
      const r = resolveUniversityDeadlines(uni, today, graduationYear);
      if (!r) {
        addUnconfirmed(
          uni,
          "We don't have a verified date for this school yet — check its official admissions page."
        );
        continue;
      }
      if (r.confirmed && r.rounds.length > 0) {
        const upcoming = r.rounds.find((rd) => rd.daysLeft >= 0);
        if (upcoming) {
          confirmed.push({
            code,
            university: uni,
            round: `${uni} · ${upcoming.label}`,
            iso: upcoming.iso,
            daysLeft: upcoming.daysLeft,
            source: r.source,
            note: r.rolling ? r.window ?? undefined : undefined,
          });
        } else {
          addUnconfirmed(
            uni,
            "This cycle's rounds have closed — check the official page for the next intake.",
            r.source
          );
        }
      } else {
        addUnconfirmed(
          uni,
          r.window ?? "Check the official admissions page for dates.",
          r.source
        );
      }
    }
  }
  return { confirmed, unconfirmed };
}

// ── The engine ────────────────────────────────────────────────────────────────
export function buildRoadmap(inputs: RoadmapInputs): Roadmap {
  const {
    today,
    graduationYear,
    faculties,
    satScore,
    homeCountry,
    targets,
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
    homeCountry,
    liveSatSittings,
    liveCompetitions,
  });

  // ── No graduation year: we can't anchor a runway. Prompt for it, but still
  // surface the upcoming dated assets so the page is never empty. ──────────────
  if (!graduationYear) {
    const actions: RoadmapAction[] = [
      ...satActions(study.satSteps, null),
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
      deadlines: [],
      unconfirmedDeadlines: [],
      runwayDays: null,
      runwayMonths: null,
      headline: "Add your graduation year to unlock your roadmap",
      subhead:
        "How much runway you have completely changes the plan — a student with a year to go and one with a month should not get the same advice.",
      phases,
      deferred: [],
    };
  }

  // Verified deadlines across the student's actual target schools (US via the
  // curated per-school dataset, others via the hand-verified intl-deadlines).
  // The runway anchors to the EARLIEST VERIFIED one still ahead — so a Korea
  // student (SNU's March window) isn't wrongly told to "sprint" on a US date,
  // and we never anchor to a date we can't stand behind.
  const targetList: CountryTargets[] =
    targets && targets.length > 0 ? targets : [{ code: "US", universities: [] }];
  const { confirmed: confirmedMarkers, unconfirmed: unconfirmedDeadlines } =
    gatherDeadlines(targetList, today, graduationYear);

  const futureConfirmed = confirmedMarkers
    .filter((d) => d.daysLeft >= 0)
    .sort((a, b) => (a.iso < b.iso ? -1 : a.iso > b.iso ? 1 : 0));

  // op = earliest verified deadline still ahead; last = latest, for the season
  // tail. When there is no verified upcoming deadline (only rolling/per-
  // programme targets, or none picked yet), anchor the REGIME softly to the
  // typical main-application season (Jan of the enrolment year) WITHOUT showing
  // that date as a hard deadline.
  const hasConfirmedAnchor = futureConfirmed.length > 0;
  const op = hasConfirmedAnchor ? futureConfirmed[0].iso : `${graduationYear}-01-01`;
  const opLabel = hasConfirmedAnchor ? futureConfirmed[0].round : null;
  const last = hasConfirmedAnchor
    ? futureConfirmed[futureConfirmed.length - 1].iso
    : op;

  const runwayDays = daysBetween(todayISO, op);
  const runwayMonths = runwayDays / 30.44;

  const regime: Regime =
    runwayMonths >= 12
      ? "building"
      : runwayMonths >= 6
        ? "focusing"
        : runwayMonths >= 2
          ? "sprinting"
          : "submitting";

  const tpls = normalizePhases(phasesFor(regime, todayISO, op, last), todayISO);
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
  // land before the FIRST deadline are useful this cycle — the rest are dropped
  // and replaced with an honest note. The last sitting whose scores arrive in
  // time gets flagged (recomputed against `op`, not the US-early date).
  const inTimeSat = study.satSteps.filter((s) => daysBetween(s.test, op) >= 21);
  const lastBeforeTest =
    inTimeSat.length > 0 ? inTimeSat[inTimeSat.length - 1].test : null;
  const usableSat = canBuild ? study.satSteps : inTimeSat;
  for (const a of satActions(usableSat, lastBeforeTest)) {
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

  // 3) The verified application deadlines themselves — one dated row per school,
  // placed in the phase its date falls into, so the student sees each cutoff with
  // a live countdown (unverified ones are surfaced separately, never with a
  // fake date).
  for (const d of futureConfirmed) {
    buckets[phaseIndexForDate(skeleton, d.iso)].push({
      text: `${d.round} deadline`,
      source: "note",
      kind: "decision",
      anchorDate: d.iso,
      daysLeft: d.daysLeft,
      ...(d.source ? { url: d.source } : {}),
      ...(d.note ? { why: d.note } : {}),
    });
  }

  // 4) The model's personalized actions, routed by kind into the first phase
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

  const { headline, subhead } = framing(
    regime,
    runwayDays,
    runwayMonths,
    opLabel,
    futureConfirmed.length
  );

  return {
    regime,
    hasGraduationYear: true,
    cycleLabel: study.cycleLabel,
    operativeDeadlineISO: hasConfirmedAnchor ? op : null,
    operativeDeadlineLabel: opLabel,
    deadlines: futureConfirmed,
    unconfirmedDeadlines,
    runwayDays,
    runwayMonths,
    headline,
    subhead,
    phases,
    deferred,
  };
}

// ── Asset → action mappers ────────────────────────────────────────────────────
function satActions(
  steps: ReturnType<typeof buildStudyPlan>["satSteps"],
  lastBeforeTest: string | null
): RoadmapAction[] {
  return steps.map((s) => ({
    text: `SAT test day — ${formatDate(s.test)}`,
    source: "sat" as const,
    kind: "test" as const,
    why: `Register by ${formatDate(s.regDeadline)}`,
    url: SAT_REGISTER_URL,
    anchorDate: s.regDeadline,
    daysLeft: s.daysToDeadline,
    tag:
      lastBeforeTest && s.test === lastBeforeTest
        ? "Last sitting before your first deadline"
        : undefined,
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
  if (days <= 0) return "no time left before your first deadline";
  if (months < 2) return `about ${days} days before your first deadline`;
  return `about ${Math.round(months)} months before your first deadline`;
}

// Name what the runway is anchored to. With a verified deadline we cite it (and
// note it's the soonest of several); with none, we speak to the general
// application season rather than a specific date we can't stand behind.
function anchorClause(opLabel: string | null, deadlineCount: number): string {
  if (!opLabel) return "your main application season";
  const soonest = `your soonest verified deadline (${opLabel})`;
  return deadlineCount > 1
    ? `${soonest} — the earliest across your target schools`
    : soonest;
}

function framing(
  regime: Regime,
  runwayDays: number,
  runwayMonths: number,
  opLabel: string | null,
  deadlineCount: number
): { headline: string; subhead: string } {
  const runway = runwayPhrase(runwayDays, runwayMonths);
  const anchor = anchorClause(opLabel, deadlineCount);
  switch (regime) {
    case "building":
      return {
        headline: `You have ${runway} — time to build`,
        subhead: `That's enough runway to genuinely raise your profile, not just polish it. This plan front-loads the profile-building work now and leaves the logistics for ${anchor} until last.`,
      };
    case "focusing":
      return {
        headline: `You have ${runway} — time to focus`,
        subhead: `Enough for one or two decisive moves, not a full rebuild. This plan picks the highest-leverage work and phases in essays and logistics toward ${anchor}.`,
      };
    case "sprinting":
      return {
        headline: `You have ${runway} — this is a sprint`,
        subhead: `Not enough time to build a new spike before ${anchor}, so this plan maximizes what you already have: lock the list, write, and submit. Longer-term profile moves are noted separately for next cycle.`,
      };
    default:
      return {
        headline: `You have ${runway} — time to submit`,
        subhead: `This is pure execution. Everything below is about finishing essays, securing recommenders, and getting applications in cleanly before ${anchor}.`,
      };
  }
}
