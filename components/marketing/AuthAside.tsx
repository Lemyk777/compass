import type { TFunc } from "@/lib/i18n/dictionary";
import { getUniversityLogos } from "@/lib/data/logos";

// ---- Sample-report geometry (the "example from a result") -----------------
// 7 scored factors → a radar "fingerprint", mirroring the real report.
const RADAR_AXES = ["Academics", "Tests", "Rigor", "Leadership", "Activities", "Awards", "Narrative"];
const RADAR_VALS = [0.86, 0.92, 0.7, 0.8, 0.74, 0.62, 0.82];
const CX = 60;
const CY = 60;
const R = 46;

function point(i: number, radius: number): [number, number] {
  const a = (-90 + (360 / RADAR_AXES.length) * i) * (Math.PI / 180);
  return [CX + Math.cos(a) * radius, CY + Math.sin(a) * radius];
}
function polygon(scale: number): string {
  return RADAR_AXES.map((_, i) => point(i, R * scale).map((n) => n.toFixed(1)).join(",")).join(" ");
}
const RADAR_SHAPE = RADAR_VALS.map((v, i) =>
  point(i, R * v).map((n) => n.toFixed(1)).join(",")
).join(" ");

// Decorative panel beside the auth forms — a polished "showroom" for the
// product: a live-looking sample report, the university wall, and the reach.
export function AuthAside({ t }: { t: TFunc }) {
  const logos = getUniversityLogos();
  // Duplicated so the CSS marquee can loop seamlessly.
  const logoLoop = [...logos, ...logos];

  return (
    <aside className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:gap-6 lg:p-12">
      {/* layered background */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_15%_0%,#1c3568_0%,#101b30_45%,#0b1120_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className="aside-glow pointer-events-none absolute -right-24 -top-24 -z-10 h-72 w-72 rounded-full bg-accent/40 blur-3xl" />
      <div
        className="aside-glow pointer-events-none absolute -bottom-28 -left-20 -z-10 h-80 w-80 rounded-full bg-[#3f9b6e]/25 blur-3xl"
        style={{ animationDelay: "2.5s" }}
      />

      {/* ---- top: promo + hero -------------------------------------------- */}
      <div className="relative">
        <span className="aside-rise relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur">
          <span className="aside-sheen pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-20deg] bg-white/25 blur-md" />
          <span className="text-[13px] leading-none text-amber-300">★</span>
          {t("auth.asideBadge")}
        </span>

        <h2
          className="aside-rise mt-5 max-w-sm text-[2rem] font-semibold leading-[1.1] tracking-tight text-white"
          style={{ animationDelay: "0.08s" }}
        >
          {t("auth.asideTitle")}
        </h2>

        <ul className="mt-5 space-y-2.5">
          {[t("auth.asideBullet1"), t("auth.asideBullet2"), t("auth.asideBullet3")].map(
            (b, i) => (
              <li
                key={b}
                className="aside-rise flex items-start gap-3 text-sm text-white/85"
                style={{ animationDelay: `${0.16 + i * 0.08}s` }}
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] text-white shadow-[0_0_0_4px_rgba(47,111,237,0.18)]">
                  ✓
                </span>
                {b}
              </li>
            )
          )}
        </ul>
      </div>

      {/* ---- middle: a sample result (gauge + radar) ---------------------- */}
      <div
        className="aside-pop relative max-w-sm rounded-2xl border border-white/12 bg-white/95 p-5 shadow-lift backdrop-blur"
        style={{ animationDelay: "0.3s" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-line text-ink">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M14.5 9.5l-2 5-3 1 2-5z" fill="currentColor" stroke="none" />
              </svg>
            </span>
            <span className="font-display text-sm font-semibold text-ink">Compass</span>
          </div>
          <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-medium text-accent-ink">
            {t("auth.asideSample")}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-5">
          {/* gauge */}
          <div className="relative h-[112px] w-[112px] shrink-0">
            <svg viewBox="0 0 120 120" className="h-full w-full">
              <circle
                pathLength={100}
                cx="60" cy="60" r="50" fill="none"
                stroke="var(--line)" strokeWidth="11" strokeLinecap="round"
                strokeDasharray="75 100" transform="rotate(135 60 60)"
              />
              <circle
                className="aside-gauge"
                pathLength={100}
                cx="60" cy="60" r="50" fill="none"
                stroke="var(--accent)" strokeWidth="11" strokeLinecap="round"
                strokeDasharray="61.5 100" transform="rotate(135 60 60)"
              />
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span data-num className="font-display text-3xl font-semibold leading-none text-ink">82</span>
              <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-accent">
                {t("band.exceptional")}
              </span>
            </div>
          </div>

          {/* radar fingerprint */}
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-[11px] font-medium text-ink-faint">{t("auth.asideRadar")}</p>
            <svg viewBox="0 0 120 120" className="h-[96px] w-full" role="img" aria-label={t("auth.asideRadar")}>
              {[1, 0.66, 0.33].map((s) => (
                <polygon key={s} points={polygon(s)} fill="none" stroke="var(--line)" strokeWidth="1" />
              ))}
              {RADAR_AXES.map((_, i) => {
                const [x, y] = point(i, R);
                return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="var(--line)" strokeWidth="1" />;
              })}
              <polygon
                className="aside-svg-pop"
                points={RADAR_SHAPE}
                fill="rgba(47,111,237,0.18)"
                stroke="var(--accent)"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              {RADAR_VALS.map((v, i) => {
                const [x, y] = point(i, R * v);
                return <circle key={i} cx={x} cy={y} r="2.4" fill="var(--accent)" />;
              })}
            </svg>
          </div>
        </div>

        {/* tier chips */}
        <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
          {[
            { label: t("tier.reach"), c: "var(--reach)", s: "var(--reach-soft, #FBE7E2)" },
            { label: t("tier.target"), c: "var(--target)", s: "var(--target-soft, #FaEEDB)" },
            { label: t("tier.likely"), c: "var(--likely)", s: "var(--likely-soft, #E1F1E9)" },
          ].map((chip) => (
            <span
              key={chip.label}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium text-ink"
              style={{ backgroundColor: chip.s }}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: chip.c }} />
              {chip.label}
            </span>
          ))}
        </div>
      </div>

      {/* ---- bottom: university wall + stats ------------------------------ */}
      <div className="relative space-y-5">
        {logos.length > 0 && (
          <div className="aside-rise" style={{ animationDelay: "0.42s" }}>
            <p className="mb-2.5 text-xs font-medium uppercase tracking-wide text-white/55">
              {t("auth.asideBenchmark")}
            </p>
            <div className="marquee-row marquee-mask overflow-hidden">
              <div className="marquee-track items-center gap-3 pr-3">
                {logoLoop.map((u, i) => (
                  <span
                    key={i}
                    className="flex h-14 w-[88px] shrink-0 items-center justify-center rounded-xl bg-white px-3 shadow-[0_4px_14px_-6px_rgba(0,0,0,0.5)]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/logos/${u.file}`}
                      alt={u.name}
                      title={u.name}
                      loading="lazy"
                      className="max-h-9 w-auto max-w-full object-contain"
                    />
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div
          className="aside-rise flex items-center gap-2 text-xs text-white/55"
          style={{ animationDelay: "0.5s" }}
        >
          <span className="font-medium text-white/80">{t("auth.asideStat1")}</span>
          <span className="h-1 w-1 rounded-full bg-white/30" />
          <span className="font-medium text-white/80">{t("auth.asideStat2")}</span>
          <span className="h-1 w-1 rounded-full bg-white/30" />
          <span className="font-medium text-white/80">{t("auth.asideStat3")}</span>
        </div>
      </div>
    </aside>
  );
}
