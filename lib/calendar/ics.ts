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

// The characters that cannot sit on an iCalendar content line, written as
// explicit escapes rather than as literal control characters in the source. A
// raw NUL or CR in a .ts file does not reliably survive an editor, a patch or a
// review, and a mangled character class here fails OPEN: it would strip the
// wrong things and still look like a guard.
// eslint-disable-next-line no-control-regex -- removing them is the point
const ICS_UNSAFE = /[\u0000-\u001F\u007F]/g;

/**
 * Escape the characters iCalendar treats as structure.
 *
 * Order matters: the newline is turned into the two-character escape `\n`
 * FIRST, because that is meaningful text a reader should still see, and only
 * then is everything else in the control range removed. Tabs go too. RFC 5545
 * does permit a tab inside a TEXT value, but nothing in a competition name, a
 * blurb or a link has any use for one, and a single rule for both value types
 * is worth more here than the last byte of permissiveness — this is the file
 * that lands in someone's calendar.
 */
function icsText(s: string): string {
  return s
    .replace(/[\\;,]/g, (m) => `\\${m}`)
    .replace(/\r?\n/g, "\\n")
    .replace(ICS_UNSAFE, "");
}

/**
 * A URI value, made safe to put on a content line.
 *
 * `URL:` is NOT a TEXT property — RFC 5545 gives it the URI value type, where a
 * backslash escapes nothing and would travel into the link itself. So the only
 * correct treatment is to remove what cannot appear on a line at all: CR, LF
 * and the other control characters. A real URL contains none of them.
 *
 * This is a live hole rather than a hypothetical one. `DESCRIPTION` ran the
 * same string through `icsText` and `URL:` did not, which is the tell that it
 * was an oversight — and the partner form's `z.string().trim().url()` ACCEPTS a
 * URL with `\r\n` inside it and stores it verbatim, because the WHATWG parser
 * that `.url()` calls tolerates them. An approved organisation could therefore
 * post a link that ends a VEVENT and begins another, and every student who
 * downloaded that calendar file got whatever events it wrote — into their own
 * calendar, where taking the post down afterwards reaches nothing.
 *
 * The partner schema rejects these characters too. Both ends, because this
 * generator also runs over curated rows and over anything discovery writes.
 */
function icsUri(s: string): string {
  return s.replace(ICS_UNSAFE, "");
}

/**
 * Build an iCalendar document (VEVENT per confirmed item, alarm 7 days out).
 *
 * Exported for the unit tests, and worth it: this is the pure half, and the
 * only half where the escaping can be checked at all — `downloadIcs` around it
 * needs a Blob and a DOM. What it writes ends up in a student's own calendar,
 * so "does a hostile value stay inside its property" is exactly the question
 * that has to be asked of a function rather than of a screenshot.
 */
export function buildIcs(items: Competition[]): string {
  const events = items
    .filter((c) => c.dateConfirmed)
    .map((c) =>
      [
        "BEGIN:VEVENT",
        // `id` is a curated slug or a database uuid rather than anything typed
        // into a form, but it is the same kind of value in the same kind of
        // position, and the cost of being sure is one call.
        `UID:${icsUri(c.id)}@compass`,
        `DTSTART;VALUE=DATE:${icsDate(c.deadline)}`,
        `SUMMARY:${icsText(`Deadline — ${c.name}`)}`,
        `DESCRIPTION:${icsText(`${c.blurb}\n${c.url}`)}`,
        `URL:${icsUri(c.url)}`,
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
