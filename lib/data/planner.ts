// The planner — one list, two views, two origins.
//
// Backlog #17. The section answers the question Opportunities and the Guide do
// not: "what do I do next, and am I on time". Everything here is deterministic
// and pure — same inputs, same view — which is what lets the product's rules be
// asserted at the unit level rather than hoped for in a component.
//
// TWO THINGS THIS MODULE MUST NOT DO, both of which are bugs the rest of this
// codebase has already paid for:
//
//  1. It must not import lib/data/key-dates.ts at runtime. That module builds a
//     lookup map over the ~2,700-entry catalog at load, so ANY runtime import
//     drags the whole dataset into that route's client bundle. The page resolves
//     the handful of competitions a student actually committed to and passes
//     them in as `PlannerCompetition` — a structural subset of `Competition`,
//     so a real one fits without a cast. Same rule as guide-filter.ts.
//  2. It must not read a clock. `todayISO` arrives as a parameter, resolved once
//     on the server, so nothing here depends on when it runs — which is what
//     keeps the render stable across hydration and the tests pure.

import type { IntentStatus, OpportunityIntent } from "@/lib/data/intents";

// ── Vocabulary ────────────────────────────────────────────────────────────────

/**
 * The array is the source and the union is DERIVED from it, never the other way
 * round. Written the other way — a union here, a `PlannerStatus[]` literal in
 * `app/planner/actions.ts` — an array is free to be short: the compiler checks
 * that every member is a valid status, and never that every status is a member.
 * That is precisely the hole a whole kind of opportunity fell through in
 * release 3 (audit A4), and the server action validating this one is a public
 * HTTP endpoint.
 */
export const PLANNER_STATUSES = ["todo", "doing", "done", "dropped"] as const;

export type PlannerStatus = (typeof PLANNER_STATUSES)[number];

/**
 * The board's visible columns. `dropped` is deliberately absent: the row is
 * kept (migration 0022 — what students abandon is as informative as what they
 * enter) but it lives in an archive line, not in a permanent column headed
 * "gave up" on a school student's own planning screen.
 */
export const PLANNER_COLUMNS = ["todo", "doing", "done"] as const;

export type PlannerColumn = (typeof PLANNER_COLUMNS)[number];

/**
 * Where a row came from, and therefore where its state is written back.
 *
 * `sat` and `deadline` have no state at all — they are facts about the world,
 * so they appear in the agenda and never on the board. A card nobody can move
 * is what breaks a board.
 */
export type PlannerOrigin = "opportunity" | "own" | "sat" | "deadline";

const FROM_INTENT: Record<IntentStatus, PlannerStatus> = {
  planning: "todo",
  doing: "doing",
  applied: "done",
  dropped: "dropped",
};

const TO_INTENT: Record<PlannerStatus, IntentStatus> = {
  todo: "planning",
  doing: "doing",
  done: "applied",
  dropped: "dropped",
};

export function plannerStatusFromIntent(s: IntentStatus): PlannerStatus {
  return FROM_INTENT[s];
}

export function intentStatusFromPlanner(s: PlannerStatus): IntentStatus {
  return TO_INTENT[s];
}

/** The track a card moves along. `dropped` is off it — you leave via a drop. */
const MOVE_TRACK: PlannerColumn[] = ["todo", "doing", "done"];

/** The status one step left (-1) or right (+1), or null at either end. */
export function stepStatus(
  current: PlannerStatus,
  dir: -1 | 1,
): PlannerStatus | null {
  const i = MOVE_TRACK.indexOf(current as PlannerColumn);
  if (i === -1) return null;
  return MOVE_TRACK[i + dir] ?? null;
}

// ── Shapes ────────────────────────────────────────────────────────────────────

/** Structural subset of `Competition` — see the bundle note at the top. */
export type PlannerCompetition = {
  id: string;
  name: string;
  deadline: string;
  dateConfirmed?: boolean;
};

/** A row of `planner_items` (migration 0028), already mapped. */
export type PlannerOwnItem = {
  id: string;
  title: string;
  note: string | null;
  dueISO: string | null;
  status: PlannerStatus;
  href: string | null;
};

