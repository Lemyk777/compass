import { Logo } from "@/components/ui/Logo";
import { SKIP_TARGET, SkipLink } from "@/components/ui/SkipLink";
import { ButtonLink } from "@/components/ui/Button";
import { UniversityLogos } from "@/components/marketing/UniversityMarquee";
import { MiniScorecard } from "@/components/marketing/MiniScorecard";
import { MapScene } from "@/components/marketing/MapScene";
import { RotatingHeadline } from "@/components/marketing/RotatingHeadline";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { FAQ } from "@/components/marketing/FAQ";
import { FinalCTA } from "@/components/marketing/FinalCTA";
import {
  OpportunityPreview,
  previewOpportunities,
} from "@/components/marketing/OpportunityPreview";
import { getUniversityLogos } from "@/lib/data/logos";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/auth/session";
import { AdminSwitcher } from "@/components/admin/AdminSwitcher";
import { COMPETITIONS, opportunityCost } from "@/lib/data/key-dates";
import { allCareerAreas } from "@/lib/data/careers";
import { HUBS } from "@/lib/data/world";
import { STUDY_DESTINATIONS } from "@/lib/data/study-destinations";
import { HOME_ROUTES } from "@/lib/data/from-home";

// The landing page tells the product's story in the product's own order.
//
// It used to be built end-to-end for ONE thing: the admission report. Hero
// promise, three pains, "how we score you", a scorecard preview, campus
// mascots, an FAQ about the score. Opportunities — what a student can actually
// enter, at their age, this year — is now the front door, and a front door that
// only appears as a button on a page about something else isn't one.
//
// So the order here matches /opportunities → /guide → the report:
//   1. what you can enter        (the hero, with four real rows from the catalog)
//   2. what the list is made of  (the counts, straight from the data)
//   3. how it works              (two questions)
//   4. why lists usually fail    (the problem, restated for this product)
//   5. where it leads            (the guide)
//   6. honest by design          (the promise both halves are built on)
//   7. the full admission read   (the report — still here, now opt-in)
//   8. for organisations · FAQ · close
//
// Every count on this page is computed from the data at request time, so it
// cannot drift from what the student will actually see.

// The counts below read the catalog and the guide registries. Both are static
// modules, so this is a property read, not a query.
const FREE_COUNT = COMPETITIONS.filter(
  (c) => opportunityCost(c).tone === "free",
).length;
const OPEN_NOW_COUNT = COMPETITIONS.filter((c) => c.alwaysOpen).length;

const PAINS: { n: string; title: React.ReactNode; body: string }[] = [
  {
    n: "01",
    title: "Written for someone older",
    body: "Most of what gets listed turns out to be for university students, or for one country's nationals. You find that out after reading the rules — if the rules are even linked.",
  },
  {
    n: "02",
    title: "Dead links and last year's dates",
    body: "A deadline that has already passed is worse than no deadline at all. So we check every link, and only show a countdown for a date confirmed against the organiser's own page.",
  },
  {
    n: "03",
    title: <>&ldquo;Free&rdquo; that isn&rsquo;t</>,
    body: "Free to learn, but the certificate costs money. Free to enter, but only round one. Those are the two that catch students out, so each gets its own label instead of hiding under 'free'.",
  },
];

