import { Logo } from "@/components/ui/Logo";
import { SKIP_TARGET, SkipLink } from "@/components/ui/SkipLink";
import { ButtonLink } from "@/components/ui/Button";
import { UniversityLogos } from "@/components/marketing/UniversityMarquee";
import { MiniScorecard } from "@/components/marketing/MiniScorecard";
import { MapScene } from "@/components/marketing/MapScene";
import { RotatingHeadline } from "@/components/marketing/RotatingHeadline";
import { HeroField } from "@/components/marketing/HeroField";
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
    <div className="min-h-screen overflow-x-hidden bg-surface text-ink selection:bg-ink selection:text-surface">
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
              className="whitespace-nowrap px-2 sm:px-4"
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
              shape="pill"
              className="whitespace-nowrap sm:px-5"
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
          {/* The section's light, and the first child on purpose. It is
            positioned with NO z-index, and so is the content grid below it, so
            paint order is DOM order — no negative z-index, which would have put
            it behind the section's own background and rendered it invisible. */}
          <HeroField />
          {/* The split is 56/44 with a 56px gap, and both numbers are load-bearing.
            It used to be a fixed 560px track beside `1fr`, with the card capped at
            `max-w-lg` and pushed to the far edge — which spent 80px of gap plus
            113px of empty track, 193px in all, on the space between the headline
            and the one piece of product on the page. Worse, 560px is narrower than
            the longest rotating phrase (616px at 60px type), so the headline's
            second line reserved two lines and rendered one: a 63px hole that
            appeared and vanished every 2.6 seconds. Fractional tracks close the
            gap, the card fills its own column, and the type below fits. */}
          <div className="relative mx-auto grid w-full max-w-[1600px] grid-cols-1 items-center gap-12 px-6 py-24 md:px-12 lg:grid-cols-[minmax(0,56fr)_minmax(0,44fr)] lg:gap-14 lg:py-28 xl:px-20">
            {/* Left — the message */}
            <div className="relative z-10 max-w-xl lg:max-w-none">
              <span className="rise-in inline-flex items-center rounded-full border border-ink/10 bg-card px-3.5 py-1.5 text-xs font-medium text-ink/60">
                Free · no account needed · for students anywhere
              </span>
              {/* The size is a clamp, not three breakpoint steps, because it has
                to agree with the column beside it at every width — and a
                breakpoint agrees at three. The rule: the longest rotating phrase
                measures ~10.3× the font-size, so the type must stay under
                columnWidth / 10.3 or the slot reserves a line it doesn't use.
                This ramp is 45px at 1024 and reaches the original 60px at 1440,
                which clears that bound at every width in between (worst case
                1280, where the wider gutters kick in: 58px allowed, 54px used).
                Shortening or lengthening a phrase changes that 10.3 — measure
                before editing the copy below. */}
              <h1 className="rise-in mt-6 text-balance text-[2.75rem] font-medium leading-[1.04] tracking-tight text-ink sm:text-[3.25rem] lg:text-[clamp(2.8125rem,3.606vw_+_0.5052rem,3.75rem)]">
                See what you can enter.
                {/* These three are near-identical in RENDERED width — 8.69,
                  9.04 and 9.05 times the font-size — and that is the whole
                  point, not a coincidence. The slot reserves the longest
                  phrase's line count; any phrase shorter than that reserve
                  leaves a hole. "Then make your move." used to sit here at
                  10.27, which is why one phrase in three wrapped to two lines
                  on a 430–500px phone while the other two stayed on one.
                  Keep any replacement at or under 9.1× — and measure it,
                  don't count characters: this phrase and the one it replaced
                  are both 19–20 characters and differ by 95px. */}
                <RotatingHeadline
                  phrases={[
                    "Then go and win it.",
                    "Then go and own it.",
                    "Then close the gap.",
                  ]}
                />
              </h1>
              <p
                className="rise-in mt-6 max-w-md text-pretty text-lg font-light leading-relaxed text-ink/60 lg:max-w-[34rem]"
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
                {/* Both of these used to restate the entire variant by hand —
                  fill, text colour, padding, weight, transition, hover — and
                  two of those classes never took effect. They are the system's
                  now, so a change to `primary` reaches the button that matters
                  most instead of stopping at it. */}
                <ButtonLink href="/opportunities" size="lg" shape="pill">
                  See what you can enter
                </ButtonLink>
                <ButtonLink
                  href="/guide"
                  variant="subtle"
                  size="lg"
                  shape="pill"
                >
                  Where can it lead?
                </ButtonLink>
              </div>

              {/* The report is the product's second door, and it was the
                faintest thing in the hero — `text-ink-faint` running into a
                link at `text-ink/60`, i.e. quieter than the disclaimer it read
                like. It is its own affordance now: a strip, not a footnote.
                Deliberately NOT a third button — one primary CTA per view, and
                two filled controls competing is how you get neither pressed. A
                bordered strip sits a clear step below the outlined secondary
                while still being something you can see from across the room. */}
              <div
                className="rise-in mt-7 flex w-fit max-w-full flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border border-line bg-card px-4 py-3"
                style={{ animationDelay: "0.24s" }}
              >
                <span className="rounded-full bg-ivy-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ivy-ink">
                  Also free
                </span>
                <span className="text-sm text-ink/70">
                  Applying to university too?
                </span>
                <a
                  href="/demo"
                  className="group inline-flex items-center gap-1 rounded text-sm font-semibold text-ivy-ink underline-offset-4 transition hover:underline focus-visible:focus-ring"
                >
                  See a sample admission report
                  <span
                    aria-hidden="true"
                    className="transition-transform duration-300 group-hover:translate-x-0.5"
                  >
                    →
                  </span>
                </a>
              </div>
            </div>

            {/* Right — the product. */}
            <div
              className="rise-in relative w-full"
              style={{ animationDelay: "0.1s" }}
            >
              {/* `max-w-lg` stays below lg, where the card is centred under the
                message and 512px is a sensible measure. From lg it must go: the
                cap was leaving 113px of its own column empty. */}
              <div className="mx-auto w-full max-w-lg lg:ml-auto lg:mr-0 lg:max-w-none">
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
        <section className="w-full border-y border-band-ink/10 bg-band px-6 py-24 text-band-ink md:px-12 md:py-28 lg:px-20">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-band-ink/65">
              The problem
            </p>
            <h2 className="mt-3 max-w-2xl text-balance text-3xl font-medium tracking-tight md:text-4xl lg:text-[2.75rem]">
              The lists exist. They&rsquo;re just not for you.
            </h2>
            <p className="mt-4 max-w-2xl text-pretty text-lg font-light leading-relaxed text-band-ink/60">
              Search &ldquo;olympiads for school students&rdquo; and you get
              hundreds of results. Almost none of them tell you the one thing
              that decides everything: whether someone your age, in your
              country, can enter at all.
            </p>
            <div className="mt-12 grid gap-5 sm:grid-cols-3">
              {PAINS.map((p) => (
                <div
                  key={p.n}
                  className="rounded-2xl border border-band-ink/10 bg-band-ink/[0.04] p-6"
                >
                  {/* white/50, not white/30. At 30% these ordinals sat at 2.69:1
                    against the tinted card on the dark band — they read as a
                    smudge rather than as "this is the first of three", which is
                    the only job they have. 50% is 5.0:1 and still clearly
                    subordinate to the heading beside it. */}
                  <span
                    data-num
                    className="font-display text-sm font-semibold text-band-ink/65"
                  >
                    {p.n}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold tracking-tight text-band-ink">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-pretty text-sm leading-relaxed text-band-ink/60">
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
                body="Including Almaty, Astana and Tbilisi — the map does not stop at the countries we profile."
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
                    shape="pill"
                  >
                    {session ? t("common.dashboard") : "Assess my full profile"}
                  </ButtonLink>
                  <ButtonLink
                    href="/demo"
                    variant="ghost"
                    size="md"
                    shape="pill"
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
              shape="pill"
              className="shrink-0"
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
  // Hover lifts it, press puts it back down, focus rings it. A card that only
  // answers a pointer is a card a keyboard user cannot find.
  return (
    <a
      href={href}
      className="group flex flex-col rounded-2xl border border-line bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift focus-visible:focus-ring active:translate-y-0 active:shadow-card"
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
