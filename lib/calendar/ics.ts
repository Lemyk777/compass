// Calendar file (.ics) generation — the honest, zero-infrastructure return loop.
//
// The single largest effect in the college-access literature is the gap between
// telling someone about a deadline and doing something about it for them
// (Bettinger et al.: information-only ≈ 0; assistance +25–30%). This is the
// cheapest honest version: a real calendar event with a reminder a week before
// it closes, dropped into the student's OWN calendar. No account, no push
// permission, no email deliverability — it just works, and it brings them back
// to the deadline (and the official page) on its own.
//
// Only ever built from CONFIRMED dates — a reminder set on a guessed date would
// send a student to a page that isn't open, which is worse than no reminder.

import type { Competition } from "@/lib/data/key-dates";

function icsDate(iso: string): string {
  return iso.replace(/-/g, "");
}

/** Escape the characters iCalendar treats as structure. */
function icsText(s: string): string {
  return s.replace(/[\\;,]/g, (m) => `\\${m}`).replace(/\r?\n/g, "\\n");
}

/** Build an iCalendar document (VEVENT per confirmed item, alarm 7 days out). */
export function buildIcs(items: Competition[]): string {
  const events = items
    .filter((c) => c.dateConfirmed)
    .map((c) =>
      [
        "BEGIN:VEVENT",
        `UID:${c.id}@compass`,
        `DTSTART;VALUE=DATE:${icsDate(c.deadline)}`,
        `SUMMARY:${icsText(`Deadline — ${c.name}`)}`,
        `DESCRIPTION:${icsText(`${c.blurb}\n${c.url}`)}`,
        `URL:${c.url}`,
        "BEGIN:VALARM",
        "TRIGGER:-P7D",
        "ACTION:DISPLAY",
        `DESCRIPTION:${icsText(`One week until ${c.name} closes`)}`,
        "END:VALARM",
        "END:VEVENT",
      ].join("\r\n"),
    );

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Compass//Opportunities//EN",
    "CALSCALE:GREGORIAN",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
}

/**
 * Trigger a download of the calendar file for the given items. Client-only
 * (uses Blob / DOM). No-ops when nothing has a confirmed date.
 */
export function downloadIcs(items: Competition[]): void {
  const datable = items.filter((c) => c.dateConfirmed);
  if (datable.length === 0) return;

  const url = URL.createObjectURL(
    new Blob([buildIcs(datable)], { type: "text/calendar" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = datable.length === 1 ? `${datable[0].id}-deadline.ics` : "deadlines.ics";
  a.rel = "noopener";
  // The anchor must be in the document for the click to register a download in
  // every browser (a detached <a> is ignored by some), and the object URL must
  // outlive the click: revoking it synchronously cancels the download while the
  // browser is still reading the blob, which is exactly the "works sometimes"
  // flakiness testers hit. Tear both down on the next tick instead.
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 1000);
}
