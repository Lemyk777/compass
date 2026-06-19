import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppHeader } from "@/components/ui/AppHeader";
import { Card } from "@/components/report/Section";
import { SignupsOverTime, SignupsByCountry } from "@/components/admin/AdminCharts";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

// Rough per-analysis cost for claude-haiku-4-5 with prompt caching
// (cached input + ~1.8k output tokens). FOUNDER: refine against real usage;
// the hard spend cap lives in the Anthropic console, not here.
const EST_COST_PER_ANALYSIS = 0.012;

export default async function AdminPage() {
  await requireRole("admin", "/admin");
  const t = getT();
  const admin = createAdminClient();

  const [{ data: profiles }, { data: analyses }] = await Promise.all([
    admin.from("profiles").select("id, country, created_at"),
    admin.from("analyses").select("user_id, created_at"),
  ]);

  const users = profiles ?? [];
  const runs = analyses ?? [];

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

  const estCost = (totalAnalyses * EST_COST_PER_ANALYSIS).toFixed(2);

  return (
    <main className="min-h-dvh bg-surface">
      <AppHeader links={[{ href: "/dashboard", label: t("common.dashboard") }]} />
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

        <div className="mt-6 space-y-6">
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
