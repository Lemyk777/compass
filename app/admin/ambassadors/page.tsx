import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppHeader } from "@/components/ui/AppHeader";
import { Card } from "@/components/report/Section";
import {
  AmbassadorLeaderboard,
  type AmbassadorRow,
} from "@/components/admin/AmbassadorLeaderboard";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

type Admin = ReturnType<typeof createAdminClient>;

/** Best-effort user_id → email map via the auth admin API (server-only). */
async function loadEmails(
  admin: Admin,
  userIds: string[]
): Promise<Map<string, string | null>> {
  const want = new Set(userIds);
  const map = new Map<string, string | null>();
  if (!want.size) return map;
  try {
    for (let page = 1; page <= 25 && map.size < want.size; page++) {
      const { data, error } = await admin.auth.admin.listUsers({
        page,
        perPage: 200,
      });
      if (error || !data) break;
      for (const u of data.users) {
        if (want.has(u.id)) map.set(u.id, u.email ?? null);
      }
      if (data.users.length < 200) break;
    }
  } catch {
    // Non-fatal: identity falls back to name → code.
  }
  return map;
}

export default async function AdminAmbassadorsPage() {
  await requireRole("admin", "/admin/ambassadors");
  const t = getT();
  const admin = createAdminClient();

  const [{ data: ambassadors }, { data: events }, { data: profiles }] =
    await Promise.all([
      admin
        .from("ambassadors")
        .select("user_id, code, country, status, signups"),
      admin.from("events").select("ref_code").eq("type", "signup"),
      admin.from("profiles").select("id, full_name"),
    ]);

  const ambs = ambassadors ?? [];

  // Authoritative live count per referral code from the event log — the same
  // source the ambassador's own page reads via signup_count_for_code().
  const counts = new Map<string, number>();
  for (const e of events ?? []) {
    if (!e.ref_code) continue;
    counts.set(e.ref_code, (counts.get(e.ref_code) ?? 0) + 1);
  }

  const nameById = new Map<string, string | null>();
  for (const p of profiles ?? []) nameById.set(p.id, p.full_name ?? null);

  const emailById = await loadEmails(
    admin,
    ambs.map((a) => a.user_id)
  );

  const rows: AmbassadorRow[] = ambs
    .map((a) => ({
      code: a.code,
      country: a.country ?? null,
      status: a.status ?? "active",
      name: nameById.get(a.user_id) ?? null,
      email: emailById.get(a.user_id) ?? null,
      count: counts.get(a.code) ?? a.signups ?? 0,
    }))
    .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code));

  const totalAmbassadors = rows.length;
  const totalReferred = rows.reduce((s, r) => s + r.count, 0);
  const activeCount = rows.filter((r) => r.status === "active").length;

  return (
    <main className="min-h-dvh bg-surface">
      <AppHeader
        admin
        links={[
          { href: "/admin", label: t("admin.metrics") },
          { href: "/dashboard", label: t("common.dashboard") },
        ]}
      />
      <div className="mx-auto max-w-2xl px-5 py-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {t("admin.ambTitle")}
        </h1>
        <p className="mb-6 text-sm text-ink-soft">{t("admin.ambSub")}</p>

        <div className="grid grid-cols-3 gap-3">
          <Stat label={t("admin.ambCount")} value={totalAmbassadors} />
          <Stat label={t("admin.ambReferred")} value={totalReferred} />
          <Stat label={t("admin.ambActiveStat")} value={activeCount} />
        </div>

        <div className="mt-6">
          <Card>
            <AmbassadorLeaderboard rows={rows} />
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
