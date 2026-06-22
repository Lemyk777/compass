import type { TFunc } from "@/lib/i18n/dictionary";
import { ScrollReveal, StaggerReveal, StaggerItem } from "@/components/ui/ScrollAnimations";

// Tangible, legible fragments of the real report — replaces the abstract bento.
// Server component — receives `t`. All numbers are illustrative sample data.
export function ReportShowcase({ t }: { t: TFunc }) {
  const tiers = {
    reach: { color: "var(--reach)", soft: "var(--reach-soft)" },
    target: { color: "var(--target)", soft: "var(--target-soft)" },
    likely: { color: "var(--likely)", soft: "var(--likely-soft)" },
  };

  const odds: { school: string; tier: keyof typeof tiers; label: string; range: string }[] = [
    { school: "Harvard", tier: "reach", label: t("tier.reach"), range: "4–7%" },
    { school: "MIT", tier: "reach", label: t("tier.reach"), range: "6–9%" },
    { school: "UC Berkeley", tier: "target", label: t("tier.target"), range: "24–32%" },
  ];

  const moves = [
    { label: t("landing.gap1"), lift: "+6" },
    { label: t("landing.gap2"), lift: "+4" },
  ];

  const tileBase = "rounded-2xl border border-line bg-card p-6 shadow-lift flex flex-col";

  return (
    <section className="w-full px-5 py-32 md:px-12 lg:px-20">
      <ScrollReveal>
        <div className="mb-16 max-w-2xl">
          <h2 className="text-4xl font-medium tracking-tight text-ink">{t("landing.reportTitle")}</h2>
          <p className="mt-4 text-lg font-light text-ink/60">{t("landing.reportSub")}</p>
        </div>
      </ScrollReveal>

      <StaggerReveal className="grid gap-6 md:grid-cols-2">
        {/* Overall competitiveness */}
        <StaggerItem className={tileBase}>
          <p className="text-sm font-medium text-ink-soft">{t("report.overall")}</p>
          <div className="mt-4 flex items-end gap-3">
            <span data-num className="font-display text-7xl font-semibold leading-none text-ink">
              73
            </span>
            <span className="pb-2 text-base text-ink-faint">/ 100</span>
          </div>
          <div className="mt-auto pt-6">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-accent" style={{ width: "73%" }} />
            </div>
          </div>
        </StaggerItem>

        {/* Per-school odds */}
        <StaggerItem className={tileBase}>
          <p className="text-sm font-medium text-ink-soft">{t("landing.get2Title")}</p>
          <div className="mt-5 space-y-3.5">
            {odds.map((o) => (
              <div key={o.school} className="flex items-center justify-between gap-3">
                <span className="text-base font-medium text-ink">{o.school}</span>
                <div className="flex items-center gap-2.5">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-ink"
                    style={{ backgroundColor: tiers[o.tier].soft }}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tiers[o.tier].color }} />
                    {o.label}
                  </span>
                  <span data-num className="w-14 text-right text-sm tabular-nums text-ink-soft">
                    {o.range}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </StaggerItem>

        {/* SAT benchmark vs admitted middle 50% */}
        <StaggerItem className={tileBase}>
          <p className="text-sm font-medium text-ink-soft">{t("report.benchTitle")}</p>
          <p className="mt-1 text-xs uppercase tracking-widest text-ink-faint">SAT</p>
          <div className="relative mt-8 h-2.5 w-full rounded-full bg-line">
            {/* admitted middle-50% band (1500–1570 on a 1200–1600 scale) */}
            <div
              className="absolute inset-y-0 rounded-full"
              style={{ left: "75%", right: "7.5%", backgroundColor: "var(--target-soft)" }}
            />
            {/* your score marker (1480) */}
            <div
              className="absolute -top-1.5 h-5.5 w-1.5 -translate-x-1/2 rounded-full bg-accent"
              style={{ left: "70%", height: "1.375rem" }}
            />
          </div>
          <div className="mt-5 flex items-center justify-between text-sm">
            <span>
              <span className="text-ink-soft">{t("landing.benchYou")} </span>
              <span data-num className="font-medium text-ink">1480</span>
            </span>
            <span>
              <span className="text-ink-soft">{t("landing.benchAdmitted")} </span>
              <span data-num className="font-medium text-ink">1500–1570</span>
            </span>
          </div>
        </StaggerItem>

        {/* Highest-impact moves */}
        <StaggerItem className={tileBase}>
          <p className="text-sm font-medium text-ink-soft">{t("report.gapTitle")}</p>
          <div className="mt-5 space-y-3">
            {moves.map((m) => (
              <div
                key={m.label}
                className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3"
              >
                <span className="text-base text-ink">{m.label}</span>
                <span
                  data-num
                  className="rounded-full bg-accent-soft px-2.5 py-0.5 text-sm font-semibold text-accent-ink"
                >
                  {m.lift}
                </span>
              </div>
            ))}
          </div>
        </StaggerItem>
      </StaggerReveal>
    </section>
  );
}
