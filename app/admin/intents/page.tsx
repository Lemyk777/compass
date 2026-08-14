import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppHeader } from "@/components/ui/AppHeader";
import { Card } from "@/components/report/Section";
import { getT } from "@/lib/i18n/server";
import { START_OPTIONS } from "@/lib/data/intents";
import {
  COMPETITION_BY_ID,
  opportunityCost,
  type Competition,
} from "@/lib/data/key-dates";

export const dynamic = "force-dynamic";

// The commitment funnel — the one screen that makes every mechanic in
// OPPORTUNITIES_PLAN.md checkable.
//
// The plan's own reality check says it plainly: `opportunity_intents` is called
// the only behavioural metric this product has, and nothing reads it. Three
// shipped mechanics (implementation intention, self-generated relevance,
// endowed progress) are all justified by "converts better" and none of them can
// be confirmed. So this page deliberately answers behaviour questions, not
// engagement ones:
//
//   • how many students said "I'm doing this" at all, and how many then said
//     they actually entered — the whole nudge literature's cautionary tale is
//     that clicks moved and behaviour did not;
//   • WHAT they commit to, so we can see whether the catalog's recommendations
//     match what a real student picks;
//   • what they DROP, which is as informative as what they enter;
//   • whether they only ever pick the free ones — now answerable, because cost
//     became a real field on every opportunity.
//
// It must read correctly at zero. At ~180 signups most of these numbers start
// empty, and an admin screen that looks broken when the honest answer is "no
// data yet" gets distrusted exactly when it starts to matter.

