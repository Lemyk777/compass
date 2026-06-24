import { Logo } from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { UniversityLogos } from "@/components/marketing/UniversityMarquee";
import { MiniScorecard } from "@/components/marketing/MiniScorecard";
import { MapScene } from "@/components/marketing/MapScene";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { FAQ } from "@/components/marketing/FAQ";
import { FinalCTA } from "@/components/marketing/FinalCTA";
import { MascotGallery } from "@/components/marketing/MascotGallery";
import { getUniversityLogos } from "@/lib/data/logos";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/auth/session";
import { AdminSwitcher } from "@/components/admin/AdminSwitcher";

export default async function LandingPage() {
  const t = getT();
  const universityLogos = getUniversityLogos();
  const session = await getSession();
  const isAdmin = session?.role === "admin";

  const pains = [1, 2, 3] as const;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F7F8FA] text-ink selection:bg-ink selection:text-white">
      {/* Nav */}
      <header className="absolute inset-x-0 top-0 z-50">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-2 px-6 py-6 md:px-12 md:py-8 xl:px-20">
          <Logo className="shrink-0 text-ink" />
          <nav className="flex items-center gap-1.5 sm:gap-3">
            {isAdmin && <AdminSwitcher className="mr-1 hidden lg:inline-flex" />}
            <LanguageToggle className="mr-0 sm:mr-2" />
            <ButtonLink
              href="/auth/login"
              variant="ghost"
              size="sm"
              className="hidden whitespace-nowrap font-medium sm:inline-flex"
            >
              {t("common.logIn")}
            </ButtonLink>
            <ButtonLink
              href="/auth/signup"
              variant="primary"
              size="sm"
              className="whitespace-nowrap rounded-full px-4 sm:px-5"
            >
              {t("common.getStarted")}
            </ButtonLink>
          </nav>
        </div>
      </header>

      {/* ── Hero ── one promise, one visual (the map), two buttons. The message
          column is deliberately compact so the map sits beside it, not far
          below it. Content is visible by default (CSS reveal), never gated by
          a scroll/JS animation. */}
      <section className="relative w-full overflow-hidden bg-[#F7F8FA]">
        <div className="mx-auto grid max-w-[1600px] grid-cols-1 items-center gap-12 px-6 pb-20 pt-32 md:px-12 lg:grid-cols-[minmax(0,500px)_1fr] lg:gap-16 lg:pb-24 lg:pt-36 xl:px-20">
          {/* Left — the message (compact) */}
          <div className="relative z-10 max-w-xl">
            <span className="rise-in inline-flex items-center rounded-full border border-ink/10 bg-white px-3.5 py-1.5 text-xs font-medium text-ink/60">
              {t("landing.badge")}
            </span>
            <h1 className="rise-in mt-6 text-balance text-[2.75rem] font-medium leading-[1.04] tracking-tight text-ink sm:text-[3.25rem] lg:text-[3.75rem]">
              {t("landing.title1")}
              <span className="block text-ink/55">{t("landing.title2")}</span>
            </h1>
            <p
              className="rise-in mt-6 max-w-md text-pretty text-lg font-light leading-relaxed text-ink/60"
              style={{ animationDelay: "0.08s" }}
            >
              {t("landing.subtitle")}
            </p>

            <div
              className="rise-in mt-8 flex flex-wrap items-center gap-3"
              style={{ animationDelay: "0.16s" }}
            >
              <ButtonLink
                href="/auth/signup"
                size="lg"
                className="rounded-full bg-ink px-7 py-4 text-base font-medium text-white transition-all hover:bg-ink/90 hover:shadow-[0_0_30px_rgba(14,123,87,0.35)]"
              >
                {t("landing.ctaBuild")}
              </ButtonLink>
              <ButtonLink
                href="/demo"
                variant="subtle"
                size="lg"
                className="rounded-full border border-ink/10 bg-white px-7 py-4 text-base font-medium text-ink transition-all hover:shadow-md"
              >
                {t("landing.seeSample") || "See a sample report"}
              </ButtonLink>
            </div>

            <p
              className="rise-in mt-5 text-sm text-ink/45"
              style={{ animationDelay: "0.24s" }}
            >
              {t("landing.free")}
            </p>
          </div>

          {/* Right — the interactive map. Centered against the (now compact)
              message by the grid, so it never floats off on its own. */}
          <div className="rise-in relative w-full" style={{ animationDelay: "0.1s" }}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
              <div className="absolute right-[8%] top-[6%] h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
              <div className="absolute bottom-[4%] left-[12%] h-64 w-64 rounded-full bg-[#0E7B57]/10 blur-3xl" />
            </div>
            <MapScene className="w-full" />
          </div>
        </div>
      </section>

      {/* ── Problem ── name the pain in their words. */}
      <section className="w-full border-t border-black/5 bg-white px-6 py-24 md:px-12 lg:px-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            {t("landing.problemKicker")}
          </p>
          <h2 className="mt-3 max-w-2xl text-balance text-3xl font-medium tracking-tight text-ink md:text-4xl lg:text-[2.75rem]">
            {t("landing.problemTitle")}
          </h2>
          <p className="mt-4 max-w-2xl text-pretty text-lg font-light leading-relaxed text-ink/60">
            {t("landing.problemBody")}
          </p>
          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {pains.map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-line bg-card p-6 shadow-[0_1px_0_rgba(16,25,43,0.03)]"
              >
                <span className="font-display text-sm font-semibold text-ink/25">
                  0{i}
                </span>
                <h3 className="mt-3 text-lg font-semibold tracking-tight text-ink">
                  {t(`landing.pain${i}Title`)}
                </h3>
                <p className="mt-2 text-pretty text-sm leading-relaxed text-ink/60">
                  {t(`landing.pain${i}Body`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Story ── why it exists, so trust doesn't have to be earned later. */}
      <section className="w-full bg-ink text-white">
        <div className="mx-auto max-w-6xl px-6 py-24 md:px-12 md:py-32 lg:px-20">
          <h2 className="max-w-3xl text-balance text-3xl font-medium tracking-tight md:text-5xl">
            {t("landing.honestTitle")}
          </h2>
          <p className="mt-6 max-w-3xl text-pretty text-lg font-light leading-relaxed text-white/70 md:text-xl">
            {t("landing.honestBody")}
          </p>
        </div>
      </section>

      {/* ── Proof ── benchmarked against real, recognizable schools. */}
      <section className="w-full border-y border-black/5 bg-white py-20">
        <div className="w-full px-6 md:px-12 lg:px-20">
          <p className="mb-12 text-center text-xs font-semibold uppercase tracking-widest text-ink/40">
            {t("landing.trustedBy")}
          </p>
          <UniversityLogos logos={universityLogos} />
        </div>
      </section>

      {/* ── Features ── how it works + exactly what you get. */}
      <HowItWorks t={t} />

      <section className="w-full bg-[#F7F8FA] px-6 py-24 md:px-12 lg:px-20">
        <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-balance text-3xl font-medium tracking-tight text-ink md:text-4xl">
              {t("landing.getTitle")}
            </h2>
            <p className="mt-4 max-w-md text-pretty text-lg font-light leading-relaxed text-ink/60">
              {t("landing.getSub")}
            </p>
          </div>
          <div className="w-full max-w-md justify-self-center lg:justify-self-end">
            <MiniScorecard t={t} />
          </div>
        </div>
      </section>

      {/* Personality → the campuses behind the scores. */}
      <section className="relative w-full overflow-hidden border-t border-line py-20">
        <div className="pointer-events-none absolute -left-24 top-1/3 -z-10 h-72 w-72 rounded-full bg-accent-soft opacity-50 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 -z-10 h-72 w-72 rounded-full bg-likely/10 blur-3xl" />
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto mb-10 max-w-xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-ink">
              {t("landing.mascotsTitle")}
            </h2>
            <p className="mt-2 text-pretty text-ink-soft">{t("landing.mascotsSub")}</p>
          </div>
          <MascotGallery />
        </div>
      </section>

      {/* Objection handling */}
      <FAQ />

      {/* ── CTA ── the close. */}
      <FinalCTA />

      <footer className="mx-auto max-w-6xl px-6 py-10 text-sm font-light text-ink/40">
        <div className="flex flex-col items-start justify-between gap-4 border-t border-black/10 pt-8 sm:flex-row sm:items-center">
          <Logo className="text-ink/80" />
          <p>
            © {new Date().getFullYear()} Compass. {t("landing.footer")}
          </p>
        </div>
      </footer>
    </main>
  );
}