/** A roadmap phase, reduced to what a separator needs. */
export type PlannerPhase = {
  id: string;
  name: string;
  rangeLabel: string;
  startISO: string;
};

export type PlannerItem = {
  /** Unique within a view: `${origin}:${sourceId}`, so origins cannot collide. */
  key: string;
  origin: PlannerOrigin;
  /** What a write targets — an opportunity id, or a planner_items uuid. */
  sourceId: string;
  title: string;
  /**
   * The date, or null. Null is the ONLY representation of "we cannot stand
   * behind this date": an unconfirmed deadline never reaches this field, so no
   * view is even able to render a countdown for one. The rule lives in the
   * type rather than in a component, which is why it cannot be forgotten by
   * the next person to add a view.
   */
  dueISO: string | null;
  status: PlannerStatus;
  /** An in-app path, or null. Never an external URL — the catalog owns those. */
  href: string | null;
  note: string | null;
  /** Days from today. Negative is past. Null exactly when `dueISO` is null. */
  daysLeft: number | null;
};

export type PlannerMonth = {
  /** "2026-09" — sortable, and the render key. */
  key: string;
  label: string;
  items: PlannerItem[];
  /** Phases that BEGIN in this month, drawn as separators above its items. */
  phases: PlannerPhase[];
};

export type PlannerView = {
  items: PlannerItem[];
  /** Agenda: dated, still ahead, grouped by month, earliest first. */
  months: PlannerMonth[];
  /** Dated, past, and not finished — the thing to say out loud. */
  overdue: PlannerItem[];
  /** Committed opportunities whose date we cannot stand behind. */
  undated: PlannerItem[];
  /** Board: the three visible columns, in track order. */
  columns: Record<PlannerColumn, PlannerItem[]>;
  droppedCount: number;
};

export type PlannerInputs = {
  /** Resolved once, on the server. */
  todayISO: string;
  intents: OpportunityIntent[];
  /** Only the competitions the student committed to — resolved by the page. */
  committed: PlannerCompetition[];
  ownItems: PlannerOwnItem[];
  satSittings: { test: string; regDeadline: string }[];
  deadlines: { university: string | null; round: string; iso: string }[];
  phases: PlannerPhase[];
};

// ── Dates ─────────────────────────────────────────────────────────────────────
//
// Local rather than imported from key-dates, for the bundle reason above. UTC
// and date-only on purpose: a planner that moves an item into a different month
// depending on the reader's timezone is a planner nobody can test.

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function utcOf(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, (m ?? 1) - 1, d ?? 1);
}

export function daysBetweenISO(fromISO: string, toISO: string): number {
  return Math.round((utcOf(toISO) - utcOf(fromISO)) / 86_400_000);
}

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-");
  return `${MONTHS[Number(m) - 1]} ${y}`;
}

// ── Build ─────────────────────────────────────────────────────────────────────

/** Only these two origins carry a state the student owns, so only these move. */
export function isMovable(item: PlannerItem): boolean {
  return item.origin === "opportunity" || item.origin === "own";
}

function makeItem(
  origin: PlannerOrigin,
  sourceId: string,
  fields: Omit<PlannerItem, "key" | "origin" | "sourceId" | "daysLeft">,
  todayISO: string,
): PlannerItem {
  return {
    key: `${origin}:${sourceId}`,
    origin,
    sourceId,
    ...fields,
    daysLeft: fields.dueISO ? daysBetweenISO(todayISO, fields.dueISO) : null,
  };
}

function byDateThenTitle(a: PlannerItem, b: PlannerItem): number {
  if (a.dueISO && b.dueISO && a.dueISO !== b.dueISO) {
    return a.dueISO < b.dueISO ? -1 : 1;
  }
  if (a.dueISO && !b.dueISO) return -1;
  if (!a.dueISO && b.dueISO) return 1;
  return a.title.localeCompare(b.title);
}

