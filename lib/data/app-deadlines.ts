// Real US application deadlines, by stage, for the ~55 schools in the US
// dataset. Like key-dates.ts, these live in CODE (never AI-generated) and are
// resolved against the student's application cycle, so the same profile always
// shows the same dated countdowns.
//
// ⚠️ VERIFY ANNUALLY. Dates below were hand-checked against public admissions
// sources for the 2026–27 cycle (see the WebSearch/official-site links the
// founder pulled). They are STABLE month/day patterns — a school's Nov 1 ED
// deadline is Nov 1 most years — so we store month/day (not a fixed year) and
// compute the actual calendar year from the student's graduation year. Re-check
// each cycle and bump anything that moved; the UI always says "confirm on the
// official site" because a school can shift a date by a day or two.
//
// Stages:
//  • ED   — Early Decision I (BINDING; you must enrol if admitted)
//  • ED2  — Early Decision II (BINDING; a later binding round)
//  • EA   — Early Action (non-binding early round)
//  • REA  — Restrictive / Single-Choice Early Action (non-binding, but you may
//           not apply early elsewhere — HYPS + Notre Dame)
//  • RD   — Regular Decision

import { findUniversity } from "@/lib/data/universities";
import { daysBetween } from "@/lib/data/key-dates";

export type DeadlineStage = "ED" | "ED2" | "EA" | "REA" | "RD";

export type AppDeadline = { stage: DeadlineStage; month: number; day: number };

export const STAGE_META: Record<
  DeadlineStage,
  { label: string; short: string; binding: boolean }
> = {
  ED: { label: "Early Decision", short: "ED", binding: true },
  ED2: { label: "Early Decision II", short: "ED II", binding: true },
  EA: { label: "Early Action", short: "EA", binding: false },
  REA: { label: "Restrictive Early Action", short: "REA", binding: false },
  RD: { label: "Regular Decision", short: "RD", binding: false },
};

