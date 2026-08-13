import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppHeader } from "@/components/ui/AppHeader";
import { Card } from "@/components/report/Section";
import { RunDiscovery, type RunOption } from "@/components/admin/RunDiscovery";
import { getT } from "@/lib/i18n/server";
import { FACULTY_VALUES, facultyLabel } from "@/lib/data/faculties";
import { LOCAL_TARGETS, regionLabel } from "@/lib/data/geo";
import { resolveCompetitions, type Competition } from "@/lib/data/key-dates";
import { SEARCH_ANGLES } from "@/lib/discovery/discover";
import type { ScreenWarning } from "@/lib/discovery/screen";
import { approveCandidate, rejectCandidate } from "./actions";

export const dynamic = "force-dynamic";
// The on-demand discovery run is a server action on this route: one web search,
// one page fetch per candidate and one date extraction each. It needs the same
// headroom the cron has.
export const maxDuration = 300;

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
  /** Screening findings — absent until migration 0026 is applied. */
  warnings?: ScreenWarning[] | null;
};

function daysFromToday(iso: string): number {
  return Math.round((new Date(iso + "T00:00:00Z").getTime() - Date.now()) / 86_400_000);
}

function fieldsLabel(fields: string[] | "all"): string {
  if (fields === "all") return "All fields";
  return fields.map(facultyLabel).join(", ");
}

// What the reviewer is being asked to decide, in the order that decides it.
// The wording is the finding, not the code: "discontinued" means nothing to
// someone reading fast, "the page may say this has ended" means everything.
const WARNING_LABEL: Record<ScreenWarning["code"], string> = {
  discontinued: "May have ended",
  aggregator: "Listing site",
  social_only: "No official site",
  duplicate: "Duplicate",
  same_site: "Same site as an existing entry",
  name_absent: "Page doesn't name it",
  country_locked: "Country-restricted",
  unreachable_gate: "Nobody can enter",
  gate_unstated: "No eligibility stated",
  cost_signal: "Money",
};

// Order by how likely the finding is to end the review: a programme that has
// ended is a one-click reject, a fee quote is something to copy into the form.
const WARNING_RANK: Record<ScreenWarning["code"], number> = {
  discontinued: 0,
  unreachable_gate: 1,
  country_locked: 2,
  name_absent: 3,
  duplicate: 4,
  aggregator: 4,
  social_only: 5,
  same_site: 6,
  gate_unstated: 7,
  cost_signal: 8,
};

const COST_OPTIONS: { value: string; label: string }[] = [
  { value: "unknown", label: "Cost: not verified" },
  { value: "free", label: "Free, end to end" },
  { value: "free_cert_paid", label: "Free; certificate costs" },
  { value: "free_then_paid", label: "Free to enter; pay later round" },
  { value: "freemium", label: "Free tier + paid plan" },
  { value: "subscription", label: "Subscription" },
  { value: "one_time", label: "One-time fee" },
  { value: "paid_aid", label: "Paid, aid/waivers exist" },
  { value: "funded", label: "Funded (they pay you)" },
  { value: "varies", label: "Varies by school/country" },
];

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

  // Options for the on-demand run, built here rather than in the client
  // component: the angle list lives beside the Anthropic client and the whole
  // catalog, and importing it into the browser would ship both.
  const runTargets: RunOption[] = [
    ...FACULTY_VALUES.map((f) => ({ value: f, label: facultyLabel(f) })),
    ...Object.values(LOCAL_TARGETS).map((l) => ({
      value: `local:${l.code}`,
      label: `${l.name} (local)`,
    })),
  ];
  const runAngles: RunOption[] = SEARCH_ANGLES.map((a) => ({ value: a.key, label: a.label }));

  return (
    <main className="min-h-dvh bg-surface">
      <AppHeader
        admin
        links={[
          { href: "/admin", label: t("admin.metrics") },
          { href: "/admin/partners", label: "Partners" },
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

        {/* ── Search on demand ────────────────────────────────────────────── */}
        <div className="mt-6">
          <RunDiscovery targets={runTargets} angles={runAngles} />
        </div>

        {/* ── Pending candidates ──────────────────────────────────────────── */}
        <div className="mt-6 space-y-4">
          {pending.length === 0 ? (
            <Card>
              <p className="text-sm text-ink-soft">{t("admin.oppsNoPending")}</p>
            </Card>
          ) : (
            pending.map((c) => {
              const warnings = [...(c.warnings ?? [])].sort(
                (a, b) => (WARNING_RANK[a.code] ?? 9) - (WARNING_RANK[b.code] ?? 9),
              );
              return (
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
                          <span className="ml-1.5 rounded-full bg-accent-soft px-1.5 py-0.5 text-[11px] font-semibold text-accent-ink">
                            Local · {c.city ?? regionLabel(c.region)}
                          </span>
                        )}
                      </p>
                    </div>
                    <form action={rejectCandidate.bind(null, c.id)} className="shrink-0">
                      <button
                        type="submit"
                        className="rounded-xl border border-line px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-surface focus-visible:focus-ring"
                      >
                        {t("admin.oppsReject")}
                      </button>
                    </form>
                  </div>

                  {c.blurb && <p className="mt-2 text-sm text-ink-soft">{c.blurb}</p>}

                  {/* What screening found on the candidate's own page. This is
                      what makes a review a decision rather than an errand: the
                      quote is here, so the page doesn't have to be opened. */}
                  {warnings.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {warnings.map((w, i) => (
                        <li key={i} className="text-xs text-ink-soft">
                          <span
                            className={`mr-1.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                              WARNING_RANK[w.code] <= 2
                                ? "bg-reach-soft text-ink"
                                : "bg-surface text-ink-soft"
                            }`}
                          >
                            {WARNING_LABEL[w.code] ?? w.code}
                          </span>
                          {w.detail}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-3 space-y-1 text-xs">
                    <p className={c.date_confirmed ? "text-ink" : "text-ink-soft"}>
                      {c.deadline ? `${c.deadline} · ` : ""}
                      {c.event_window}
                      {" — "}
                      <span
                        className={
                          c.date_confirmed ? "font-semibold" : "font-semibold text-amber-700"
                        }
                      >
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

                  {/* Approving is where cost gets decided. Discovery never fills
                      it in — a hallucinated price is worse than none — so the
                      reviewer states it from the quoted sentence above, and the
                      row stops being permanently "cost unverified". */}
                  <form
                    action={approveCandidate.bind(null, c.id)}
                    className="mt-3 flex flex-wrap items-end gap-2 border-t border-line pt-3"
                  >
                    <label className="flex flex-col gap-1 text-[11px] text-ink-faint">
                      What it costs
                      <select
                        name="cost"
                        defaultValue="unknown"
                        className="rounded-xl border border-line bg-surface px-2 py-1.5 text-xs text-ink"
                      >
                        {COST_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex min-w-[16rem] flex-1 flex-col gap-1 text-[11px] text-ink-faint">
                      One sentence about the money (optional)
                      <input
                        type="text"
                        name="cost_detail"
                        maxLength={200}
                        placeholder="e.g. Free to enter; $25 only if you reach the final."
                        className="rounded-xl border border-line bg-surface px-2 py-1.5 text-xs text-ink"
                      />
                    </label>
                    <button
                      type="submit"
                      className="rounded-xl bg-ink px-3 py-1.5 text-xs font-semibold text-surface hover:opacity-90 focus-visible:focus-ring"
                    >
                      {t("admin.oppsApprove")}
                    </button>
                  </form>
                </Card>
              );
            })
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