export function buildPlanner(input: PlannerInputs): PlannerView {
  const { todayISO } = input;
  const byId = new Map(input.committed.map((c) => [c.id, c]));
  const seen = new Set<string>();
  const items: PlannerItem[] = [];

  const push = (next: PlannerItem) => {
    if (seen.has(next.key)) return;
    seen.add(next.key);
    items.push(next);
  };

  // 1. What the student committed to. The intent supplies the state, the
  //    catalog supplies the date — neither is ever copied into the other, which
  //    is what stops a card from showing a deadline corrected months ago.
  for (const intent of input.intents) {
    const c = byId.get(intent.opportunityId);
    // Retired from the catalog: the intent row stays (it is a record of what
    // they did) but there is nothing honest left to render, so it is not shown.
    if (!c) continue;
    const confirmed = c.dateConfirmed === true;
    push(
      makeItem(
        "opportunity",
        c.id,
        {
          title: c.name,
          dueISO: confirmed ? c.deadline : null,
          status: plannerStatusFromIntent(intent.status),
          href: `/opportunities/${c.id}`,
          note: intent.whyMatters ?? null,
        },
        todayISO,
      ),
    );
  }

  // 2. The student's own tasks.
  for (const own of input.ownItems) {
    push(
      makeItem(
        "own",
        own.id,
        {
          title: own.title,
          dueISO: own.dueISO,
          status: own.status,
          href: own.href,
          note: own.note,
        },
        todayISO,
      ),
    );
  }

  // 3. Dated facts about the world. No state, agenda only.
  for (const sitting of input.satSittings) {
    push(
      makeItem(
        "sat",
        sitting.test,
        {
          // Anchored to the REGISTRATION cutoff, not the test day: the cutoff is
          // the date a student can still act on, and it is the one they miss.
          title: `Register for the ${sitting.test} SAT`,
          dueISO: sitting.regDeadline,
          status: "todo",
          href: null,
          note: null,
        },
        todayISO,
      ),
    );
  }

  for (const d of input.deadlines) {
    push(
      makeItem(
        "deadline",
        `${d.university ?? "all"}-${d.round}-${d.iso}`,
        {
          title: d.university ? `${d.university}, ${d.round}` : d.round,
          dueISO: d.iso,
          status: "todo",
          href: null,
          note: null,
        },
        todayISO,
      ),
    );
  }

  // ── The two groupings, computed once rather than per view ──

  const columns: Record<PlannerColumn, PlannerItem[]> = {
    todo: [],
    doing: [],
    done: [],
  };
  let droppedCount = 0;
  for (const i of items) {
    if (i.status === "dropped") {
      droppedCount += 1;
      continue;
    }
    if (!isMovable(i)) continue;
    columns[i.status as PlannerColumn].push(i);
  }
  // Within a column: soonest first, then the dateless, then by title — a total
  // order, so the view is deterministic rather than insertion-ordered.
  for (const col of PLANNER_COLUMNS) columns[col].sort(byDateThenTitle);

  const live = items.filter((i) => i.status !== "dropped");

  const overdue = live
    .filter((i) => i.daysLeft !== null && i.daysLeft < 0 && i.status !== "done")
    .sort(byDateThenTitle);

  // Only a committed opportunity earns a place here. A dateless task of the
  // student's own belongs on the board; putting it in the agenda would fill the
  // "what's next" answer with things that have no next.
  const undated = live
    .filter((i) => i.dueISO === null && i.origin === "opportunity")
    .sort(byDateThenTitle);

  const ahead = live
    .filter((i) => i.daysLeft !== null && i.daysLeft >= 0)
    .sort(byDateThenTitle);

  const months: PlannerMonth[] = [];
  const monthIndex = new Map<string, PlannerMonth>();
  for (const i of ahead) {
    const key = monthKey(i.dueISO!);
    let bucket = monthIndex.get(key);
    if (!bucket) {
      bucket = { key, label: monthLabel(key), items: [], phases: [] };
      monthIndex.set(key, bucket);
      months.push(bucket);
    }
    bucket.items.push(i);
  }

  // A phase is attached to the month it begins in. One with no month to sit in
  // is dropped rather than drawn as a separator over nothing.
  for (const phase of input.phases) {
    monthIndex.get(monthKey(phase.startISO))?.phases.push(phase);
  }

  return { items, months, overdue, undated, columns, droppedCount };
}

