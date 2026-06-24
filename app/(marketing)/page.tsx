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
import { ScrollReveal } from "@/components/ui/ScrollAnimations";
import { Magnetic } from "@/components/ui/Magnetic";
import { TextBlur } from "@/components/ui/TextBlur";

export default function LandingPage() {
  const t = getT();
  const universityLogos = getUniversityLogos();

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F7F8FA] text-ink selection:bg-ink selection:text-white">
      {/* Nav */}
      <header className="absolute inset-x-0 top-0 z-50">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-8 md:px-10 lg:px-10">
          <Logo className="text-ink" />
          <nav className="flex items-center gap-3">
            <LanguageToggle className="mr-2" />
            <ButtonLink href="/auth/login" variant="ghost" size="sm" className="font-medium">
              {t("common.logIn")}
            </ButtonLink>
            <ButtonLink href="/auth/signup" variant="primary" size="sm" className="rounded-full px-5">
              {t("common.getStarted")}
            </ButtonLink>
          </nav>
        </div>
      </header>

      {/* Hero — true two-column: message left, interactive map right. No overlap. */}
      <section className="relative w-full overflow-hidden bg-[#F7F8FA]">
        <div className="mx-auto grid min-h-screen max-w-[1440px] grid-cols-1 items-center gap-10 px-5 pb-16 pt-32 md:px-10 lg:grid-cols-[minmax(0,480px)_1fr] lg:gap-16 lg:px-10 lg:pb-12 lg:pt-28">
          {/* Left — the message */}
          <div className="relative z-10 max-w-xl">
            <div className="text-balance text-[2.75rem] font-medium leading-[1.04] tracking-tight text-ink sm:text-[3.5rem] lg:text-[3.75rem]">
              <TextBlur text={t("landing.title1")} />
              <div className="text-ink/55">
                <TextBlur text={t("landing.title2")} delay={0.2} />
              </div>
            </div>
            <p className="mt-6 max-w-md text-pretty text-lg font-light leading-relaxed text-ink/60">
              {t("landing.subtitle")}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Magnetic>
                <ButtonLink
                  href="/auth/signup"
                  size="lg"
                  className="rounded-full bg-ink px-7 py-5 text-base font-medium text-white transition-all hover:bg-ink/90 hover:shadow-[0_0_30px_rgba(14,123,87,0.35)]"
                >
                  {t("landing.ctaBuild")}
                </ButtonLink>
              </Magnetic>
              <Magnetic>
                <ButtonLink
                  href="/demo"
                  variant="subtle"
                  size="lg"
                  className="rounded-full border border-ink/10 bg-white px-7 py-5 text-base font-medium text-ink transition-all hover:shadow-md"
                >
                  {t("landing.seeSample") || "View Demo"}
                </ButtonLink>
              </Magnetic>
            </div>

            <div className="mt-10 w-full max-w-md">
              <ScrollReveal delay={0.3}>
                <div className="rounded-3xl bg-white/50 p-1 ring-1 ring-black/5 backdrop-blur-xl">
                  <MiniScorecard t={t} className="shadow-xl" />
                </div>
              </ScrollReveal>
            </div>
          </div>

          {/* Right — interactive map. Self-sizing (its own aspect ratio) so it
              fills the width with no dead space and never floats; centered
              against the message by the grid's items-center. A soft brand glow
              sits behind it for depth (decorative, never intercepts input). */}
          <div className="relative w-full">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10"
            >
              <div className="absolute right-[8%] top-[6%] h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
              <div className="absolute bottom-[4%] left-[12%] h-64 w-64 rounded-full bg-[#0E7B57]/10 blur-3xl" />
            </div>
            <MapScene className="w-full" />
          </div>
        </div>
      </section>

      {/* Trust — university logo wall */}
      <section className="border-y border-black/5 bg-white py-20">
        <div className="w-full px-5 md:px-12 lg:px-20">
          <ScrollReveal>
            <p className="mb-12 text-center text-xs font-semibold uppercase tracking-widest text-ink/40">
              {t("landing.trustedBy")}
            </p>
          </ScrollReveal>
          <UniversityLogos logos={universityLogos} />
        </div>
      </section>

      {/* How it works → the mechanism behind the score */}
      <HowItWorks t={t} />

      {/* Mascots → personality */}
      <section className="relative overflow-hidden border-t border-line py-20">
        <div className="pointer-events-none absolute -left-24 top-1/3 -z-10 h-72 w-72 rounded-full bg-accent-soft opacity-50 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 -z-10 h-72 w-72 rounded-full bg-likely/10 blur-3xl" />
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto mb-10 max-w-xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-ink">
              {t("landing.mascotsTitle")}
            </h2>
            <p className="mt-2 text-pretty text-ink-soft">{t("landing.mascotsSub")}</p>
          </div>
          <MascotGallery />
        </div>
      </section>

      {/* Honesty note → differentiation */}
      <section className="bg-ink text-white">
        <div className="w-full px-5 py-24 md:px-12 md:py-32 lg:px-20">
          <ScrollReveal>
            <h2 className="text-3xl font-medium tracking-tight md:text-5xl">{t("landing.honestTitle")}</h2>
            <p className="mt-6 max-w-3xl text-pretty text-lg font-light leading-relaxed text-white/70 md:text-xl">
              {t("landing.honestBody")}
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ → objection handling (not another result preview) */}
      <FAQ />

      {/* Final CTA → the close */}
      <FinalCTA />

      <footer className="mx-auto max-w-6xl px-5 py-10 text-sm font-light text-ink/40">
        <div className="flex flex-col items-start justify-between gap-4 border-t border-black/10 pt-8 sm:flex-row sm:items-center">
          <Logo className="text-ink/80" />
          <p>© {new Date().getFullYear()} Compass. {t("landing.footer")}</p>
        </div>
      </footer>
    </main>
  );
}
