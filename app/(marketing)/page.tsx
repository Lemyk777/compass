import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { UniversityLogos } from "@/components/marketing/UniversityMarquee";
import { MiniScorecard } from "@/components/marketing/MiniScorecard";
import { MapScene } from "@/components/marketing/MapScene";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { ReportShowcase } from "@/components/marketing/ReportShowcase";
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
      <header className="absolute inset-x-0 top-0 z-50 flex w-full items-center justify-between px-5 py-8 md:px-12 lg:px-20">
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
      </header>

      {/* Hero — full-bleed interactive Map, minimal overlay */}
      <section className="relative h-screen min-h-[700px] w-full overflow-hidden bg-[#F7F8FA]">
        {/* Interactive map — to the right and intentionally smaller than the message */}
        <div className="absolute inset-y-0 right-0 z-0 w-full lg:w-[46%]">
          <MapScene className="h-full w-full" />
        </div>

        <div className="pointer-events-none relative z-10 flex h-full w-full flex-col justify-center px-5 pt-28 md:px-12 lg:px-20 lg:pt-0">
          <div className="max-w-2xl">
            <div className="text-balance text-[3rem] font-medium leading-[1.03] tracking-tight text-ink sm:text-[4.25rem]">
              <TextBlur text={t("landing.title1")} />
              <div className="text-ink/60">
                <TextBlur text={t("landing.title2")} delay={0.2} />
              </div>
            </div>
            
            <div className="pointer-events-auto mt-8 flex flex-wrap items-center gap-4">
              <Magnetic>
                <ButtonLink
                  href="/auth/signup"
                  size="lg"
                  className="rounded-full bg-ink px-8 py-6 text-lg font-medium text-white transition-all hover:scale-105 hover:bg-ink/90 hover:shadow-[0_0_30px_rgba(31,163,122,0.4)] hover:ring-2 hover:ring-[#1FA37A]/50"
                >
                  {t("landing.ctaBuild")}
                </ButtonLink>
              </Magnetic>
              <Magnetic>
                <ButtonLink
                  href="/demo"
                  variant="subtle"
                  size="lg"
                  className="rounded-full border-ink/10 bg-white/60 px-8 py-6 text-lg font-medium text-ink backdrop-blur-md transition-all hover:bg-white/90"
                >
                  {t("landing.seeSample") || "View Demo"}
                </ButtonLink>
              </Magnetic>
            </div>

            <div className="pointer-events-auto mt-12 w-full max-w-lg">
              <ScrollReveal delay={0.4}>
                <div className="rounded-3xl bg-white/40 p-1 backdrop-blur-xl ring-1 ring-black/5">
                  <MiniScorecard t={t} className="shadow-2xl" />
                </div>
              </ScrollReveal>
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

      {/* University logo wall */}
      <section className="border-y border-black/5 py-24 bg-white">
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

      {/* Inside your report → tangible, legible proof of depth */}
      <ReportShowcase t={t} />

      {/* Honesty note */}
      <section className="bg-ink text-white">
        <div className="w-full px-5 md:px-12 lg:px-20 py-24 md:py-32">
          <ScrollReveal>
            <h2 className="text-3xl font-medium tracking-tight md:text-5xl">{t("landing.honestTitle")}</h2>
            <p className="mt-6 max-w-3xl text-pretty text-lg font-light leading-relaxed text-white/70 md:text-xl">
              {t("landing.honestBody")}
            </p>
          </ScrollReveal>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-5 py-10 text-sm font-light text-ink/40">
        <div className="flex flex-col items-start justify-between gap-4 border-t border-black/10 pt-8 sm:flex-row sm:items-center">
          <Logo className="text-ink/80" />
          <p>© {new Date().getFullYear()} Compass. {t("landing.footer")}</p>
        </div>
      </footer>
    </main>
  );
}
