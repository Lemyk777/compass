/**
 * Raw page views → the numbers on /admin/traffic.
 *
 * Pure: rows in, summary out, `now` passed as an argument. No database, no
 * clock, no formatting. That is what lets scripts/test-engine.ts assert the
 * definitions below instead of leaving them as folklore in a JSX file — and
 * these definitions are the entire feature. "Visitors" and "sessions" and
 * "bounce rate" are not facts, they are choices, and a founder who does not
 * know which choice was made cannot act on the number.
 *
 * The choices, stated once:
 *
 *   visitor    one browser (a year-long cookie). Clearing cookies or switching
 *              device makes a new one. We undercount returns; we never guess.
 *   visit      a session id, which rolls over after 30 minutes of inactivity.
 *   duration   VISIBLE time, summed from the beacon — not last-page-minus-first,
 *              which reports a forgotten tab as an hour of rapt attention.
 *   returned   seen on two or more different days. Not "came back within 30
 *              minutes", which is the same visit, and not "clicked twice".
 *   bounced    one page, under ten seconds — and only counted among visits
 *              whose length we actually learned.
 */

export type ViewRow = {
  visitor_id: string;
  session_id: string;
  user_id: string | null;
  path: string;
  referrer: string | null;
  country: string | null;
  device: string | null;
  dwell_ms: number | null;
  created_at: string;
};

export type Totals = {
  visitors: number;
  visits: number;
  views: number;
  /** Distinct visitors who were signed in for at least one view. */
  signedIn: number;
  /** Visitors seen on two or more separate days inside the range. */
  returned: number;
  /** Seconds. Median is the headline; a mean is dragged around by one outlier. */
  medianVisitSec: number;
  meanVisitSec: number;
  /** 0–1, over visits whose duration is known. Null when none are. */
  bounceRate: number | null;
  viewsPerVisit: number;
};

export type Bucket = {
  key: string;
  label: string;
  visitors: number;
  visits: number;
  views: number;
  /** First time we have ever seen this visitor (within the loaded history). */
  newVisitors: number;
  returningVisitors: number;
};

export type Summary = {
  granularity: "hour" | "day";
  totals: Totals;
  /** The equally long window immediately before this one, for the deltas. */
  previous: Totals;
  buckets: Bucket[];
  pages: {
    path: string;
    views: number;
    visitors: number;
    /** Median visible seconds on this page; null when no beacon ever landed. */
    medianSec: number | null;
    /** Visits that STARTED here. */
    entries: number;
  }[];
  sources: { source: string; visits: number; visitors: number }[];
  countries: { country: string; visitors: number }[];
  devices: { device: string; visitors: number }[];
  /** How many separate days each visitor showed up on. */
  loyalty: { label: string; visitors: number }[];
  /** Last 30 minutes. */
  live: { visitors: number; views: number };
};

const SEC = 1000;
const BOUNCE_MS = 10 * SEC;
const LIVE_MS = 30 * 60 * SEC;

const ts = (r: ViewRow) => Date.parse(r.created_at);

/** Day and hour keys are UTC everywhere, so the server and the reader agree. */
const dayKey = (t: number) => new Date(t).toISOString().slice(0, 10);
const hourKey = (t: number) => new Date(t).toISOString().slice(0, 13);

function median(values: number[]): number | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

/** Group rows by a key, preserving insertion order of first appearance. */
function groupBy<T>(rows: T[], key: (r: T) => string): Map<string, T[]> {
  const out = new Map<string, T[]>();
  for (const r of rows) {
    const k = key(r);
    const list = out.get(k);
    if (list) list.push(r);
    else out.set(k, [r]);
  }
  return out;
}

/**
 * One visit's length, in milliseconds, or null when unknowable.
 *
 * `views[i].created_at - first + dwell[i]` maximised over the visit's pages:
 * the last page's own reading time is included, which is the difference between
 * "you read one article for four minutes" reading as 4:00 and reading as 0:00.
 * A single view with no beacon is genuinely unknown and says so.
 */
export function visitDurationMs(views: ViewRow[]): number | null {
  if (!views.length) return null;
  const times = views.map(ts);
  const first = Math.min(...times);
  let best = 0;
  let known = false;
  views.forEach((v, i) => {
    const end = times[i] - first + (v.dwell_ms ?? 0);
    if (views.length > 1 || v.dwell_ms != null) known = true;
    if (end > best) best = end;
  });
  return known ? best : null;
}

