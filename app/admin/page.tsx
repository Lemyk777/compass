import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppHeader } from "@/components/ui/AppHeader";
import { Card } from "@/components/report/Section";
import { SignupsOverTime, SignupsByCountry } from "@/components/admin/AdminCharts";
import { getT } from "@/lib/i18n/server";
import {
  analysisCostUSD,
  hasUsage,
  EST_COST_PER_ANALYSIS,
} from "@/lib/ai/cost";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireRole("admin", "/admin");
  const t = getT();
  const admin = createAdminClient();

  const [
    { data: profiles },
    { data: analyses, error: analysesErr },
    { data: ambassadors },
    { count: referredCount },
    { data: stepEvents },
  ] = await Promise.all([
    admin.from("profiles").select("id, country, created_at"),
    admin.from("analyses").select("user_id, created_at, usage"),
    admin.from("ambassadors").select("user_id"),
    admin
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("type", "signup")
      .not("ref_code", "is", null),
    // Onboarding funnel: every "onboarding_step:<key>" event (see logOnboardingStep).
    admin.from("events").select("user_id, type").like("type", "onboarding_step:%"),
  ]);

  const users = profiles ?? [];

  // `usage` arrives in migration 0007. Until it's applied, PostgREST rejects
  // the WHOLE select above (one unknown column fails the request), which used
  // to silently zero every analysis metric and report all users as "never
  // analyzed". If that happens, retry with only the always-present columns so
  // the user counts stay correct; cost then falls back to the per-analysis
  // estimate (rows simply look like they predate 0007).
  let runs = analyses ?? [];
  if (analysesErr) {
    console.error("admin: analyses select failed; retrying without usage", analysesErr);
    const { data: fallback } = await admin
      .from("analyses")
      .select("user_id, created_at");
    runs = (fallback ?? []).map((r) => ({ ...r, usage: null }));
  }
  const ambassadorCount = ambassadors?.length ?? 0;
  const referredSignups = referredCount ?? 0;

  const totalUsers = users.length;
  const totalAnalyses = runs.length;

  // Active vs one-time: analyses per user.
  const perUser = new Map<string, number>();
  for (const r of runs) perUser.set(r.user_id, (perUser.get(r.user_id) ?? 0) + 1);
  const analyzedUsers = perUser.size;
  const returningUsers = [...perUser.values()].filter((n) => n >= 2).length;
  const oneTimeUsers = [...perUser.values()].filter((n) => n === 1).length;

  // Signups by country.
  const byCountry = new Map<string, number>();
  for (const u of users) {
    const c = (u.country ?? "").trim() || "Unknown";
    byCountry.set(c, (byCountry.get(c) ?? 0) + 1);
  }
  const countryData = [...byCountry.entries()]
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Signups over the last 14 days.
  const days: { day: string; count: number }[] = [];
  const buckets = new Map<string, number>();
  for (const u of users) {
    if (!u.created_at) continue;
    const key = u.created_at.slice(0, 10);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ day: key.slice(5), count: buckets.get(key) ?? 0 });
  }

  // Real cost from recorded token usage where present (Haiku 4.5 pricing),
  // else the per-analysis estimate for rows predating migration 0007.
  const totalCost = runs.reduce(
    (sum, r) =>
      sum + (hasUsage(r.usage) ? analysisCostUSD(r.usage) : EST_COST_PER_ANALYSIS),
    0
  );
  const estCost = totalCost.toFixed(2);
  const perAnalysis = (totalAnalyses > 0 ? totalCost / totalAnalyses : 0).toFixed(3);

  // Onboarding funnel: distinct users who reached each step (instrumented via
  // logOnboardingStep). The drop between consecutive bars is the abandonment
  // cliff — the whole point of this instrumentation.
  const FUNNEL_STEPS: { key: string; label: string }[] = [
    { key: "origin", label: "Origin" },
    { key: "destinations", label: "Destinations" },
    { key: "faculties", label: "Faculties" },
    { key: "grades", label: "Grades" },
    { key: "tests", label: "Tests" },
    { key: "activities", label: "Activities" },
    { key: "honors", label: "Honors" },
    { key: "review", label: "Review" },
  ];
  const stepUsers = new Map<string, Set<string>>();
  for (const e of stepEvents ?? []) {
    const key = String(e.type).slice("onboarding_step:".length);
    if (!stepUsers.has(key)) stepUsers.set(key, new Set());
    if (e.user_id) stepUsers.get(key)!.add(e.user_id as string);
  }
  const funnel = [
    ...FUNNEL_STEPS.map((s) => ({ label: s.label, count: stepUsers.get(s.key)?.size ?? 0 })),
    { label: "Analyzed", count: analyzedUsers },
  ];
  const funnelBase = Math.max(funnel[0]?.count ?? 0, 1);
  const hasFunnelData = (stepEvents?.length ?? 0) > 0;

  return (
    <main className="min-h-dvh bg-surface">
      <AppHeader
        admin
        links={[
          { href: "/admin/ambassadors", label: t("admin.ambassadors") },
          { href: "/dashboard", label: t("common.dashboard") },
        ]}
      />
      <div className="mx-auto max-w-2xl px-5 py-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {t("admin.title")}
        </h1>
        <p className="mb-6 text-sm text-ink-soft">{t("admin.sub")}</p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label={t("admin.totalUsers")} value={totalUsers} />
          <Stat label={t("admin.analysesRun")} value={totalAnalyses} />
          <Stat label={t("admin.analyzed")} value={analyzedUsers} />
          <Stat label={t("admin.returning")} value={returningUsers} />
          <Stat label={t("admin.oneTime")} value={oneTimeUsers} />
          <Stat
            label={t("admin.neverAnalyzed")}
            value={Math.max(0, totalUsers - analyzedUsers)}
          />
        </div>

        <Link
          href="/admin/ambassadors"
          className="group mt-6 block rounded-2xl border border-line bg-card p-4 shadow-card transition-colors hover:border-accent/40 focus-visible:focus-ring"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-ink">
                {t("admin.ambassadors")}
              </h2>
              <p className="mt-0.5 text-xs text-ink-soft">{t("admin.ambSub")}</p>
            </div>
            <span className="shrink-0 text-ink-faint transition-colors group-hover:text-accent">
              →
            </span>
          </div>
          <div className="mt-3 flex gap-6">
            <div>
              <span data-num className="font-display text-2xl font-semibold text-ink">
                {ambassadorCount}
              </span>
              <span className="ml-1.5 text-xs text-ink-soft">
                {t("admin.ambCount")}
              </span>
            </div>
            <div>
              <span data-num className="font-display text-2xl font-semibold text-accent">
                {referredSignups}
              </span>
              <span className="ml-1.5 text-xs text-ink-soft">
                {t("admin.ambReferred")}
              </span>
            </div>
          </div>
        </Link>

        <div className="mt-6 space-y-6">
          <Card>
            <h2 className="text-base font-semibold text-ink">Onboarding funnel</h2>
            <p className="mb-3 mt-0.5 text-xs text-ink-soft">
              Distinct users reaching each step → where they drop off.
            </p>
            {hasFunnelData ? (
              <Funnel rows={funnel} base={funnelBase} />
            ) : (
              <p className="text-sm text-ink-faint">
                Collecting data — bars fill once users move through onboarding.
              </p>
            )}
          </Card>

          <Card>
            <h2 className="mb-3 text-base font-semibold text-ink">
              {t("admin.signups14")}
            </h2>
            <SignupsOverTime data={days} />
          </Card>

          <Card>
            <h2 className="mb-3 text-base font-semibold text-ink">
              {t("admin.signupsByCountry")}
            </h2>
            <SignupsByCountry data={countryData} />
          </Card>

          <Card>
            <h2 className="text-base font-semibold text-ink">
              {t("admin.estCost")}
            </h2>
            <p data-num className="mt-1 font-display text-3xl font-semibold text-ink">
              ~${estCost}
            </p>
            <p data-num className="mt-1 text-sm text-ink-soft">
              ~${perAnalysis}{" "}
              <span className="text-ink-faint">{t("admin.estCostPer")}</span>
            </p>
            <p className="mt-2 text-xs leading-relaxed text-ink-soft">
              {t("admin.estCostBody")}
            </p>
          </Card>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-4 shadow-card">
      <div data-num className="font-display text-3xl font-semibold text-ink">
        {value}
      </div>
      <div className="mt-0.5 text-xs text-ink-soft">{label}</div>
    </div>
  );
}

function Funnel({
  rows,
  base,
}: {
  rows: { label: string; count: number }[];
  base: number;
}) {
  return (
    <ul className="space-y-2.5">
      {rows.map((r, i) => {
        const pct = Math.min(100, Math.round((r.count / base) * 100));
        const prev = i > 0 ? rows[i - 1].count : r.count;
        const drop = prev > 0 ? Math.round(((prev - r.count) / prev) * 100) : 0;
        return (
          <li key={r.label}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="text-ink">{r.label}</span>
              <span data-num className="text-ink-soft">
                {r.count}
                {i > 0 && drop > 0 && (
                  <span className="ml-2 text-xs text-reach">−{drop}%</span>
                )}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-accent transition-[width]"
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