type IntentRow = {
  user_id: string;
  opportunity_id: string;
  status: string;
  start_when: string | null;
  why_matters?: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export default async function AdminIntentsPage() {
  await requireRole("admin", "/admin/intents");
  const t = getT();
  const admin = createAdminClient();

  // `select("*")` rather than a column list on purpose: `why_matters` arrives
  // in migration 0023, and naming an unapplied column fails the WHOLE request
  // in PostgREST — which would zero every number on this page and look like
  // "nobody has committed to anything" (the same trap migration 0007 sprang on
  // the analyses metrics — see app/admin/page.tsx).
  const [
    { data: intentRows, error: intentsErr },
    { data: profiles },
    { data: studentProfiles },
    { data: analysisRows },
  ] = await Promise.all([
    admin.from("opportunity_intents").select("*"),
    admin.from("profiles").select("id"),
    admin
      .from("student_profiles")
      .select("user_id, graduation_year, faculties, activities"),
    // Who opted into the full admission report. Since signup now lands on
    // Opportunities and the report is opt-in (not a forced questionnaire), this
    // is THE conversion to watch — did making it optional keep report completion,
    // or quietly kill it? One row is enough to count a user as converted.
    admin.from("analyses").select("user_id"),
  ]);

  const intents = (intentRows ?? []) as IntentRow[];
  // 0022 not applied (or the table is otherwise unreadable) — say which, rather
  // than rendering a page full of confident zeroes.
  const tableMissing = Boolean(intentsErr);

  const totalUsers = profiles?.length ?? 0;

  // Profile completion — the "44% filled in nothing" number the plan keeps
  // citing, measured rather than remembered.
  const sp = studentProfiles ?? [];
  const withProfile = sp.length;
  const withYear = sp.filter((p) => p.graduation_year != null).length;
  const withFaculties = sp.filter(
    (p) => Array.isArray(p.faculties) && p.faculties.length > 0,
  ).length;
  const withActivities = sp.filter(
    (p) => Array.isArray(p.activities) && p.activities.length > 0,
  ).length;
  // Distinct users who ran the full report at least once — the opt-in the new
  // signup flow bets on. Counted by user, not by analysis row (one student can
  // re-run it many times).
  const withReport = new Set(
    (analysisRows ?? []).map((a) => a.user_id as string),
  ).size;

  const byStatus = (s: string) => intents.filter((i) => i.status === s);
  const planning = byStatus("planning");
  // `doing` arrived with the planner (migration 0028). It is counted separately
  // rather than folded into "planning" on purpose: the whole reason it exists is
  // that we could not previously see the gap between saying you would start and
  // starting, and a state that is invisible here is a state we did not add.
  const doing = byStatus("doing");
  const applied = byStatus("applied");
  const dropped = byStatus("dropped");
  const committedUsers = new Set(intents.map((i) => i.user_id)).size;
  const appliedUsers = new Set(applied.map((i) => i.user_id)).size;

  // The conversion the mechanics are supposed to move: of everyone who said
  // "I'm doing this", how many came back and said they actually entered.
  const conversion =
    intents.length > 0
      ? Math.round((applied.length / intents.length) * 100)
      : 0;

  // Days from commitment to "I entered it". Median, not mean — with a handful
  // of rows one late finisher would swing an average completely.
  const lags = applied
    .map((i) =>
      i.created_at && i.updated_at
        ? (new Date(i.updated_at).getTime() -
            new Date(i.created_at).getTime()) /
          86_400_000
        : null,
    )
    .filter((n): n is number => n != null && n >= 0)
    .sort((a, b) => a - b);
  const medianLag =
    lags.length > 0 ? lags[Math.floor(lags.length / 2)].toFixed(1) : null;

  // The behavioural funnel, widest first. Each step is a real state a student
  // reached, not a page they loaded.
  const funnel = [
    { label: "Signed up", count: totalUsers },
    { label: "Started a profile", count: withProfile },
    { label: "Told us their year", count: withYear },
    { label: "Said “I’m doing this”", count: committedUsers },
    { label: "Said they entered", count: appliedUsers },
  ];
  const funnelBase = Math.max(funnel[0].count, 1);

  // What students actually commit to, most-committed first.
  const perOpportunity = new Map<
    string,
    { planning: number; doing: number; applied: number; dropped: number }
  >();
  for (const i of intents) {
    const row = perOpportunity.get(i.opportunity_id) ?? {
      planning: 0,
      doing: 0,
      applied: 0,
      dropped: 0,
    };
    if (i.status === "applied") row.applied++;
    else if (i.status === "dropped") row.dropped++;
    else if (i.status === "doing") row.doing++;
    else row.planning++;
    perOpportunity.set(i.opportunity_id, row);
  }
  const topOpportunities = [...perOpportunity.entries()]
    .map(([id, counts]) => {
      const c: Competition | undefined = COMPETITION_BY_ID.get(id);
      return {
        id,
        name: c?.name ?? id,
        // A retired or discovered id has no catalog row — say so instead of
        // rendering a bare key that looks like a bug.
        known: Boolean(c),
        cost: c ? opportunityCost(c) : null,
        total: counts.planning + counts.doing + counts.applied + counts.dropped,
        ...counts,
      };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 15);

  // Which moment they name. If everyone picks "next week", the near-term
  // framing of the options is doing nothing.
  const whenCounts = new Map<string, number>();
  for (const i of intents) {
    const key = (i.start_when ?? "").trim().toLowerCase() || "(not answered)";
    whenCounts.set(key, (whenCounts.get(key) ?? 0) + 1);
  }
  const whenRows = [
    ...START_OPTIONS.map((o) => ({ label: o, count: whenCounts.get(o) ?? 0 })),
    { label: "(not answered)", count: whenCounts.get("(not answered)") ?? 0 },
  ];

  // Do they only ever pick the free ones? The catalog knows what each costs, so
  // this is now answerable — and it is the sharpest test of whether our
  // recommendations are reachable for the students we actually serve.
  const costMix = new Map<string, number>();
  for (const i of intents) {
    const c = COMPETITION_BY_ID.get(i.opportunity_id);
    if (!c) continue;
    const label = opportunityCost(c).short;
    costMix.set(label, (costMix.get(label) ?? 0) + 1);
  }
  const costRows = [...costMix.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  // Migration 0023 ships the column; until it is applied the property is simply
  // absent on every row, which is a different thing from "nobody wrote one".
  const whyColumnLive = intents.some((i) => "why_matters" in i);
  const whyFilled = intents.filter((i) => i.why_matters).length;

  return (
    <main className="min-h-dvh bg-surface">
      <AppHeader
        admin
        links={[
          { href: "/admin", label: t("admin.title") },
          { href: "/admin/opportunities", label: t("admin.opps") },
          { href: "/dashboard", label: t("common.dashboard") },
        ]}
      />
      <div className="mx-auto max-w-2xl px-5 py-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Commitments
        </h1>
        <p className="mb-6 text-sm text-ink-soft">
          What students said they would do, and whether they did it — the only
          behavioural signal this product collects.
        </p>

        {tableMissing ? (
          <Card>
            <h2 className="text-base font-semibold text-ink">
              Not reading the table
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              <code className="text-xs">opportunity_intents</code> could not be
              read. If this database predates the feature, apply{" "}
              <code className="text-xs">0022_opportunity_intents.sql</code> in
              the Supabase SQL editor. Everything below would otherwise show
              zeroes that look like real answers.
            </p>
            <p className="mt-2 text-xs text-ink-faint">{intentsErr?.message}</p>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat label="Commitments" value={intents.length} />
              <Stat label="Students committing" value={committedUsers} />
              <Stat label="Entered it" value={applied.length} />
              <Stat label="Still planning" value={planning.length} />
              <Stat label="Started" value={doing.length} />
              <Stat label="Dropped" value={dropped.length} />
              <Stat label="Planning → entered" value={`${conversion}%`} />
            </div>

            {intents.length === 0 && (
              <p className="mt-3 text-sm text-ink-faint">
                No commitments recorded yet. The numbers below stay at zero
                until a student presses &ldquo;I&rsquo;m doing this&rdquo; on
                the dashboard shortlist — it is hidden in <code>/demo</code>,
                which has no session to save one.
              </p>
            )}

            <div className="mt-6 space-y-6">
              <Card>
                <h2 className="text-base font-semibold text-ink">
                  Behavioural funnel
                </h2>
                <p className="mb-3 mt-0.5 text-xs text-ink-soft">
                  Each step is a state a student actually reached — not a page
                  they opened.
                </p>
                <Bars rows={funnel} base={funnelBase} />
              </Card>

              <Card>
                <h2 className="text-base font-semibold text-ink">
                  Profile completion
                </h2>
                <p className="mb-3 mt-0.5 text-xs text-ink-soft">
                  Of {totalUsers} signups. Signup now lands on Opportunities and
                  the full report is opt-in, so &ldquo;Ran the full
                  report&rdquo; is the conversion to watch — not a step everyone
                  is pushed through. Without a graduation year no age or grade
                  rule can fire, so those students see an unfiltered catalog.
                </p>
                <Bars
                  rows={[
                    { label: "Started a profile", count: withProfile },
                    { label: "Graduation year", count: withYear },
                    { label: "Field of study", count: withFaculties },
                    { label: "Any activity", count: withActivities },
                    { label: "Ran the full report", count: withReport },
                  ]}
                  base={Math.max(totalUsers, 1)}
                />
              </Card>

              <Card>
                <h2 className="text-base font-semibold text-ink">
                  What they commit to
                </h2>
                <p className="mb-3 mt-0.5 text-xs text-ink-soft">
                  Most-committed first. &ldquo;Dropped&rdquo; is as informative
                  as &ldquo;entered&rdquo;.
                </p>
                {topOpportunities.length === 0 ? (
                  <p className="text-sm text-ink-faint">Nothing yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {topOpportunities.map((o) => (
                      <li
                        key={o.id}
                        className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-line pb-2 last:border-0 last:pb-0"
                      >
                        <span className="min-w-0 text-sm text-ink">
                          {o.name}
                          {!o.known && (
                            <span className="ml-1.5 text-xs text-ink-faint">
                              (not in the catalog — retired or discovered id)
                            </span>
                          )}
                          {o.cost && (
                            <span className="ml-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                              {o.cost.short}
                            </span>
                          )}
                        </span>
                        <span
                          data-num
                          className="shrink-0 text-xs tabular-nums text-ink-soft"
                        >
                          {o.planning} planning · {o.doing} started ·{" "}
                          {o.applied} entered · {o.dropped} dropped
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card>
                <h2 className="text-base font-semibold text-ink">
                  Does cost decide it?
                </h2>
                <p className="mb-3 mt-0.5 text-xs text-ink-soft">
                  Commitments by what the opportunity costs. If students only
                  ever pick the free ones, the paid half of the catalog is
                  decoration for the audience we serve.
                </p>
                {costRows.length === 0 ? (
                  <p className="text-sm text-ink-faint">Nothing yet.</p>
                ) : (
                  <Bars
                    rows={costRows.map((r) => ({
                      label: r.label,
                      count: r.count,
                    }))}
                    base={Math.max(...costRows.map((r) => r.count), 1)}
                  />
                )}
              </Card>

              <Card>
                <h2 className="text-base font-semibold text-ink">
                  When they said they&rsquo;d start
                </h2>
                <p className="mb-3 mt-0.5 text-xs text-ink-soft">
                  The implementation intention. All four options are
                  deliberately near-term — an intention set for
                  &ldquo;sometime&rdquo; is not one.
                </p>
                <Bars
                  rows={whenRows}
                  base={Math.max(...whenRows.map((r) => r.count), 1)}
                />
                <p className="mt-3 text-xs text-ink-soft">
                  {whyColumnLive ? (
                    <>
                      <span data-num className="font-semibold text-ink">
                        {whyFilled}
                      </span>{" "}
                      of {intents.length} also wrote why it matters to them.
                    </>
                  ) : (
                    <>
                      The &ldquo;why does this matter to you?&rdquo; line is not
                      stored yet — apply{" "}
                      <code className="text-xs">
                        0023_intent_why_matters.sql
                      </code>
                      .
                    </>
                  )}
                </p>
              </Card>

              {medianLag && (
                <Card>
                  <h2 className="text-base font-semibold text-ink">
                    Commitment → entry
                  </h2>
                  <p
                    data-num
                    className="mt-1 font-display text-3xl font-semibold text-ink"
                  >
                    {medianLag} days
                  </p>
                  <p className="mt-1 text-xs text-ink-soft">
                    Median across {lags.length} entries. Judge the mechanics on
                    this and on the funnel above — never on session counts.
                  </p>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-4 shadow-card">
      <div data-num className="font-display text-3xl font-semibold text-ink">
        {value}
      </div>
      <div className="mt-0.5 text-xs text-ink-soft">{label}</div>
    </div>
  );
}

/** Horizontal bars — the same shape as the onboarding funnel on /admin. */
function Bars({
  rows,
  base,
}: {
  rows: { label: string; count: number }[];
  base: number;
}) {
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <span className="w-40 shrink-0 truncate text-xs text-ink-soft">
            {r.label}
          </span>
          <div className="h-6 flex-1 overflow-hidden rounded-md bg-surface">
            <div
              className="h-full rounded-md bg-accent/80 transition-[width] duration-500"
              style={{ width: `${Math.round((r.count / base) * 100)}%` }}
            />
          </div>
          <span
            data-num
            className="w-10 shrink-0 text-right text-xs tabular-nums text-ink"
          >
            {r.count}
          </span>
        </div>
      ))}
    </div>
  );
}