function totalsFor(rows: ViewRow[]): Totals {
  const visitors = new Set(rows.map((r) => r.visitor_id));
  const byVisit = groupBy(rows, (r) => r.session_id);

  const durations: number[] = [];
  let bounced = 0;
  let knownVisits = 0;
  for (const views of byVisit.values()) {
    const ms = visitDurationMs(views);
    if (ms == null) continue;
    knownVisits++;
    durations.push(ms);
    if (views.length === 1 && ms < BOUNCE_MS) bounced++;
  }

  // Days-per-visitor, which is the only honest "did they come back".
  const daysPerVisitor = new Map<string, Set<string>>();
  for (const r of rows) {
    const set = daysPerVisitor.get(r.visitor_id) ?? new Set<string>();
    set.add(dayKey(ts(r)));
    daysPerVisitor.set(r.visitor_id, set);
  }

  const mean = durations.length
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : 0;

  return {
    visitors: visitors.size,
    visits: byVisit.size,
    views: rows.length,
    signedIn: new Set(rows.filter((r) => r.user_id).map((r) => r.visitor_id)).size,
    returned: [...daysPerVisitor.values()].filter((d) => d.size >= 2).length,
    medianVisitSec: Math.round((median(durations) ?? 0) / SEC),
    meanVisitSec: Math.round(mean / SEC),
    bounceRate: knownVisits ? bounced / knownVisits : null,
    viewsPerVisit: byVisit.size ? rows.length / byVisit.size : 0,
  };
}

/**
 * @param rows   every view from `windowStart - rangeMs` to now. The extra
 *               history is not displayed; it exists so "new visitor" means
 *               "never seen before" rather than "not seen since Tuesday", and
 *               so the previous-period deltas have something to compare to.
 * @param now    end of the range.
 * @param days   length of the displayed range, in days.
 */