/**
 * Which period the agenda's window should open on.
 *
 * The agenda shows one period at a time, so something has to decide which one,
 * and "the first" is wrong the moment a student has anything overdue or has
 * scrolled a year ahead. It is pure and it lives here rather than in the
 * component for the reason `stepStatus` does: the planner's rules are testable
 * or they are folklore.
 *
 * Three cases, and the middle one is the one that matters:
 *
 *   • the month today falls in, when there is anything dated in it;
 *   • otherwise the NEXT month that has something — "now" has to mean something
 *     even in a month where nothing happens to be due, and showing an empty
 *     window as the answer to "what is next" is how a working plan reads as an
 *     empty one;
 *   • otherwise the last month we have, which is the only honest answer when
 *     every dated thing is already behind.
 *
 * Returns 0 for an empty list so a caller can index without a guard.
 */
export function agendaHomeIndex(
  months: { key: string }[],
  todayISO: string,
): number {
  if (months.length === 0) return 0;
  const nowKey = todayISO.slice(0, 7);
  const exact = months.findIndex((m) => m.key === nowKey);
  if (exact >= 0) return exact;
  const next = months.findIndex((m) => m.key > nowKey);
  return next >= 0 ? next : months.length - 1;
}

/**
 * The handful of numbers the plan's single guidance sentence reasons about.
 *
 * Derived from the built view rather than re-queried, so the card at the top of
 * the window can never disagree with the cards underneath it — the same reason
 * the two views share one loader. Pure, and tested: nothing in the planner can
 * be verified in a browser by an agent, so its logic lives where a test reaches.
 */
export type PlannerTally = {
  /** Opportunities they said they would enter, excluding the ones dropped. */
  committed: number;
  /** Of those, the ones that actually moved off "not started". */
  started: number;
  /** Dated, past, and unfinished. */
  overdue: number;
  /** Things still ahead with a date we can stand behind. */
  dated: number;
  /** The nearest of those. Null when nothing ahead carries a confirmed date. */
  nextDeadline: { title: string; daysLeft: number } | null;
};

export function tallyPlanner(view: PlannerView): PlannerTally {
  const commitments = view.items.filter(
    (i) => i.origin === "opportunity" && i.status !== "dropped",
  );

  // The months are already sorted earliest-first and so are the items inside
  // them, so the nearest dated thing is the head of the first non-empty month.
  // Recomputing a minimum here would be a second ordering that can disagree
  // with the one the agenda draws.
  const soonest = view.months.find((m) => m.items.length > 0)?.items[0] ?? null;

  return {
    committed: commitments.length,
    started: commitments.filter(
      (i) => i.status === "doing" || i.status === "done",
    ).length,
    overdue: view.overdue.length,
    dated: view.months.reduce((n, m) => n + m.items.length, 0),
    nextDeadline:
      soonest && soonest.daysLeft !== null
        ? { title: soonest.title, daysLeft: soonest.daysLeft }
        : null,
  };
}

/**
 * The name that ties one card to itself across a move, so the browser morphs it
 * from the column it left into the one it arrives in.
 *
 * A `view-transition-name` must be a CSS custom-ident and unique in the
 * document, which is the entire reason this is a function and not a template
 * literal at the call site — the guide learned the same lesson with
 * `guideMorph`. The key is already `${origin}:${sourceId}`, unique within a
 * view by construction (a test asserts one opportunity can never appear twice),
 * so uniqueness of the INPUT comes for free.
 *
 * Uniqueness of the output does not, and the first version of this got it
 * wrong: sweeping every illegal character to `-` maps `a:b` and `a-b` onto one
 * name. Two elements claiming one transition name is not a broken animation, it
 * is silently NO animation — the worst class of bug this file can ship, because
 * nothing fails and the feature simply is not there. So the escape is
 * INJECTIVE: every character outside `[a-zA-Z0-9]` becomes its own code point
 * between hyphens, including the hyphen itself, and two different keys cannot
 * meet. The `plan-` prefix covers the other rule, that an ident may not begin
 * with a digit.
 */
export function plannerMorph(key: string): string {
  const safe = key.replace(/[^a-zA-Z0-9]/g, (c) => `-${c.charCodeAt(0)}-`);
  return `plan-${safe}`;
}
