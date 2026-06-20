import { Logo } from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { UniversityLogos } from "@/components/marketing/UniversityMarquee";
import { MiniScorecard } from "@/components/marketing/MiniScorecard";
import { getUniversityLogos } from "@/lib/data/logos";
import { getT } from "@/lib/i18n/server";
import { ScrollReveal, Parallax, StaggerReveal, StaggerItem } from "@/components/ui/ScrollAnimations";
import { Magnetic } from "@/components/ui/Magnetic";
import { TextBlur } from "@/components/ui/TextBlur";
import { Card3D } from "@/components/ui/Card3D";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const t = getT();
  const universityLogos = getUniversityLogos();

  return (
    <main className="min-h-dvh bg-white text-ink selection:bg-ink selection:text-white">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-8">
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

      {/* Hero */}
      <section className="relative mx-auto w-full max-w-6xl px-5 pb-20 pt-16 sm:pt-32">
        <div className="grid items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <div className="text-balance text-[3rem] font-medium leading-[1.05] tracking-tight text-ink sm:text-[4.5rem]">
              <TextBlur text={t("landing.title1")} />
              <div className="text-ink/40">
                <TextBlur text={t("landing.title2")} delay={0.2} />
              </div>
            </div>

            <ScrollReveal delay={0.1}>
              <p className="max-w-md text-pretty text-lg leading-relaxed text-ink/70 font-light">
                {t("landing.subtitle")}
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.4}>
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Magnetic>
                  <ButtonLink href="/auth/signup" size="lg" className="rounded-full px-8 bg-ink text-white hover:bg-ink/90 transition-colors">
                    {t("landing.ctaBuild")}
                  </ButtonLink>
                </Magnetic>
                <Magnetic>
                  <ButtonLink href="/demo" variant="ghost" size="lg" className="rounded-full">
                    {t("landing.seeSample")}
                  </ButtonLink>
                </Magnetic>
              </div>
            </ScrollReveal>
          </div>

          <Card3D className="hidden lg:block perspective-[1000px]">
            <div className="relative rounded-3xl border border-black/5 bg-white p-2 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)]">
              <MiniScorecard t={t} />
            </div>
          </Card3D>
        </div>
      </section>

      {/* University logo wall */}
      <section className="border-y border-black/5 py-16">
        <div className="mx-auto max-w-6xl px-5">
          <ScrollReveal>
            <p className="mb-10 text-center text-xs font-semibold uppercase tracking-widest text-ink/40">
              {t("landing.trustedBy")}
            </p>
          </ScrollReveal>
          <UniversityLogos logos={universityLogos} />
        </div>
      </section>

      {/* What you get */}
      <section className="mx-auto max-w-6xl px-5 py-32">
        <ScrollReveal>
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="text-4xl font-medium tracking-tight text-ink">
              {t("landing.getTitle")}
            </h2>
            <p className="mt-4 text-lg font-light text-ink/60">
              {t("landing.getSub")}
            </p>
          </div>
        </ScrollReveal>

        <StaggerReveal className="grid md:grid-cols-2 gap-x-8 gap-y-16">
          {[
            { title: t("landing.get1Title"), body: t("landing.get1Body") },
            { title: t("landing.get2Title"), body: t("landing.get2Body") },
            { title: t("landing.get3Title"), body: t("landing.get3Body") },
            { title: t("landing.get4Title"), body: t("landing.get4Body") },
          ].map((f, i) => (
            <StaggerItem key={i} className="border-t border-black/10 pt-6">
              <h3 className="text-xl font-medium text-ink">{f.title}</h3>
              <p className="mt-3 text-base font-light leading-relaxed text-ink/60">
                {f.body}
              </p>
            </StaggerItem>
          ))}
        </StaggerReveal>

        <Parallax offset={30} className="mt-24 flex justify-center">
          <div className="w-full max-w-2xl rounded-3xl border border-black/5 bg-white p-2 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)]">
            <MiniScorecard t={t} />
          </div>
        </Parallax>
      </section>

      {/* Honesty note */}
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-6xl px-5 py-24 md:py-32">
          <ScrollReveal>
            <h2 className="text-3xl font-medium tracking-tight md:text-5xl">{t("landing.honestTitle")}</h2>
            <p className="mt-6 max-w-3xl text-pretty text-lg font-light leading-relaxed text-white/70 md:text-xl">
              {t("landing.honestBody")}
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-5 py-32">
        <ScrollReveal>
          <div className="text-center">
            <h2 className="text-balance text-4xl font-medium tracking-tight text-ink sm:text-6xl">
              {t("landing.ctaTitle")}
            </h2>
            <p className="mx-auto mt-6 max-w-md text-lg font-light text-ink/60">
              {t("landing.ctaSub")}
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <ButtonLink href="/auth/signup" size="lg" className="rounded-full px-8">
                {t("landing.ctaBuild")}
              </ButtonLink>
            </div>
          </div>
        </ScrollReveal>
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
