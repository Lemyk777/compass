// The admissions cycle a row belongs to, and the placeholder date used when a
// row has no announced deadline.
//
// `competition_deadlines.deadline` is NOT NULL (migration 0011), so a row with
// nothing to announce still needs a value in that column. It gets the end of
// the current cycle purely as a sort key — `date_confirmed` stays false, and
// every surface then renders "Dates not yet announced" instead of a countdown.
// Nothing reads the placeholder as a real date.
//
// A cycle turns over in August: before then we are still inside the cycle that
// started the previous year.

const CYCLE_START_MONTH = 7; // August, zero-indexed

function cycleStartYear(now: Date): number {
  return now.getMonth() >= CYCLE_START_MONTH ? now.getFullYear() : now.getFullYear() - 1;
}

/** e.g. "2026-27". */
export function currentCycle(now: Date = new Date()): string {
  const year = cycleStartYear(now);
  return `${year}-${String(year + 1).slice(2)}`;
}

/** ISO date used as a sort placeholder for a row with no announced deadline. */
export function cycleEndPlaceholder(now: Date = new Date()): string {
  return `${cycleStartYear(now) + 1}-06-30`;
}