// Keyed by University.id (lib/data/universities.ts). Schools omitted here (e.g.
// rolling-admission Pitt) simply show no deadline block rather than a guessed
// date. Each row lists only the stages that school actually offers.
export const SCHOOL_DEADLINES: Record<string, AppDeadline[]> = {
  // ── HYPSM + restrictive-early Ivies ──────────────────────────────────────
  harvard: [{ stage: "REA", month: 11, day: 1 }, { stage: "RD", month: 1, day: 1 }],
  princeton: [{ stage: "REA", month: 11, day: 1 }, { stage: "RD", month: 1, day: 1 }],
  yale: [{ stage: "REA", month: 11, day: 1 }, { stage: "RD", month: 1, day: 2 }],
  stanford: [{ stage: "REA", month: 11, day: 1 }, { stage: "RD", month: 1, day: 5 }],
  "notre-dame": [{ stage: "REA", month: 11, day: 1 }, { stage: "RD", month: 1, day: 1 }],
  mit: [{ stage: "EA", month: 11, day: 1 }, { stage: "RD", month: 1, day: 5 }],
  caltech: [{ stage: "EA", month: 11, day: 1 }, { stage: "RD", month: 1, day: 3 }],

  // ── Early-Decision Ivies + peers ─────────────────────────────────────────
  columbia: [{ stage: "ED", month: 11, day: 1 }, { stage: "RD", month: 1, day: 1 }],
  upenn: [{ stage: "ED", month: 11, day: 1 }, { stage: "RD", month: 1, day: 5 }],
  brown: [{ stage: "ED", month: 11, day: 1 }, { stage: "RD", month: 1, day: 5 }],
  dartmouth: [{ stage: "ED", month: 11, day: 1 }, { stage: "RD", month: 1, day: 1 }],
  cornell: [{ stage: "ED", month: 11, day: 1 }, { stage: "RD", month: 1, day: 2 }],
  duke: [{ stage: "ED", month: 11, day: 1 }, { stage: "RD", month: 1, day: 4 }],
  northwestern: [{ stage: "ED", month: 11, day: 1 }, { stage: "RD", month: 1, day: 2 }],
  cmu: [{ stage: "ED", month: 11, day: 1 }, { stage: "RD", month: 1, day: 5 }],
  barnard: [{ stage: "ED", month: 11, day: 1 }, { stage: "RD", month: 1, day: 1 }],

  // ── ED I + ED II + RD ────────────────────────────────────────────────────
  jhu: [
    { stage: "ED", month: 11, day: 1 },
    { stage: "ED2", month: 1, day: 2 },
    { stage: "RD", month: 1, day: 2 },
  ],
  vanderbilt: [
    { stage: "ED", month: 11, day: 1 },
    { stage: "ED2", month: 1, day: 1 },
    { stage: "RD", month: 1, day: 1 },
  ],
  rice: [
    { stage: "ED", month: 11, day: 1 },
    { stage: "ED2", month: 1, day: 4 },
    { stage: "RD", month: 1, day: 4 },
  ],
  washu: [
    { stage: "ED", month: 11, day: 1 },
    { stage: "ED2", month: 1, day: 2 },
    { stage: "RD", month: 1, day: 2 },
  ],
  emory: [
    { stage: "ED", month: 11, day: 1 },
    { stage: "ED2", month: 1, day: 1 },
    { stage: "RD", month: 1, day: 1 },
  ],
  nyu: [
    { stage: "ED", month: 11, day: 1 },
    { stage: "ED2", month: 1, day: 1 },
    { stage: "RD", month: 1, day: 5 },
  ],
  tufts: [
    { stage: "ED", month: 11, day: 1 },
    { stage: "ED2", month: 1, day: 4 },
    { stage: "RD", month: 1, day: 4 },
  ],
  bc: [
    { stage: "ED", month: 11, day: 1 },
    { stage: "ED2", month: 1, day: 1 },
    { stage: "RD", month: 1, day: 1 },
  ],
  bu: [
    { stage: "ED", month: 11, day: 1 },
    { stage: "ED2", month: 1, day: 4 },
    { stage: "RD", month: 1, day: 4 },
  ],
  rochester: [
    { stage: "ED", month: 11, day: 1 },
    { stage: "ED2", month: 1, day: 5 },
    { stage: "RD", month: 1, day: 5 },
  ],
  lehigh: [
    { stage: "ED", month: 11, day: 1 },
    { stage: "ED2", month: 1, day: 1 },
    { stage: "RD", month: 1, day: 1 },
  ],
  brandeis: [
    { stage: "ED", month: 11, day: 1 },
    { stage: "ED2", month: 1, day: 1 },
    { stage: "RD", month: 1, day: 1 },
  ],
  wpi: [
    { stage: "ED", month: 11, day: 1 },
    { stage: "ED2", month: 1, day: 5 },
    { stage: "RD", month: 2, day: 1 },
  ],

  // ── EA + ED + RD (offer several plans) ───────────────────────────────────
  uchicago: [
    { stage: "EA", month: 11, day: 1 },
    { stage: "ED", month: 11, day: 1 },
    { stage: "ED2", month: 1, day: 5 },
    { stage: "RD", month: 1, day: 5 },
  ],
  uva: [
    { stage: "ED", month: 11, day: 1 },
    { stage: "EA", month: 11, day: 1 },
    { stage: "RD", month: 1, day: 5 },
  ],
  georgetown: [{ stage: "EA", month: 11, day: 1 }, { stage: "RD", month: 1, day: 10 }],
  usc: [{ stage: "EA", month: 11, day: 1 }, { stage: "RD", month: 1, day: 10 }],
  unc: [{ stage: "EA", month: 10, day: 15 }, { stage: "RD", month: 1, day: 15 }],
  purdue: [{ stage: "EA", month: 11, day: 1 }, { stage: "RD", month: 1, day: 15 }],
  northeastern: [
    { stage: "EA", month: 11, day: 1 },
    { stage: "ED", month: 11, day: 1 },
    { stage: "ED2", month: 1, day: 1 },
    { stage: "RD", month: 1, day: 1 },
  ],
  "case-western": [
    { stage: "EA", month: 11, day: 1 },
    { stage: "ED", month: 11, day: 1 },
    { stage: "ED2", month: 1, day: 15 },
    { stage: "RD", month: 1, day: 15 },
  ],
  fordham: [
    { stage: "EA", month: 11, day: 1 },
    { stage: "ED", month: 11, day: 1 },
    { stage: "RD", month: 1, day: 3 },
  ],
  drexel: [
    { stage: "EA", month: 11, day: 1 },
    { stage: "ED", month: 11, day: 1 },
    { stage: "RD", month: 1, day: 15 },
  ],
  villanova: [
    { stage: "EA", month: 11, day: 1 },
    { stage: "ED", month: 11, day: 1 },
    { stage: "ED2", month: 1, day: 15 },
    { stage: "RD", month: 1, day: 15 },
  ],
  "santa-clara": [
    { stage: "EA", month: 11, day: 1 },
    { stage: "ED", month: 11, day: 1 },
    { stage: "ED2", month: 1, day: 7 },
    { stage: "RD", month: 1, day: 7 },
  ],
  smu: [
    { stage: "EA", month: 11, day: 1 },
    { stage: "ED", month: 11, day: 1 },
    { stage: "ED2", month: 1, day: 15 },
    { stage: "RD", month: 1, day: 15 },
  ],
  miami: [
    { stage: "EA", month: 11, day: 1 },
    { stage: "ED", month: 11, day: 1 },
    { stage: "ED2", month: 1, day: 1 },
    { stage: "RD", month: 1, day: 15 },
  ],
  tulane: [
    { stage: "ED", month: 11, day: 1 },
    { stage: "EA", month: 11, day: 10 },
    { stage: "ED2", month: 1, day: 15 },
    { stage: "RD", month: 1, day: 15 },
  ],
  rpi: [
    { stage: "EA", month: 11, day: 1 },
    { stage: "ED", month: 11, day: 1 },
    { stage: "ED2", month: 12, day: 15 },
    { stage: "RD", month: 1, day: 15 },
  ],
  rit: [
    { stage: "ED", month: 11, day: 1 },
    { stage: "EA", month: 12, day: 1 },
    { stage: "ED2", month: 1, day: 1 },
    { stage: "RD", month: 1, day: 15 },
  ],
  stevens: [
    { stage: "ED", month: 11, day: 15 },
    { stage: "EA", month: 12, day: 1 },
    { stage: "ED2", month: 1, day: 15 },
    { stage: "RD", month: 2, day: 1 },
  ],
  syracuse: [{ stage: "ED", month: 11, day: 15 }, { stage: "RD", month: 1, day: 1 }],

  // ── Selective liberal-arts colleges ──────────────────────────────────────
  williams: [{ stage: "ED", month: 11, day: 15 }, { stage: "RD", month: 1, day: 5 }],
  amherst: [{ stage: "ED", month: 11, day: 1 }, { stage: "RD", month: 1, day: 5 }],
  swarthmore: [
    { stage: "ED", month: 11, day: 15 },
    { stage: "ED2", month: 1, day: 4 },
    { stage: "RD", month: 1, day: 4 },
  ],
  pomona: [
    { stage: "ED", month: 11, day: 1 },
    { stage: "ED2", month: 1, day: 8 },
    { stage: "RD", month: 1, day: 8 },
  ],
  bowdoin: [
    { stage: "ED", month: 11, day: 15 },
    { stage: "ED2", month: 1, day: 5 },
    { stage: "RD", month: 1, day: 5 },
  ],
  middlebury: [
    { stage: "ED", month: 11, day: 1 },
    { stage: "ED2", month: 1, day: 4 },
    { stage: "RD", month: 1, day: 4 },
  ],
  wellesley: [
    { stage: "ED", month: 11, day: 1 },
    { stage: "ED2", month: 1, day: 1 },
    { stage: "RD", month: 1, day: 8 },
  ],
  carleton: [
    { stage: "ED", month: 11, day: 15 },
    { stage: "ED2", month: 1, day: 15 },
    { stage: "RD", month: 1, day: 15 },
  ],
  "harvey-mudd": [
    { stage: "ED", month: 11, day: 15 },
    { stage: "ED2", month: 1, day: 5 },
    { stage: "RD", month: 1, day: 5 },
  ],
  cmc: [
    { stage: "ED", month: 11, day: 1 },
    { stage: "ED2", month: 1, day: 8 },
    { stage: "RD", month: 1, day: 8 },
  ],
  colgate: [
    { stage: "ED", month: 11, day: 15 },
    { stage: "ED2", month: 1, day: 15 },
    { stage: "RD", month: 1, day: 15 },
  ],
  hamilton: [
    { stage: "ED", month: 11, day: 15 },
    { stage: "ED2", month: 1, day: 4 },
    { stage: "RD", month: 1, day: 4 },
  ],
  davidson: [
    { stage: "ED", month: 11, day: 15 },
    { stage: "ED2", month: 1, day: 6 },
    { stage: "RD", month: 1, day: 6 },
  ],
  vassar: [
    { stage: "ED", month: 11, day: 15 },
    { stage: "ED2", month: 1, day: 1 },
    { stage: "RD", month: 1, day: 1 },
  ],
  grinnell: [
    { stage: "ED", month: 11, day: 15 },
    { stage: "ED2", month: 1, day: 1 },
    { stage: "RD", month: 1, day: 1 },
  ],
  // Wake Forest is test-optional and ED-heavy; RD is early January.
  "wake-forest": [
    { stage: "ED", month: 11, day: 15 },
    { stage: "ED2", month: 1, day: 1 },
    { stage: "RD", month: 1, day: 1 },
  ],
  // Note: pitt (rolling) and syracuse-style schools without a fixed early
  // round are represented above only where a real deadline exists.
};

