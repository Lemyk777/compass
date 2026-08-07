import Link from "@/components/ui/Link";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppHeader } from "@/components/ui/AppHeader";
import { Card } from "@/components/report/Section";
import { TrafficChart } from "@/components/admin/TrafficChart";
import {
  delta,
  formatDuration,
  summarize,
  type Summary,
  type ViewRow,
} from "@/lib/traffic/summarize";

export const dynamic = "force-dynamic";

/**
 * Site traffic — everyone who reaches Compass, not just everyone who signs up.
 *
 * /admin has always measured the top of the product and none of the funnel
 * above it: 180 signups, and no idea whether that came from 200 visitors or
 * 20,000. Every conversion rate on that page is a fraction with an unknown
 * denominator, and "is the landing page working" has never been answerable at
 * all. This page is the denominator.
 *
 * It answers three questions and refuses to pad them out:
 *
 *   how many arrive     visitors, visits, pages — with the previous equal-length
 *                       period beside each one, because a number with no
 *                       comparison is a number nobody can act on;
 *   how long they stay  visible time, measured by a beacon, so a tab left open
 *                       overnight does not read as devoted attention;
 *   do they come back   days-per-visitor, which is the only version of "return"
 *                       that cannot be faked by a reload.
 *
 * Every definition it uses lives in lib/traffic/summarize.ts, stated in prose
 * and pinned by unit tests, and each panel repeats the relevant one in a line
 * under its title. An analytics screen whose terms are unwritten gets believed
 * for six months and then quietly distrusted forever.
 */

const RANGES = [
  { days: 1, label: "24 hours" },
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
] as const;

/** Rows pulled per request. Beyond this the page reports that it is truncated
 *  rather than quietly under-counting — see the note it renders. */
const MAX_ROWS = 50_000;

const COLUMNS = [
  "visitor_id",
  "session_id",
  "user_id",
  "path",
  "referrer",
  "country",
  "device",
  "dwell_ms",
  "created_at",
].join(",");

export default async function AdminTrafficPage({
  searchParams,
}: {
  searchParams?: { d?: string };
}) {
  await requireRole("admin", "/admin/traffic");

  const days =
    RANGES.find((r) => String(r.days) === searchParams?.d)?.days ?? 7;
  const now = Date.now();
  // Twice the range: the older half is never drawn. It is what makes "new
  // visitor" mean "never seen before" and gives every headline number a
  // previous period to be compared against.
  const since = new Date(now - 2 * days * 24 * 60 * 60 * 1000).toISOString();

  const admin = createAdminClient();
  const { data, error, count } = await admin
    .from("page_views")
    .select(COLUMNS, { count: "exact" })
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(MAX_ROWS);

  const shell = (children: React.ReactNode) => (
    <main className="min-h-dvh bg-surface">
      <AppHeader
        wide
        admin
        links={[
          { href: "/admin", label: "Overview" },
          { href: "/admin/intents", label: "Commitments" },
          { href: "/admin/partners", label: "Partners" },
        ]}
      />
      <div className="mx-auto max-w-5xl px-5 py-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Site traffic
        </h1>
        <p className="mb-6 text-sm text-ink-soft">
          Everyone who reaches Compass — signed in or not. All times UTC.
        </p>
        {children}
      </div>
    </main>
  );

  // The table is created by a migration applied BY HAND. Saying so beats
  // rendering a page of confident zeroes that reads as "nobody visits us".
  if (error) return shell(<NotSetUp detail={error.message} />);

  const rows = (data ?? []) as unknown as ViewRow[];
  const truncated = (count ?? 0) > rows.length;
  const summary = summarize(rows, now, days);

  return shell(
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <RangeTabs active={days} />
        <LiveNow visitors={summary.live.visitors} views={summary.live.views} />
      </div>

      {truncated && (
        <p className="mb-4 rounded-xl border border-target/40 bg-target-soft/60 px-3 py-2 text-xs text-ink-soft">
          Showing the most recent {rows.length.toLocaleString()} of{" "}
          {(count ?? 0).toLocaleString()} page views in this window. The oldest
          are left out, so the earliest days below are undercounted.
        </p>
      )}

      {summary.totals.views === 0 ? (
        <NoTrafficYet days={days} />
      ) : (
        <TrafficReport
          summary={summary}
          rangeLabel={RANGES.find((r) => r.days === days)!.label}
        />
      )}
    </>
  );
}

