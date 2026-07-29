import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppHeader } from "@/components/ui/AppHeader";
import { Card } from "@/components/report/Section";
import { getT } from "@/lib/i18n/server";
import { facultyLabel } from "@/lib/data/faculties";
import { regionLabel } from "@/lib/data/geo";
import { resolveCompetitions, type Competition } from "@/lib/data/key-dates";
import { approveCandidate, rejectCandidate } from "./actions";

export const dynamic = "force-dynamic";

type CandidateRecord = {
  id: string;
  name: string;
  url: string;
  fields: string[] | "all";
  level: string;
  category: string;
  tier: string;
  deadline: string | null;
  event_window: string;
  blurb: string;
  eligibility: string | null;
  date_confirmed: boolean;
  date_evidence: string;
  source: string;
  region: string | null;
  city: string | null;
  status: string;
  discovered_at: string;
};

function daysFromToday(iso: string): number {
  return Math.round((new Date(iso + "T00:00:00Z").getTime() - Date.now()) / 86_400_000);
}

function fieldsLabel(fields: string[] | "all"): string {
  if (fields === "all") return "All fields";
  return fields.map(facultyLabel).join(", ");
}

export default async function AdminOpportunitiesPage() {
  await requireRole("admin", "/admin/opportunities");
  const t = getT();
  const admin = createAdminClient();

  // Both queries tolerate the table not existing yet (migration 0020 pending):
  // an error just renders the empty state.
  const [{ data: candRows }, { data: liveRows }] = await Promise.all([
    admin
      .from("competition_candidates")
      .select("*")
      .order("discovered_at", { ascending: false }),
    admin.from("competition_deadlines").select("*"),
  ]);

  const candidates = (candRows ?? []) as CandidateRecord[];
  const pending = candidates.filter((c) => c.status === "pending");
  const approvedCount = candidates.filter((c) => c.status === "approved").length;
  const rejectedCount = candidates.filter((c) => c.status === "rejected").length;

  // ── Date + link health: the same merge the student dashboard performs ─────
  const linkById = new Map<string, { ok: boolean | null; detail: string | null }>();
  for (const r of (liveRows ?? []) as Record<string, unknown>[]) {
    linkById.set(r.id as string, {
      ok: (r.link_ok as boolean | null) ?? null,
      detail: (r.link_detail as string | null) ?? null,
    });
  }
  const updatedAtById = new Map<string, string | null>();
  const liveComps: Competition[] = (liveRows ?? []).map((r: Record<string, unknown>) => {
    updatedAtById.set(r.id as string, (r.updated_at as string | null) ?? null);
    return {
      id: r.id as string,
      name: r.name as string,
      fields: r.fields as Competition["fields"],
      deadline: r.deadline as string,
      window: r.event_window as string,
      level: r.level as Competition["level"],
      url: r.url as string,
      blurb: r.blurb as string,
      dateConfirmed: r.date_confirmed === true,
    };
  });
  const health = resolveCompetitions(liveComps)
    .map((c) => ({
      id: c.id,
      name: c.name,
      url: c.url,
      deadline: c.deadline,
      confirmed: c.dateConfirmed === true,
      days: daysFromToday(c.deadline),
      updatedAt: updatedAtById.get(c.id) ?? null,
      link: linkById.get(c.id) ?? { ok: null, detail: null },
    }))
    // Broken links first — they are the most visible failure to a student.
    .sort((a, b) => {
      const ab = a.link.ok === false ? 0 : 1;
      const bb = b.link.ok === false ? 0 : 1;
      return ab - bb || a.days - b.days;
    });
  const pastCount = health.filter((h) => h.days < 0).length;
  const confirmedCount = health.filter((h) => h.confirmed).length;
  const brokenLinks = health.filter((h) => h.link.ok === false).length;

  return (
    <main className="min-h-dvh bg-surface">
      <AppHeader
        admin
        links={[
          { href: "/admin", label: t("admin.metrics") },
          { href: "/admin/ambassadors", label: t("admin.ambassadors") },
          { href: "/dashboard", label: t("common.dashboard") },
        ]}
      />
      <div className="mx-auto max-w-3xl px-5 py-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {t("admin.oppsTitle")}
        </h1>
        <p className="mb-6 text-sm text-ink-soft">{t("admin.oppsSub")}</p>

        <div className="grid grid-cols-3 gap-3">
          <Stat label={t("admin.oppsPending")} value={pending.length} />
          <Stat label={t("admin.oppsApproved")} value={approvedCount} />
          <Stat label={t("admin.oppsRejected")} value={rejectedCount} />
        </div>

        {/* ── Pending candidates ──────────────────────────────────────────── */}
        <div className="mt-6 space-y-4">
          {pending.length === 0 ? (
            <Card>
              <p className="text-sm text-ink-soft">{t("admin.oppsNoPending")}</p>
            </Card>
          ) : (
            pending.map((c) => (
              <Card key={c.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base font-semibold text-ink underline decoration-line underline-offset-2 hover:decoration-ink"
                    >
                      {c.name}
                    </a>
                    <p className="mt-0.5 text-xs text-ink-faint">
                      {fieldsLabel(c.fields)} · {c.level} · {c.tier} · {c.category}
                      {c.region && (
                        <span className="ml-1.5 rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold text-accent-ink">
                          Local · {c.city ?? regionLabel(c.region)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <form action={approveCandidate.bind(null, c.id)}>
                      <button
                        type="submit"
                        className="rounded-xl bg-ink px-3 py-1.5 text-xs font-semibold text-surface hover:opacity-90"
                      >
                        {t("admin.oppsApprove")}
                      </button>
                    </form>
                    <form action={rejectCandidate.bind(null, c.id)}>
                      <button
                        type="submit"
                        className="rounded-xl border border-line px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-surface"
                      >
                        {t("admin.oppsReject")}
                      </button>
                    </form>
                  </div>
                </div>

                {c.blurb && <p className="mt-2 text-sm text-ink-soft">{c.blurb}</p>}

                <div className="mt-3 space-y-1 text-xs">
                  <p className={c.date_confirmed ? "text-ink" : "text-ink-soft"}>
                    {c.deadline ? `${c.deadline} · ` : ""}
                    {c.event_window}
                    {" — "}
                    <span className={c.date_confirmed ? "font-semibold" : "font-semibold text-amber-700"}>
                      {c.date_confirmed
                        ? t("admin.oppsDateConfirmed")
                        : t("admin.oppsDateUnconfirmed")}
                    </span>
                  </p>
                  <p className="text-ink-faint">{c.date_evidence}</p>
                  {c.eligibility && <p className="text-ink-faint">Eligibility: {c.eligibility}</p>}
                  <p className="text-ink-faint">
                    Found {new Date(c.discovered_at).toISOString().slice(0, 10)} · {c.source}
                  </p>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* ── Date health ─────────────────────────────────────────────────── */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-ink">
            {t("admin.oppsHealthTitle")}{" "}
            <span className="text-sm font-normal text-ink-soft">
              ({confirmedCount}/{health.length} confirmed
              {pastCount > 0 ? `, ${pastCount} past deadline` : ""}
              {brokenLinks > 0 ? `, ${brokenLinks} broken link` : ""})
            </span>
          </h2>
          <p className="mb-3 text-sm text-ink-soft">{t("admin.oppsHealthSub")}</p>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs text-ink-faint">
                    <th className="py-2 pr-3 font-medium">{t("admin.oppsHealthName")}</th>
                    <th className="py-2 pr-3 font-medium">{t("admin.oppsHealthDeadline")}</th>
                    <th className="py-2 pr-3 font-medium">{t("admin.oppsHealthStatus")}</th>
                    <th className="py-2 font-medium">{t("admin.oppsHealthLink")}</th>
                  </tr>
                </thead>
                <tbody>
                  {health.map((h) => (
                    <tr key={h.id} className="border-b border-line/60 last:border-0">
                      <td className="py-2 pr-3 text-ink">{h.name}</td>
                      <td data-num className="py-2 pr-3 text-ink-soft">
                        {h.deadline}
                        {h.days >= 0 && (
                          <span className="ml-1 text-xs text-ink-faint">in {h.days}d</span>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-xs">
                        {h.days < 0 ? (
                          <span className="font-semibold text-red-700">
                            {t("admin.oppsHealthPast")}
                          </span>
                        ) : h.confirmed ? (
                          <span className="font-semibold text-emerald-700">
                            {t("admin.oppsHealthConfirmed")}
                          </span>
                        ) : (
                          <span className="text-amber-700">{t("admin.oppsHealthEstimate")}</span>
                        )}
                      </td>
                      <td className="py-2 text-xs">
                        {h.link.ok === false ? (
                          <a
                            href={h.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-red-700 underline"
                            title={h.link.detail ?? undefined}
                          >
                            {t("admin.oppsHealthLinkBroken")}
                          </a>
                        ) : h.link.ok === true ? (
                          <span className="text-ink-faint">{t("admin.oppsHealthLinkOk")}</span>
                        ) : (
                          <span className="text-ink-faint">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