export type ResolvedDeadline = {
  stage: DeadlineStage;
  label: string;
  short: string;
  binding: boolean;
  date: string; // ISO YYYY-MM-DD, resolved for the student's cycle
  daysLeft: number;
  passed: boolean;
};

const pad = (n: number) => String(n).padStart(2, "0");

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Human month/day with no year, e.g. "Nov 1" — for cycle-agnostic hints. */
export function formatMonthDay(month: number, day: number): string {
  return `${MONTHS[month - 1]} ${day}`;
}

// A "Class of G" student applies in the fall of G-1: fall/winter deadlines
// (Aug–Dec) fall in year G-1, and Jan deadlines fall in year G. With no
// graduation year we assume the upcoming fall season (matches key-dates.ts).
function cycleFallYear(today: Date, graduationYear?: number): number {
  if (graduationYear && Number.isFinite(graduationYear)) return graduationYear - 1;
  return today.getUTCFullYear();
}

function resolveList(
  list: AppDeadline[],
  today: Date,
  graduationYear?: number
): ResolvedDeadline[] {
  const fall = cycleFallYear(today, graduationYear);
  return list
    .map((d) => {
      const year = d.month >= 8 ? fall : fall + 1;
      const date = `${year}-${pad(d.month)}-${pad(d.day)}`;
      const daysLeft = daysBetween(today, date);
      const meta = STAGE_META[d.stage];
      return {
        stage: d.stage,
        label: meta.label,
        short: meta.short,
        binding: meta.binding,
        date,
        daysLeft,
        passed: daysLeft < 0,
      };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

/**
 * Dated, sorted deadlines for a school, resolved to the student's cycle. Looks
 * the school up by name or id (so it works off the analysis's `school.name`).
 * Returns [] when the school has no curated deadlines.
 */
export function resolveSchoolDeadlines(
  nameOrId: string,
  today: Date,
  graduationYear?: number
): ResolvedDeadline[] {
  const uni = findUniversity(nameOrId);
  const id = uni?.id ?? nameOrId.trim().toLowerCase();
  const list = SCHOOL_DEADLINES[id];
  if (!list) return [];
  return resolveList(list, today, graduationYear);
}

/**
 * The single earliest deadline for a school as a short static hint (e.g.
 * "ED · Nov 1"), cycle-agnostic — for the college-list picker before an
 * analysis exists. Fall rounds sort before the following January.
 */
export function earliestDeadlineHint(nameOrId: string): string | null {
  const uni = findUniversity(nameOrId);
  const id = uni?.id ?? nameOrId.trim().toLowerCase();
  const list = SCHOOL_DEADLINES[id];
  if (!list || list.length === 0) return null;
  const seasonKey = (m: number) => (m >= 8 ? m - 8 : m + 4); // Aug=0 … Jul=11
  const earliest = [...list].sort(
    (a, b) => seasonKey(a.month) - seasonKey(b.month) || a.day - b.day
  )[0];
  return `${STAGE_META[earliest.stage].short} · ${formatMonthDay(earliest.month, earliest.day)}`;
}
