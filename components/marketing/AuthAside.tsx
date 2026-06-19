import { MiniScorecard } from "@/components/marketing/MiniScorecard";
import { FlagRibbon } from "@/components/marketing/UniversityMarquee";
import type { TFunc } from "@/lib/i18n/dictionary";

// Decorative panel that fills the empty desktop space beside auth forms.
export function AuthAside({ t }: { t: TFunc }) {
  return (
    <aside className="relative hidden overflow-hidden bg-ink lg:flex lg:flex-col lg:justify-between lg:p-12">
      {/* soft accent glow */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />

      <div className="relative">
        <h2 className="max-w-sm text-3xl font-semibold leading-tight tracking-tight text-white">
          {t("auth.asideTitle")}
        </h2>
        <ul className="mt-6 space-y-3">
          {[t("auth.asideBullet1"), t("auth.asideBullet2"), t("auth.asideBullet3")].map(
            (b) => (
              <li key={b} className="flex items-start gap-3 text-sm text-white/80">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] text-white">
                  ✓
                </span>
                {b}
              </li>
            )
          )}
        </ul>
      </div>

      <div className="relative my-8">
        <MiniScorecard t={t} className="max-w-sm" />
      </div>

      <div className="relative">
        <FlagRibbon />
      </div>
    </aside>
  );
}