export function summarize(rows: ViewRow[], now: number, days: number): Summary {
  const rangeMs = days * 24 * 60 * 60 * SEC;
  const from = now - rangeMs;
  const prevFrom = from - rangeMs;

  const current = rows.filter((r) => ts(r) >= from && ts(r) <= now);
  const previous = rows.filter((r) => ts(r) >= prevFrom && ts(r) < from);

  // First-ever sighting per visitor, across ALL loaded history including the
  // comparison window — otherwise everyone looks new on the first day shown.
  const firstSeen = new Map<string, number>();
  for (const r of rows) {
    const t = ts(r);
    const seen = firstSeen.get(r.visitor_id);
    if (seen == null || t < seen) firstSeen.set(r.visitor_id, t);
  }

  // Hourly for a day or two, daily beyond — 90 daily bars are readable, 2,160
  // hourly ones are a smear.
  const granularity: "hour" | "day" = days <= 2 ? "hour" : "day";
  const step = granularity === "hour" ? 60 * 60 * SEC : 24 * 60 * 60 * SEC;
  const keyOf = granularity === "hour" ? hourKey : dayKey;

  const buckets: Bucket[] = [];
  const byBucket = groupBy(current, (r) => keyOf(ts(r)));
  // Walk the calendar, not the data: an empty day is information ("nobody came")
  // and a chart that silently omits it draws a flat line through the gap.
  const count = granularity === "hour" ? Math.round(rangeMs / step) : days;
  for (let i = count - 1; i >= 0; i--) {
    const t = now - i * step;
    const key = keyOf(t);
    const inBucket = byBucket.get(key) ?? [];
    const seenHere = new Set(inBucket.map((r) => r.visitor_id));
    let fresh = 0;
    for (const v of seenHere) {
      const first = firstSeen.get(v);
      if (first != null && keyOf(first) === key) fresh++;
    }
    buckets.push({
      key,
      label: granularity === "hour" ? `${key.slice(11)}:00` : key.slice(5),
      visitors: seenHere.size,
      visits: new Set(inBucket.map((r) => r.session_id)).size,
      views: inBucket.length,
      newVisitors: fresh,
      returningVisitors: seenHere.size - fresh,
    });
  }

  // ---- pages -------------------------------------------------------------
  const visitRows = groupBy(current, (r) => r.session_id);
  const entryPath = new Map<string, number>();
  for (const views of visitRows.values()) {
    const first = views.reduce((a, b) => (ts(a) <= ts(b) ? a : b));
    entryPath.set(first.path, (entryPath.get(first.path) ?? 0) + 1);
  }
  const pages = [...groupBy(current, (r) => r.path).entries()]
    .map(([path, rs]) => ({
      path,
      views: rs.length,
      visitors: new Set(rs.map((r) => r.visitor_id)).size,
      medianSec: (() => {
        const m = median(
          rs.filter((r) => r.dwell_ms != null).map((r) => r.dwell_ms as number)
        );
        return m == null ? null : Math.round(m / SEC);
      })(),
      entries: entryPath.get(path) ?? 0,
    }))
    .sort((a, b) => b.views - a.views);

  // ---- sources: one per VISIT, not per view ------------------------------
  // A visit has a single origin. Counting per view would rank whichever source
  // sends the most patient readers, not the one that sends the most people.
  const sourceVisits = new Map<string, { visits: number; visitors: Set<string> }>();
  for (const views of visitRows.values()) {
    const ordered = [...views].sort((a, b) => ts(a) - ts(b));
    const source = ordered.find((v) => v.referrer)?.referrer ?? "Direct";
    const entry = sourceVisits.get(source) ?? { visits: 0, visitors: new Set() };
    entry.visits++;
    entry.visitors.add(ordered[0].visitor_id);
    sourceVisits.set(source, entry);
  }
  const sources = [...sourceVisits.entries()]
    .map(([source, v]) => ({ source, visits: v.visits, visitors: v.visitors.size }))
    .sort((a, b) => b.visits - a.visits);

  // ---- who and on what ---------------------------------------------------
  const distinctVisitorsBy = (pick: (r: ViewRow) => string | null) => {
    const map = new Map<string, Set<string>>();
    for (const r of current) {
      const k = pick(r) ?? "Unknown";
      const set = map.get(k) ?? new Set<string>();
      set.add(r.visitor_id);
      map.set(k, set);
    }
    return [...map.entries()]
      .map(([k, set]) => ({ key: k, visitors: set.size }))
      .sort((a, b) => b.visitors - a.visitors);
  };

  const countries = distinctVisitorsBy((r) => r.country).map((e) => ({
    country: e.key,
    visitors: e.visitors,
  }));
  const devices = distinctVisitorsBy((r) => r.device).map((e) => ({
    device: e.key,
    visitors: e.visitors,
  }));

  // ---- loyalty: how many separate days each visitor turned up ------------
  const daysPerVisitor = new Map<string, Set<string>>();
  for (const r of current) {
    const set = daysPerVisitor.get(r.visitor_id) ?? new Set<string>();
    set.add(dayKey(ts(r)));
    daysPerVisitor.set(r.visitor_id, set);
  }
  const bands: { label: string; test: (n: number) => boolean }[] = [
    { label: "1 day only", test: (n) => n === 1 },
    { label: "2 days", test: (n) => n === 2 },
    { label: "3–5 days", test: (n) => n >= 3 && n <= 5 },
    { label: "6+ days", test: (n) => n >= 6 },
  ];
  const loyalty = bands.map((b) => ({
    label: b.label,
    visitors: [...daysPerVisitor.values()].filter((d) => b.test(d.size)).length,
  }));

  // ---- right now ---------------------------------------------------------
  const recent = current.filter((r) => ts(r) >= now - LIVE_MS);

  return {
    granularity,
    totals: totalsFor(current),
    previous: totalsFor(previous),
    buckets,
    pages,
    sources,
    countries,
    devices,
    loyalty,
    live: {
      visitors: new Set(recent.map((r) => r.visitor_id)).size,
      views: recent.length,
    },
  };
}

/** Percent change, or null when the previous period had nothing to compare. */
export function delta(now: number, before: number): number | null {
  if (!before) return null;
  return Math.round(((now - before) / before) * 100);
}

/** "3m 20s" / "45s" / "1h 4m" — never a bare number of seconds. */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0s";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return s ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}