export default async function LandingPage() {
  const t = getT();
  const universityLogos = getUniversityLogos();
  const session = await getSession();
  const isAdmin = session?.role === "admin";
  const preview = previewOpportunities();
  const areaCount = allCareerAreas().length;

  return (
    // A `div`, not a `main`. The banner and the footer used to live inside the
    // main landmark, which makes "jump to main content" land on the logo — the
    // one shortcut for skipping chrome delivering you into it. Both are siblings
    // now, and the skip link ahead of them is the first thing in the tab order.
    <div className="min-h-screen overflow-x-hidden bg-surface text-ink selection:bg-ink selection:text-white">
      <SkipLink />
      <header className="absolute inset-x-0 top-0 z-50">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-2 px-6 py-6 md:px-12 md:py-8 xl:px-20">
          <Logo
            className="shrink-0 text-ink"
            style={{ viewTransitionName: "brand-logo" }}
          />
          <nav className="flex items-center gap-2 sm:gap-3">
            {isAdmin && (
              <AdminSwitcher className="mr-1 hidden lg:inline-flex" />
            )}
            {/* The way in for an ORGANISATION rather than a student. Sits before
                "log in" because a hub arriving at this page is not looking for
                an account, it is looking for us. */}
            <ButtonLink
              href="/partners"
              variant="ghost"
              size="sm"
              className="whitespace-nowrap px-2 font-medium sm:px-4"
            >
              {/* Visible at every width, because the people this is for read us
                  on a phone. The label shortens rather than disappearing — a
                  link that exists only on desktop is a link a hub never finds. */}
              <span className="sm:hidden">Partners</span>
              <span className="hidden sm:inline">For organisations</span>
            </ButtonLink>
            {/* Reflect the actual session. A signed-in student was once still
                shown "Log in" here — the page knows who they are — which reads
                as "my profile was reset". */}
            <ButtonLink
              href={session ? "/dashboard" : "/auth/login"}
              variant="ghost"
              size="sm"
              className="hidden whitespace-nowrap font-medium sm:inline-flex"
            >
              {session ? t("common.dashboard") : t("common.logIn")}
            </ButtonLink>
            <ButtonLink
              href="/opportunities"
              variant="primary"
              size="sm"
              className="whitespace-nowrap rounded-full px-4 sm:px-5"
            >
              Opportunities
            </ButtonLink>
          </nav>
        </div>
      </header>

      <main id={SKIP_TARGET} tabIndex={-1}>
        {/* ── Hero ── one promise, and the product itself beside it.
          The visual is four real rows out of the catalog, server-rendered: no
          image, no chart, no JS. Content is visible by default (CSS reveal),
          never gated by a scroll animation. */}
        <section className="relative flex min-h-[100svh] w-full items-center overflow-hidden bg-surface">
          <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 items-center gap-12 px-6 py-24 md:px-12 lg:grid-cols-[minmax(0,560px)_1fr] lg:gap-20 lg:py-28 xl:px-20">
            {/* Left — the message */}
            <div className="relative z-10 max-w-xl">
              <span className="rise-in inline-flex items-center rounded-full border border-ink/10 bg-card px-3.5 py-1.5 text-xs font-medium text-ink/60">
                Free · no account needed · for students anywhere
              </span>
              <h1 className="rise-in mt-6 text-balance text-[2.75rem] font-medium leading-[1.04] tracking-tight text-ink sm:text-[3.25rem] lg:text-[3.75rem]">
                See what you can enter.
                <RotatingHeadline
                  phrases={[
                    "Then go and win it.",
                    "Then make your move.",
                    "Then close the gap.",
                  ]}
                />
              </h1>
              <p
                className="rise-in mt-6 max-w-md text-pretty text-lg font-light leading-relaxed text-ink/60"
                style={{ animationDelay: "0.08s" }}
              >
                Competitions, olympiads, courses and programmes you can actually
                enter — at your age, from where you live, with the real deadline
                and the real cost. Tell us your year at school and the list is
                yours.
              </p>

              <div
                className="rise-in mt-8 flex flex-wrap items-center gap-3"
                style={{ animationDelay: "0.16s" }}
              >
                <ButtonLink
                  href="/opportunities"
                  size="lg"
                  className="rounded-full bg-ink px-7 py-4 text-base font-medium text-white transition-all hover:bg-ink/90 hover:shadow-lift"
                >
                  See what you can enter
                </ButtonLink>
                <ButtonLink
                  href="/guide"
                  variant="subtle"
                  size="lg"
                  className="rounded-full border border-ink/10 bg-card px-7 py-4 text-base font-medium text-ink transition-all hover:shadow-card"
                >
                  Where can it lead?
                </ButtonLink>
              </div>

              <p
                className="rise-in mt-5 text-sm text-ink-faint"
                style={{ animationDelay: "0.24s" }}
              >
                Free, all of it. Applying to university too?{" "}
                <a
                  href="/demo"
                  className="font-medium text-ink/60 underline-offset-2 transition hover:text-ink hover:underline"
                >
                  See a sample admission report
                </a>
              </p>
            </div>

            {/* Right — the product. */}
            <div
              className="rise-in relative w-full"
              style={{ animationDelay: "0.1s" }}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10"
              >
                <div className="absolute right-[8%] top-[6%] h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
                <div className="absolute bottom-[4%] left-[12%] h-64 w-64 rounded-full bg-ivy/10 blur-3xl" />
              </div>
              <div className="mx-auto w-full max-w-lg lg:ml-auto lg:mr-0">
                <OpportunityPreview items={preview} />
              </div>
            </div>
          </div>
        </section>

        {/* ── What the list is made of ── the counts, from the data itself. */}
        <section className="w-full border-t border-black/5 bg-card px-6 py-20 md:px-12 lg:px-20">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <Stat
                value={COMPETITIONS.length}
                label="opportunities in the catalog"
                note="Olympiads, competitions, courses, research and summer programmes — international and national."
              />
              <Stat
                value={FREE_COUNT}
                label="cost nothing to enter"
                note="And the ones that do cost say so, in money, on the card. Nothing is filed under 'free' that isn't."
              />
              <Stat
                value={OPEN_NOW_COUNT}
                label="you can start tonight"
                note="No deadline to wait for — self-paced courses, rolling submissions, contests that run all year."
              />
              <Stat
                value={5}
                label="countries in the admission report"
                note="US, Italy, Hong Kong, the UAE and Korea — if and when you want that part."
              />
            </div>
          </div>
        </section>

        {/* ── How it works ── two questions, then the list. */}
        <HowItWorks />

        {/* ── The problem ── why lists like this usually fail a student. */}
        <section className="w-full border-y border-black/5 bg-ink px-6 py-24 text-white md:px-12 md:py-28 lg:px-20">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
              The problem
            </p>
            <h2 className="mt-3 max-w-2xl text-balance text-3xl font-medium tracking-tight md:text-4xl lg:text-[2.75rem]">
              The lists exist. They&rsquo;re just not for you.
            </h2>
            <p className="mt-4 max-w-2xl text-pretty text-lg font-light leading-relaxed text-white/60">
              Search &ldquo;olympiads for school students&rdquo; and you get
              hundreds of results. Almost none of them tell you the one thing
              that decides everything: whether someone your age, in your
              country, can enter at all.
            </p>
            <div className="mt-12 grid gap-5 sm:grid-cols-3">
              {PAINS.map((p) => (
                <div
                  key={p.n}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"
                >
                  {/* white/50, not white/30. At 30% these ordinals sat at 2.69:1
                    against the tinted card on the dark band — they read as a
                    smudge rather than as "this is the first of three", which is
                    the only job they have. 50% is 5.0:1 and still clearly
                    subordinate to the heading beside it. */}
                  <span
                    data-num
                    className="font-display text-sm font-semibold text-white/50"
                  >
                    {p.n}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold tracking-tight text-white">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-pretty text-sm leading-relaxed text-white/60">
                    {p.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Where it leads ── the guide, the second half of the student's section. */}
        <section className="w-full px-6 py-24 md:px-12 md:py-28 lg:px-20">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ivy">
                Where it leads
              </p>
              <h2 className="mt-3 text-balance text-3xl font-medium tracking-tight text-ink md:text-4xl">
                &ldquo;And then what?&rdquo; — answered before you enter, not
                after.
              </h2>
              <p className="mt-4 max-w-xl text-pretty text-lg font-light leading-relaxed text-ink/60">
                The guide runs the whole chain: what you like → the areas of
                work it opens → the countries and cities that work lives in →
                and what you can enter from home without moving anywhere. Every
                one of them states its catch, not just its brochure.
              </p>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <GuideCard
                href="/guide/work"
                step="1"
                count={areaCount}
                title="areas of work"
                body="Real job titles inside each one — never a single prescribed profession per field."
              />
              <GuideCard
                href="/guide/places"
                step="2"
                count={STUDY_DESTINATIONS.length}
                title="countries in full"
                body="Money, admissions, after-study rules, cities. Trade-offs outnumber strengths, on purpose."
              />
              <GuideCard
                href="/guide/cities"
                step="3"
                count={HUBS.length}
                title="cities to work in"
                body="Including Almaty, Astana, Tashkent and Tbilisi — the map does not stop at the countries we profile."
              />
              <GuideCard
                href="/guide/from-home"
                step="4"
                count={HOME_ROUTES.length}
                title="routes from home"
                body="Ways in that need no visa and no move — for when leaving isn't the plan, or isn't possible yet."
              />
            </div>
          </div>
        </section>

        {/* ── Honest by design ── the promise both halves are built on. */}
        <section className="w-full border-y border-line bg-card">
          <div className="mx-auto max-w-6xl px-6 py-24 md:px-12 md:py-28 lg:px-20">
            <h2 className="max-w-3xl text-balance text-3xl font-medium tracking-tight text-ink md:text-5xl">
              Honest by design
            </h2>
            <p className="mt-6 max-w-3xl text-pretty text-lg font-light leading-relaxed text-ink/60 md:text-xl">
              We would rather tell you something is closed, expensive or out of
              reach than let you find out yourself in three months. Unknown
              facts never remove an opportunity from your list; unverified dates
              never get a countdown; and nothing is called free unless it is.
            </p>
          </div>
        </section>

        {/* ── The report ── still here, still free, now something you opt into.
          This is where the report-era material now lives: the scorecard preview,
          the university map and the logo row all belong to the admission
          analysis, and they say so. */}
        <section className="w-full bg-surface px-6 py-24 md:px-12 md:py-28 lg:px-20">
          <div className="mx-auto max-w-6xl">
            <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ivy">
                  When you&rsquo;re ready
                </p>
                <h2 className="mt-3 text-balance text-3xl font-medium tracking-tight text-ink md:text-4xl">
                  And an honest read on your university applications.
                </h2>
                <p className="mt-4 max-w-xl text-pretty text-lg font-light leading-relaxed text-ink/60">
                  Optional, free, and separate from everything above. Fill in a
                  profile and you get a competitiveness score out of 100,
                  per-school admission ranges, your grades and tests against
                  each school&rsquo;s admitted middle 50%, and a prioritised
                  list of what to fix — across the US, Italy, Hong Kong, the UAE
                  and Korea.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <ButtonLink
                    href={session ? "/dashboard" : "/auth/signup"}
                    variant="subtle"
                    size="md"
                    className="rounded-full"
                  >
                    {session ? t("common.dashboard") : "Assess my full profile"}
                  </ButtonLink>
                  <ButtonLink
                    href="/demo"
                    variant="ghost"
                    size="md"
                    className="rounded-full"
                  >
                    See a sample report
                  </ButtonLink>
                </div>
              </div>
              <div className="w-full justify-self-center lg:justify-self-end">
                <MiniScorecard t={t} />
              </div>
            </div>

            {/* The map belongs to this section: it plots the universities the
              analysis benchmarks you against. It mounts only when scrolled to. */}
            <div className="mt-16 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
              <div className="order-2 lg:order-1">
                <h3 className="text-balance text-2xl font-medium tracking-tight text-ink">
                  Benchmarked against real, named schools.
                </h3>
                <p className="mt-3 max-w-md text-pretty text-base font-light leading-relaxed text-ink/60">
                  Not a vibe check against &ldquo;top universities&rdquo;. Every
                  range is tied to a specific school&rsquo;s published
                  admitted-student data, in every country the report covers.
                </p>
              </div>
              <MapScene className="order-1 w-full lg:order-2" />
            </div>
          </div>
        </section>

        <section className="w-full border-y border-black/5 bg-card py-16">
          <div className="w-full px-6 md:px-12 lg:px-20">
            <p className="mb-10 text-center text-xs font-semibold uppercase tracking-widest text-ink-faint">
              Schools the report benchmarks you against
            </p>
            <UniversityLogos logos={universityLogos} />
          </div>
        </section>

        {/* ── For organisations ── the partner door, stated rather than hidden in
          the header where a phone never shows it. */}
        <section className="w-full px-6 py-20 md:px-12 lg:px-20">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-2xl border border-line bg-card p-8 md:flex-row md:items-center md:p-10">
            <div className="max-w-2xl">
              <h2 className="text-balance text-2xl font-medium tracking-tight text-ink">
                Running a competition, hackathon or programme?
              </h2>
              <p className="mt-2 text-pretty text-base font-light leading-relaxed text-ink/60">
                Post it under your own name, logo and verification tick, and it
                appears on the list students actually read — with your deadline
                treated as the organiser&rsquo;s own word, not a scrape.
              </p>
            </div>
            <ButtonLink
              href="/partners"
              variant="subtle"
              size="md"
              className="shrink-0 rounded-full"
            >
              For organisations
            </ButtonLink>
          </div>
        </section>

        <FAQ />

        <FinalCTA signedIn={!!session} />
      </main>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-sm font-light text-ink-faint">
        <div className="flex flex-col items-start justify-between gap-4 border-t border-black/10 pt-8 sm:flex-row sm:items-center">
          <Logo className="text-ink/80" />
          <nav className="flex flex-wrap items-center gap-5">
            <a href="/opportunities" className="transition hover:text-ink/70">
              Opportunities
            </a>
            <a href="/guide" className="transition hover:text-ink/70">
              Guide
            </a>
            {/* Also here, because the header link is hidden on a phone and half
                the people we want reading it will open this on a phone. */}
            <a href="/partners" className="transition hover:text-ink/70">
              For organisations
            </a>
            <a href="/privacy" className="transition hover:text-ink/70">
              Privacy Policy
            </a>
            <a href="/terms" className="transition hover:text-ink/70">
              Terms of Use
            </a>
          </nav>
          <p>© {new Date().getFullYear()} Compass. Guidance, not guarantees.</p>
        </div>
      </footer>
    </div>
  );
}

function Stat({
  value,
  label,
  note,
}: {
  value: number;
  label: string;
  note: string;
}) {
  return (
    <div>
      <p
        data-num
        className="font-display text-4xl font-semibold leading-none tracking-tight text-ink md:text-5xl"
      >
        {value}
      </p>
      <p className="mt-2 text-sm font-medium text-ink">{label}</p>
      <p className="mt-1.5 text-pretty text-sm font-light leading-relaxed text-ink-faint">
        {note}
      </p>
    </div>
  );
}

function GuideCard({
  href,
  step,
  count,
  title,
  body,
}: {
  href: string;
  step: string;
  count: number;
  title: string;
  body: string;
}) {
  return (
    <a
      href={href}
      className="group flex flex-col rounded-2xl border border-line bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift"
    >
      <span
        data-num
        className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint"
      >
        Step {step}
      </span>
      <p className="mt-3 flex items-baseline gap-2">
        <span
          data-num
          className="font-display text-3xl font-semibold leading-none text-ink"
        >
          {count}
        </span>
        <span className="text-base font-medium text-ink">{title}</span>
      </p>
      <p className="mt-2 flex-1 text-pretty text-sm font-light leading-relaxed text-ink/60">
        {body}
      </p>
      <span className="mt-4 text-sm font-medium text-ivy-ink transition-transform duration-300 group-hover:translate-x-0.5">
        Open →
      </span>
    </a>
  );
}
