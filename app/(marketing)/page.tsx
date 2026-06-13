import { Logo } from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";

export default function LandingPage() {
  return (
    <main className="min-h-dvh bg-surface">
      {/* Nav */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <Logo className="text-ink" />
        <nav className="flex items-center gap-1">
          <ButtonLink href="/auth/login" variant="ghost" size="sm">
            Log in
          </ButtonLink>
          <ButtonLink href="/auth/signup" variant="primary" size="sm">
            Get started
          </ButtonLink>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-5 pb-8 pt-8 sm:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="animate-fade-up">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-xs font-medium text-ink-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              For international students applying to US universities
            </p>
            <h1 className="text-balance text-[2.1rem] font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl">
              See where you stand.
              <br />
              <span className="text-accent">Then close the gap.</span>
            </h1>
            <p className="mt-5 max-w-md text-pretty text-[1.05rem] leading-relaxed text-ink-soft">
              Enter your academic profile and get a clear, honest read on your
              competitiveness — scored factors, per-school likelihood ranges, and
              a concrete plan for what to improve next.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <ButtonLink href="/auth/signup" size="lg">
                Build your scorecard
              </ButtonLink>
              <ButtonLink href="/auth/login" variant="subtle" size="lg">
                I already have an account
              </ButtonLink>
            </div>
            <p className="mt-4 text-sm text-ink-faint">
              Free to start. No credit card.
            </p>
          </div>

          {/* Scorecard teaser — the signature element, previewed */}
          <ScorecardTeaser />
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-5 py-12">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
          How it works
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              className="rounded-2xl border border-line bg-card p-5 shadow-card"
            >
              <div
                data-num
                className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-sm font-semibold text-accent-ink"
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
      </section>

      {/* Honesty note */}
      <section className="mx-auto max-w-5xl px-5 pb-16">
        <div className="rounded-2xl border border-line bg-ink p-6 text-white sm:p-8">
          <h2 className="text-lg font-semibold">Honest by design</h2>
          <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-white/70">
            We give you confident numbers about your profile — and careful ranges
            about admission. Top schools are unpredictable for everyone, so we
            never pretend a single percentage is the truth. The value is the plan,
            not a false guarantee.
          </p>
        </div>
      </section>

      <footer className="mx-auto max-w-5xl px-5 py-8 text-sm text-ink-faint">
        <div className="flex flex-col items-start justify-between gap-3 border-t border-line pt-6 sm:flex-row sm:items-center">
          <Logo className="text-ink" />
          <p>© {new Date().getFullYear()} Compass. Guidance, not guarantees.</p>
        </div>
      </footer>
    </main>
  );
}

const STEPS = [
  {
    title: "Tell us about you",
    body: "A short, guided intake — grades, tests, activities, and your target schools. Works with IB, A-Levels, national curricula, and US GPA.",
  },
  {
    title: "Get your scorecard",
    body: "Seven scored factors, an overall competitiveness score, and per-school likelihood ranges with a confidence level.",
  },
  {
    title: "Follow the plan",
    body: "A prioritized gap analysis and timeline showing the highest-impact moves you can make next.",
  },
];

/** Static visual teaser of the scorecard — pure CSS, no data. */
function ScorecardTeaser() {
  const factors = [
    { label: "Academics", v: 8 },
    { label: "Test scores", v: 9 },
    { label: "Leadership", v: 7 },
    { label: "Activities", v: 6 },
    { label: "Awards", v: 5 },
  ];
  return (
    <div className="animate-fade-up rounded-2xl border border-line bg-card p-6 shadow-lift [animation-delay:120ms]">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink-soft">Your standing</p>
        <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent-ink">
          Preview
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
          competitiveness
        </div>
      </div>
      <div className="mt-6 space-y-2.5">
        {factors.map((f) => (
          <div key={f.label} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-xs text-ink-soft">
              {f.label}
            </span>
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
    </div>
  );
}
