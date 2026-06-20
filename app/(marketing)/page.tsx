import { Logo } from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import {
  UniversityLogos,
  CountryReveal,
  FlagStrip,
} from "@/components/marketing/UniversityMarquee";
import { MiniScorecard } from "@/components/marketing/MiniScorecard";
import { MascotGallery } from "@/components/marketing/MascotGallery";
import { getUniversityLogos } from "@/lib/data/logos";
import { getT } from "@/lib/i18n/server";

export default function LandingPage() {
  const t = getT();
  const universityLogos = getUniversityLogos();
  return (
    <main className="min-h-dvh bg-surface">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo className="text-ink" />
        <nav className="flex items-center gap-1.5">
          <LanguageToggle className="mr-1" />
          <ButtonLink href="/auth/login" variant="ghost" size="sm">
            {t("common.logIn")}
          </ButtonLink>
          <ButtonLink href="/auth/signup" variant="primary" size="sm">
            {t("common.getStarted")}
          </ButtonLink>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pb-10 pt-6 sm:pt-14">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="animate-fade-up">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-xs font-medium text-ink-soft">
              <span aria-hidden="true">🇺🇸</span>
              {t("landing.badge")}
            </p>
            <h1 className="text-balance text-[2.3rem] font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl">
              {t("landing.title1")}
              <br />
              <span className="text-accent">{t("landing.title2")}</span>
            </h1>
            <p className="mt-5 max-w-md text-pretty text-[1.05rem] leading-relaxed text-ink-soft">
              {t("landing.subtitle")}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <ButtonLink href="/auth/signup" size="lg">
                {t("landing.ctaBuild")}
              </ButtonLink>
              <ButtonLink href="/demo" variant="subtle" size="lg">
                {t("landing.seeSample")}
              </ButtonLink>
            </div>
            <p className="mt-4 text-sm text-ink-faint">{t("landing.free")}</p>
          </div>

          <div className="animate-fade-up [animation-delay:100ms]">
            <MiniScorecard t={t} />
          </div>
        </div>
      </section>

      {/* University logo wall + country reveal */}
      <section className="border-y border-line bg-card/60 py-10">
        <div className="mx-auto max-w-6xl px-5">
          <p className="mb-5 text-center text-xs font-semibold uppercase tracking-wide text-ink-faint">
            {t("landing.trustedBy")}
          </p>
          <UniversityLogos logos={universityLogos} />
          <p className="mb-4 mt-9 text-center text-xs font-semibold uppercase tracking-wide text-ink-faint">
            {t("landing.fromEverywhere")}
          </p>
          <CountryReveal />
        </div>
      </section>

      {/* What you get */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="mx-auto mb-10 max-w-xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-ink">
            {t("landing.getTitle")}
          </h2>
          <p className="mt-2 text-ink-soft">{t("landing.getSub")}</p>
        </div>

        <div className="grid items-center gap-8 lg:grid-cols-2">
          {/* Feature list */}
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: "📊", title: t("landing.get1Title"), body: t("landing.get1Body") },
              { icon: "🎯", title: t("landing.get2Title"), body: t("landing.get2Body") },
              { icon: "📈", title: t("landing.get3Title"), body: t("landing.get3Body") },
              { icon: "🗺️", title: t("landing.get4Title"), body: t("landing.get4Body") },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-line bg-card p-5 shadow-card"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-xl">
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold text-ink">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  {f.body}
                </p>
              </div>
            ))}
          </div>

          {/* Demo preview */}
          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-accent-soft to-transparent opacity-70 blur-2xl" />
            <MiniScorecard t={t} />
            <div className="mt-4 text-center">
              <ButtonLink href="/demo" variant="subtle">
                {t("landing.seeSample")} →
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* Mascots */}
      <section className="relative overflow-hidden border-t border-line py-16">
        <div className="pointer-events-none absolute -left-24 top-1/3 -z-10 h-72 w-72 rounded-full bg-accent-soft opacity-50 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 -z-10 h-72 w-72 rounded-full bg-likely/10 blur-3xl" />
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto mb-10 max-w-xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-ink">
              {t("landing.mascotsTitle")}
            </h2>
            <p className="mt-2 text-pretty text-ink-soft">
              {t("landing.mascotsSub")}
            </p>
          </div>
          <MascotGallery />
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-line bg-card/60 py-16">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-ink-faint">
            {t("landing.howItWorks")}
          </h2>
          <div className="mx-auto mt-6 grid max-w-4xl gap-4 sm:grid-cols-3">
            {[
              { title: t("landing.step1Title"), body: t("landing.step1Body") },
              { title: t("landing.step2Title"), body: t("landing.step2Body") },
              { title: t("landing.step3Title"), body: t("landing.step3Body") },
            ].map((s, i) => (
              <div
                key={i}
                className="rounded-2xl border border-line bg-card p-5 shadow-card"
              >
                <div
                  data-num
                  className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-sm font-semibold text-white"
                >
                  {i + 1}
                </div>
                <h3 className="text-base font-semibold text-ink">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Honesty note */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="rounded-2xl border border-line bg-ink p-6 text-white sm:p-10">
          <h2 className="text-lg font-semibold">{t("landing.honestTitle")}</h2>
          <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-white/70">
            {t("landing.honestBody")}
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="overflow-hidden rounded-2xl border border-line bg-card p-8 text-center shadow-lift sm:p-12">
          <div className="mb-6 flex justify-center">
            <CountryReveal />
          </div>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {t("landing.ctaTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-ink-soft">
            {t("landing.ctaSub")}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/auth/signup" size="lg">
              {t("landing.ctaBuild")}
            </ButtonLink>
            <ButtonLink href="/auth/login" variant="subtle" size="lg">
              {t("common.logIn")}
            </ButtonLink>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-5 py-8 text-sm text-ink-faint">
        <div className="flex flex-col items-start justify-between gap-3 border-t border-line pt-6 sm:flex-row sm:items-center">
          <Logo className="text-ink" />
          <p>
            © {new Date().getFullYear()} Compass. {t("landing.footer")}
          </p>
        </div>
      </footer>
    </main>
  );
}
