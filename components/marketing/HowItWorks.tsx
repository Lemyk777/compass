import type { TFunc } from "@/lib/i18n/dictionary";
import { ScrollReveal, StaggerReveal, StaggerItem } from "@/components/ui/ScrollAnimations";

// Three symmetric steps explaining the mechanism behind the scorecard the
// visitor just saw teased in the hero. Server component — receives `t`.
export function HowItWorks({ t }: { t: TFunc }) {
  const steps = [
    { title: t("landing.how1Title"), body: t("landing.how1Body") },
    { title: t("landing.how2Title"), body: t("landing.how2Body") },
    { title: t("landing.how3Title"), body: t("landing.how3Body") },
  ];

  return (
    <section className="w-full px-5 py-32 md:px-12 lg:px-20">
      <ScrollReveal>
        <div className="mb-16 max-w-2xl">
          <h2 className="text-4xl font-medium tracking-tight text-ink">{t("landing.howTitle")}</h2>
          <p className="mt-4 text-lg font-light text-ink/60">{t("landing.howSub")}</p>
        </div>
      </ScrollReveal>

      <StaggerReveal className="grid gap-6 md:grid-cols-3">
        {steps.map((s, i) => (
          <StaggerItem
            key={s.title}
            className="flex flex-col rounded-2xl border border-line bg-card p-8 shadow-lift"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-base font-semibold text-accent-ink">
              {i + 1}
            </span>
            <h3 className="mt-6 text-xl font-medium text-ink">{s.title}</h3>
            <p className="mt-3 text-base font-light leading-relaxed text-ink/60">{s.body}</p>
          </StaggerItem>
        ))}
      </StaggerReveal>
    </section>
  );
}
