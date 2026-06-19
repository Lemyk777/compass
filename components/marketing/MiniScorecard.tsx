import type { TFunc } from "@/lib/i18n/dictionary";

// Static, data-free preview of the scorecard — used on the landing hero,
// the "what you get" demo, and the auth side panel.
export function MiniScorecard({
  t,
  className = "",
}: {
  t: TFunc;
  className?: string;
}) {
  const factors = [
    { label: t("mini.academics"), v: 8 },
    { label: t("mini.tests"), v: 9 },
    { label: t("mini.leadership"), v: 7 },
    { label: t("mini.activities"), v: 6 },
  ];
  const chips = [
    { label: t("tier.reach"), color: "var(--reach)", soft: "var(--reach-soft)" },
    { label: t("tier.target"), color: "var(--target)", soft: "var(--target-soft)" },
    { label: t("tier.likely"), color: "var(--likely)", soft: "var(--likely-soft)" },
  ];
  return (
    <div
      className={`rounded-2xl border border-line bg-card p-6 shadow-lift ${className}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink-soft">
          {t("landing.standingPreview")}
        </p>
        <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent-ink">
          {t("landing.preview")}
        </span>
      </div>

      <div className="mt-4 flex items-end gap-4">
        <div
          data-num
          className="font-display text-6xl font-semibold leading-none text-ink"
        >
          73
        </div>
        <div className="pb-1 text-sm text-ink-faint">
          / 100
          <br />
          {t("landing.competitiveness")}
        </div>
      </div>

      <div className="mt-6 space-y-2.5">
        {factors.map((f) => (
          <div key={f.label} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-xs text-ink-soft">{f.label}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${f.v * 10}%` }}
              />
            </div>
            <span data-num className="w-5 text-right text-xs text-ink-soft">
              {f.v}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
        {chips.map((c) => (
          <span
            key={c.label}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
            style={{ backgroundColor: c.soft, color: "var(--ink)" }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: c.color }}
            />
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}