function TrafficReport({
  summary,
  rangeLabel,
}: {
  summary: Summary;
  rangeLabel: string;
}) {
  const { totals, previous } = summary;
  const returnedShare = totals.visitors
    ? Math.round((totals.returned / totals.visitors) * 100)
    : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <BigStat
          label="Visitors"
          hint="distinct browsers"
          value={totals.visitors}
          change={delta(totals.visitors, previous.visitors)}
        />
        <BigStat
          label="Visits"
          hint="a new one after 30 min idle"
          value={totals.visits}
          change={delta(totals.visits, previous.visits)}
        />
        <BigStat
          label="Pages viewed"
          hint={`${totals.viewsPerVisit.toFixed(1)} per visit`}
          value={totals.views}
          change={delta(totals.views, previous.views)}
        />
        <BigStat
          label="Typical visit"
          hint={`mean ${formatDuration(totals.meanVisitSec)}`}
          text={formatDuration(totals.medianVisitSec)}
          change={delta(totals.medianVisitSec, previous.medianVisitSec)}
        />
        <BigStat
          label="Came back"
          hint={`${returnedShare}% of visitors, on 2+ days`}
          value={totals.returned}
          change={delta(totals.returned, previous.returned)}
        />
        <BigStat
          label="Left in under 10s"
          hint="one page, then gone"
          text={
            totals.bounceRate == null
              ? "—"
              : `${Math.round(totals.bounceRate * 100)}%`
          }
          change={
            totals.bounceRate == null || previous.bounceRate == null
              ? null
              : delta(
                  Math.round(totals.bounceRate * 100),
                  Math.round(previous.bounceRate * 100)
                )
          }
          goodWhenUp={false}
        />
      </div>

      <Card>
        <PanelTitle
          title="Arrivals"
          hint="Stacked by whether we had seen the visitor before. Returning is the half that compounds."
        />
        <TrafficChart
          data={summary.buckets.map((b) => ({
            label: b.label,
            newVisitors: b.newVisitors,
            returningVisitors: b.returningVisitors,
            views: b.views,
          }))}
        />
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <PanelTitle
            title="Do they come back?"
            hint={`Separate days each visitor showed up on, within the last ${rangeLabel}.`}
          />
          <Bars
            rows={summary.loyalty.map((l) => ({
              label: l.label,
              value: l.visitors,
            }))}
            total={totals.visitors}
            empty="No visitors in this window."
          />
          <p className="mt-3 text-xs leading-relaxed text-ink-soft">
            A visitor is one browser. Someone who clears cookies or switches to
            their phone counts as a new person — this undercounts returns and
            never invents them.
          </p>
        </Card>

        <Card>
          <PanelTitle
            title="Signed in or not"
            hint="Distinct visitors with an account attached to at least one view."
          />
          <Bars
            rows={[
              { label: "Signed in", value: totals.signedIn },
              {
                label: "Not signed in",
                value: Math.max(0, totals.visitors - totals.signedIn),
              },
            ]}
            total={totals.visitors}
            empty="No visitors in this window."
          />
          <p className="mt-3 text-xs leading-relaxed text-ink-soft">
            The bottom bar is the audience every conversion number on{" "}
            <Link href="/admin" className="underline hover:text-ink">
              the overview
            </Link>{" "}
            is divided by.
          </p>
        </Card>
      </div>

      <Card>
        <PanelTitle
          title="Pages"
          hint="Time is the median of what the beacon reported, so a page nobody stayed on shows it."
        />
        <PagesTable rows={summary.pages.slice(0, 25)} />
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <PanelTitle
            title="Where visits started"
            hint="One source per visit — the first external referrer it had."
          />
          <Bars
            rows={summary.sources.slice(0, 12).map((s) => ({
              label: s.source,
              value: s.visits,
            }))}
            total={totals.visits}
            empty="Nothing yet."
          />
        </Card>

        <div className="space-y-5">
          <Card>
            <PanelTitle title="Countries" hint="Distinct visitors." />
            <Bars
              rows={summary.countries.slice(0, 8).map((c) => ({
                label: c.country,
                value: c.visitors,
              }))}
              total={totals.visitors}
              empty="Not recorded — the country header only exists in production."
            />
          </Card>
          <Card>
            <PanelTitle title="Devices" hint="Distinct visitors." />
            <Bars
              rows={summary.devices.map((d) => ({
                label: d.device,
                value: d.visitors,
              }))}
              total={totals.visitors}
              empty="Nothing yet."
            />
          </Card>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function RangeTabs({ active }: { active: number }) {
  return (
    <nav
      aria-label="Time range"
      className="inline-flex items-center rounded-full border border-line bg-card p-0.5"
    >
      {RANGES.map((r) => {
        const on = r.days === active;
        return (
          <Link
            key={r.days}
            href={`/admin/traffic?d=${r.days}`}
            aria-current={on ? "page" : undefined}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus-visible:focus-ring ${
              on ? "bg-ink text-white" : "text-ink-soft hover:text-ink"
            }`}
          >
            {r.label}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * The last 30 minutes. Not a live feed — the page is server-rendered and
 * refreshes when you reload it, and pretending otherwise with a pulsing dot
 * would be the kind of decoration that makes the rest of the numbers suspect.
 */
function LiveNow({ visitors, views }: { visitors: number; views: number }) {
  return (
    <p className="text-xs text-ink-soft">
      Last 30 minutes:{" "}
      <span data-num className="font-semibold text-ink">
        {visitors}
      </span>{" "}
      {visitors === 1 ? "visitor" : "visitors"},{" "}
      <span data-num className="font-semibold text-ink">
        {views}
      </span>{" "}
      {views === 1 ? "page" : "pages"}
    </p>
  );
}

function BigStat({
  label,
  hint,
  value,
  text,
  change,
  goodWhenUp = true,
}: {
  label: string;
  hint?: string;
  value?: number;
  text?: string;
  change: number | null;
  goodWhenUp?: boolean;
}) {
  const good = change != null && change !== 0 && change > 0 === goodWhenUp;
  return (
    <div className="rounded-2xl border border-line bg-card p-4 shadow-card">
      <div className="flex items-baseline justify-between gap-2">
        <span data-num className="font-display text-3xl font-semibold text-ink">
          {text ?? (value ?? 0).toLocaleString()}
        </span>
        {change != null && change !== 0 && (
          <span
            data-num
            className={`text-xs font-medium ${good ? "text-likely" : "text-reach"}`}
            title="vs the previous period of the same length"
          >
            {change > 0 ? "+" : ""}
            {change}%
          </span>
        )}
      </div>
      <div className="mt-0.5 text-xs font-medium text-ink">{label}</div>
      {hint && <div className="mt-0.5 text-xs text-ink-faint">{hint}</div>}
    </div>
  );
}

function PanelTitle({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">{hint}</p>
    </div>
  );
}

/**
 * A proportional list. Deliberately not a pie chart: these are rankings that
 * usually have one dominant row and a long tail, and a bar you can read the
 * exact number off answers "how many" as well as "what share".
 */
function Bars({
  rows,
  total,
  empty,
}: {
  rows: { label: string; value: number }[];
  total: number;
  empty: string;
}) {
  const shown = rows.filter((r) => r.value > 0);
  if (!shown.length) return <p className="text-sm text-ink-faint">{empty}</p>;
  const top = Math.max(...shown.map((r) => r.value), 1);
  return (
    <ul className="space-y-2.5">
      {shown.map((r) => (
        <li key={r.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-ink" title={r.label}>
              {r.label}
            </span>
            <span data-num className="shrink-0 text-ink-soft">
              {r.value.toLocaleString()}
              {total > 0 && (
                <span className="ml-1.5 text-xs text-ink-faint">
                  {Math.round((r.value / total) * 100)}%
                </span>
              )}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${Math.max(2, Math.round((r.value / top) * 100))}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function PagesTable({
  rows,
}: {
  rows: Summary["pages"];
}) {
  if (!rows.length) return <p className="text-sm text-ink-faint">Nothing yet.</p>;
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-[34rem] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs text-ink-faint">
            <th className="px-1 pb-2 font-medium">Page</th>
            <th className="px-1 pb-2 text-right font-medium">Views</th>
            <th className="px-1 pb-2 text-right font-medium">Visitors</th>
            <th className="px-1 pb-2 text-right font-medium">Median time</th>
            <th className="px-1 pb-2 text-right font-medium">Started here</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.path} className="border-b border-line/60 last:border-0">
              <td className="max-w-[18rem] truncate px-1 py-2 text-ink" title={p.path}>
                {p.path}
              </td>
              <td data-num className="px-1 py-2 text-right text-ink-soft">
                {p.views.toLocaleString()}
              </td>
              <td data-num className="px-1 py-2 text-right text-ink-soft">
                {p.visitors.toLocaleString()}
              </td>
              <td data-num className="px-1 py-2 text-right text-ink-soft">
                {p.medianSec == null ? "—" : formatDuration(p.medianSec)}
              </td>
              <td data-num className="px-1 py-2 text-right text-ink-soft">
                {p.entries.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Zero rows, table present. Says which of the two possible causes it is. */
function NoTrafficYet({ days }: { days: number }) {
  return (
    <Card>
      <h2 className="text-base font-semibold text-ink">
        No page views in the last {days === 1 ? "24 hours" : `${days} days`}
      </h2>
      <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-ink-soft">
        <li>
          The table exists and is readable, so this is either genuinely no
          traffic or the tracker has only just been deployed — rows start
          appearing on the next real page load.
        </li>
        <li>
          Views from <code className="text-xs">localhost</code> and{" "}
          <code className="text-xs">*.vercel.app</code> previews are not
          recorded, and neither is anything under{" "}
          <code className="text-xs">/admin</code>. Set{" "}
          <code className="text-xs">TRACK_LOCAL=1</code> to record local ones
          while testing.
        </li>
      </ul>
    </Card>
  );
}

/** The migration is applied by hand, so this is a real state, not an edge case. */
function NotSetUp({ detail }: { detail: string }) {
  return (
    <Card>
      <h2 className="text-base font-semibold text-ink">Not set up yet</h2>
      <p className="mt-1 text-sm leading-relaxed text-ink-soft">
        The <code className="text-xs">page_views</code> table is missing or
        unreadable, so there is nothing to report. Apply{" "}
        <code className="text-xs">supabase/migrations/0025_traffic.sql</code> in
        the Supabase SQL editor, then run{" "}
        <code className="text-xs">npm run db:check</code> to confirm.
      </p>
      <p className="mt-3 rounded-xl bg-surface px-3 py-2 font-mono text-xs text-ink-faint">
        {detail}
      </p>
    </Card>
  );
}
