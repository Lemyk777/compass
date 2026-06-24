import { getT } from "@/lib/i18n/server";

export type AmbassadorRow = {
  code: string;
  name: string | null;
  email: string | null;
  country: string | null;
  status: string;
  count: number;
};

/**
 * Ranked leaderboard of every ambassador by the number of sign-ups their
 * referral link brought in. Server component — pure presentation, no state.
 * `rows` must already be sorted by `count` descending.
 */
export function AmbassadorLeaderboard({ rows }: { rows: AmbassadorRow[] }) {
  const t = getT();

  if (!rows.length) {
    return <p className="text-sm text-ink-faint">{t("admin.ambEmpty")}</p>;
  }

  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <ul className="divide-y divide-line">
      {rows.map((r, i) => {
        const who = r.name ?? r.email ?? t("admin.unnamed");
        const pct = Math.round((r.count / max) * 100);
        return (
          <li key={r.code} className="py-3 first:pt-0 last:pb-0">
            <div className="flex items-center gap-3">
              <span
                data-num
                className="w-6 shrink-0 text-right font-display text-sm font-semibold text-ink-faint"
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{who}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-ink-soft">
                  <span data-num className="font-medium text-ink-soft">
                    {r.code}
                  </span>
                  <span className="text-ink-faint">·</span>
                  <span>{r.country || "—"}</span>
                  <span
                    className={`ml-0.5 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${
                      r.status === "active"
                        ? "bg-likely-soft text-[#2C6B4D]"
                        : "bg-line text-ink-faint"
                    }`}
                  >
                    {r.status}
                  </span>
                </p>
              </div>
              <span
                data-num
                className="shrink-0 font-display text-2xl font-semibold tabular-nums text-ink"
              >
                {r.count}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
