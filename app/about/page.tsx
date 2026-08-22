import type { Metadata } from "next";
import Link from "@/components/ui/Link";
import { BrandLink } from "@/components/ui/BrandLink";
import { ButtonLink } from "@/components/ui/Button";
import { SKIP_TARGET, SkipLink } from "@/components/ui/SkipLink";
import { pageMeta } from "@/lib/seo";
import { CONTACT_EMAIL } from "@/lib/site";
import { COMPETITIONS, opportunityCost } from "@/lib/data/key-dates";
import { allCareerAreas } from "@/lib/data/careers";
import { MAJORS } from "@/lib/data/majors";
import { STUDY_DESTINATIONS } from "@/lib/data/study-destinations";
import { HUBS } from "@/lib/data/world";
import { HOME_ROUTES } from "@/lib/data/from-home";

// The page that says who this is for and what it refuses to do.
//
// It exists because of a gap nothing else on the site could close: a product
// that tells sixteen-year-olds where to apply had no page naming a human being,
// and its only contact was an address at the bottom of the terms. Every other
// trust signal we could honestly ship was already here, and this was the one
// that was missing.
//
// Two rules govern the writing, and both come from complaints this project has
// already had:
//
//  1. THE PROSE IS 17px AND `text-ink`. "Small, dark and dim" has been reported
//     four times, contrast measured innocent every time, and the real defect was
//     always size. So long-form here is `text-base`, never `text-sm`, and it
//     takes the strongest ink token rather than the soft one the guide uses for
//     its secondary copy. `max-w-[54ch]` caps the measure at about 61 real
//     characters in Source Sans.
//  2. EVERY CLAIM IS SOURCED FROM THE PRODUCT. The counts are read from the
//     registries at render, like the landing page, so this page cannot quote a
//     number the student will not then see. Nothing here describes a person or a
//     history, because that is not ours to invent.

export const metadata: Metadata = pageMeta({
  title: "About Compass — who this is for, and what we refuse to do",
  description:
    "Compass is a free tool that shows school students what they can actually enter this year. How we check a date, what we will not put on a card, and what the whole thing costs.",
  path: "/about",
  type: "article",
});

export default function AboutPage() {
  const total = COMPETITIONS.length;
  const free = COMPETITIONS.filter(
    (c) => opportunityCost(c).tone === "free",
  ).length;
  // Deliberately NOT the count of confirmed dates. Quoting "12 of 172 clear
  // that bar" reads as a 7% verification rate, when most of the remainder never
  // had a date to verify: they are open all year. The honest figure for this
  // section is the one that is true about the catalog rather than about us.
  const alwaysOpen = COMPETITIONS.filter((c) => c.alwaysOpen).length;
  const areas = allCareerAreas().length;

  return (
    <div className="min-h-dvh bg-surface text-ink">
      <SkipLink />

      <header className="border-b border-line/70">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-6 py-5">
          <Link href="/" aria-label="Compass home" className="shrink-0">
            <BrandLink transition={false} />
          </Link>
          <ButtonLink href="/opportunities" variant="subtle" size="sm">
            See what you can enter
          </ButtonLink>
        </div>
      </header>

      <main id={SKIP_TARGET} tabIndex={-1}>
        <article className="mx-auto max-w-3xl px-6 py-14 sm:py-20">
          <h1 className="text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
            About Compass
          </h1>

          {/* The lead is a step larger than the body and carries the whole
              answer, because a good share of readers will not go past it. */}
          <p className="mt-6 max-w-[54ch] text-pretty text-lg leading-relaxed text-ink">
            Compass is a free tool that shows school students what they can
            actually enter this year. Competitions, olympiads, courses and
            programmes, narrowed to the ones open to someone their age, from
            the country they live in, with the real deadline and the real
            cost.
          </p>

          <Section heading="Why this exists">
            <P>
              Most lists of opportunities for students turn out to be written
              for university students, or for one country&rsquo;s nationals, and
              you find that out after reading the rules. If the rules are linked
              at all. Half the links are dead. The dates are from last year. A
              course listed as free charges for the certificate at the end.
            </P>
            <P>
              Those are not small annoyances. A student who plans around a
              guessed deadline and misses the real one has lost a year, and
              nobody tells them why. The whole product is built around not doing
              that to anyone.
            </P>
          </Section>

          <Section heading="What is on the site">
            <P>
              Three parts, in the order a student actually needs them.
            </P>
            <P>
              <Strong>Opportunities</Strong> is the front door. It holds{" "}
              <Num>{total}</Num> entries, of which <Num>{free}</Num> cost
              nothing at all. Answer one question, what year you are in at
              school, and the list narrows to what is open to you. You do not
              need an account for this.
            </P>
            <P>
              <Strong>The guide</Strong> is for the question underneath, which
              is usually where any of it leads. It walks from{" "}
              <Num>{areas}</Num> kinds of work, through the{" "}
              <Num>{MAJORS.length}</Num> subjects you would apply with, to{" "}
              <Num>{STUDY_DESTINATIONS.length}</Num> countries and the{" "}
              <Num>{HUBS.length}</Num> cities inside them. It also lists{" "}
              <Num>{HOME_ROUTES.length}</Num> routes that need no visa and no
              move.
            </P>
            <P>
              <Strong>The plan</Strong> is where what you committed to becomes
              dated work: an agenda, a board, and mind maps for thinking a
              decision through. That part is private to you.
            </P>
            <P>
              There is also an admission report, with per-school ranges for the
              US, Italy, Hong Kong, the UAE and Korea. It is free and it is
              optional. It used to be the first thing we asked people to fill
              in, which was backwards, so now it waits until you want it.
            </P>
          </Section>

          <Section heading="How we check a date">
            <P>
              A countdown appears only when we have checked that date against
              the organiser&rsquo;s own page for the current cycle. Where we
              have not, the card says the dates are not announced yet, and it
              says that instead of guessing.
            </P>
            <P>
              A lot of entries never have a deadline to check.{" "}
              <Num>{alwaysOpen}</Num> of the <Num>{total}</Num> are open
              whenever you are ready to start: a self-paced course, a journal
              that reads submissions all year, a community you can join
              tonight. Those are the most useful rows we have for someone who
              has just found the site, and they used to be presented as the
              least, because &ldquo;no date&rdquo; was being shown as
              &ldquo;dates not announced&rdquo;.
            </P>
            <P>
              That rule costs us something. It means many entries show no clock,
              which looks less impressive than a page full of ticking numbers.
              We would rather look emptier than send someone to a form that
              closed in March.
            </P>
            <P>
              Every link in the catalog is tested on a schedule, and a broken
              one fails the build rather than sitting there quietly. The one
              thing a test cannot tell us is that a contest was discontinued, so
              the dates get a hand pass as well.
            </P>
          </Section>

          <Section heading="What we will not do">
            <P>
              We do not rank universities. Positions rot within a year and they
              flatten a decision that is not one-dimensional, so the guide names
              institutions and says what they are known for, and stops there.
            </P>
            <P>
              We do not call something free unless it is free end to end.
              &ldquo;Free to learn, pay for the certificate&rdquo; and &ldquo;free to
              enter, pay if you get through round one&rdquo; are the two cases
              students get caught by, so each has its own label rather than
              hiding under one word.
            </P>
            <P>
              A missing fact never removes an opportunity from your list. If we
              do not know your grades, you still see the thing, with a note that
              we could not check that part. Being quietly shown less because of
              a blank field is the worst version of a tool like this.
            </P>
            <P>
              We do not tell you what kind of person you are. The site asks you
              to compare real working days and notices what you pick, and it
              will say &ldquo;you chose the one where the result lands the same
              evening, twice&rdquo;. It will not hand you a personality type,
              because that is a claim we cannot support.
            </P>
          </Section>

          <Section heading="What the order of the list means">
            <P>
              The countries in the guide lead with the United States, Hong
              Kong, Italy, Korea and the UAE. That is not a ranking and it is
              not a recommendation. Those five are where Compass already works
              out your admission odds rather than only describing the place, so
              they are the ones with an engine behind them instead of prose
              alone.
            </P>
            <P>
              Past those five the order means nothing. Do not read anything into
              a country sitting seventh rather than ninth. Every profile is held
              to the same rules whatever position it is in: more trade-offs than
              strengths, a section naming who should look somewhere else, and no
              prices or rankings anywhere. A test fails the build if a profile
              breaks one of them.
            </P>
          </Section>

          <Section heading="Staying is one of the answers">
            <P>
              Leaving is not the default here. There are{" "}
              <Num>{HOME_ROUTES.length}</Num> routes that need no visa and no
              move at all, and Kazakhstan and Georgia carry full profiles like
              everywhere else.
            </P>
            <P>
              The Kazakhstan page says the mistake plainly: treating staying as
              failure. The students who do well from here choose the local
              degree deliberately, spend on tests and certificates what they did
              not spend on tuition, and leave later for a funded
              master&rsquo;s with a real record behind them. The ones who
              struggle enrol at home as a fallback, disengage for four years,
              and arrive at the same decision at twenty-two with nothing added.
            </P>
          </Section>

          <Section heading="What it costs">
            <P>
              Compass is free, all of it, including the admission report. There
              is no paid tier and nothing is held back behind one.
            </P>
            <P>
              Some of the opportunities themselves cost money, which is exactly
              why every entry carries a cost label instead of a price we made
              up. Where we have not verified what something costs, the card says
              so and points at the official page.
            </P>
          </Section>

          <Section heading="Organisations posting here">
            <P>
              A hub, a university or an olympiad can post its own competitions
              under its own name and logo. Approved organisations publish
              straight away with no queue, and a deadline they set is treated as
              confirmed, because it is the organiser stating their own date.
            </P>
            <P>
              The verification tick means one thing: we confirmed the account
              belongs to that organisation, and they posted this. It is not a
              quality rating and it never will be. If you run something for
              school students,{" "}
              <A href="/partners/apply">you can apply here</A>.
            </P>
          </Section>

          <Section heading="What we record about you">
            <P>
              We count page views so we know whether any of this is being read.
              Those records keep the path of the page and nothing else. Query
              strings are stripped before anything is written, because our URLs
              carry referral codes and sign-in tokens, and none of that belongs
              in an analytics table.
            </P>
            <P>
              If you make an account, what you save is yours and you can ask for
              it to be deleted. The full detail is in the{" "}
              <A href="/privacy">privacy policy</A>.
            </P>
          </Section>

          {/* The founders' own account, in their own words. Nothing here is
              inferred or filled in: the questions in the second paragraph are
              the ones they listed, in the order they listed them. If a detail
              is ever added to this section it has to come from them. */}
          <Section heading="Who makes this">
            <P>
              We are Alibek Ussipbayev and Kirill Kim. We are in our final year
              at the Nazarbayev Intellectual School of Physics and Mathematics
              in Shymkent, Kazakhstan.
            </P>
            <P>
              We built this because we ran into every problem it solves. At the
              start we did not know what to enter, or how, or what we wanted out
              of any of it. Later the questions got bigger and no easier. Where
              do you apply? Which country, and why that one? Which faculty, and
              why? Which university? Where is the teaching better, where are the
              grants more generous, where is there work at the end of it, where
              are you allowed to stay? What is open to someone your age at all,
              and what is the catch in each case?
            </P>
            <P>
              Everything on this site is an answer we needed ourselves and had
              to find the slow way. We are still at school, which is not a
              credential, but it does mean we were the people this is for before
              we were the people making it.
            </P>
          </Section>

          <Section heading="Getting in touch">
            <P>
              Write to{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-medium text-accent-ink underline underline-offset-4 transition-colors hover:text-ink focus-visible:focus-ring"
              >
                {CONTACT_EMAIL}
              </a>
              . If something on the site is wrong, a dead link, a date that has
              moved, a cost that is not what we said, that is the most useful
              message you can send us and we would rather have it than not.
            </P>
          </Section>

          <div className="mt-14 flex flex-wrap items-center gap-3 border-t border-line pt-10">
            <ButtonLink href="/opportunities" size="lg" shape="pill">
              See what you can enter
            </ButtonLink>
            <ButtonLink href="/guide" variant="subtle" size="lg" shape="pill">
              Where can it lead?
            </ButtonLink>
          </div>
        </article>
      </main>

      <footer className="border-t border-line/70">
        <div className="mx-auto flex max-w-3xl flex-col items-start justify-between gap-3 px-6 py-8 text-base text-ink-soft sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Compass. Guidance, not guarantees.</p>
          <nav className="flex flex-wrap items-center gap-5">
            <Link href="/privacy" className="transition-colors hover:text-ink">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-ink">
              Terms of Use
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

/**
 * One topic. `h2` at a single size across the whole page, because the defect
 * behind "it reads as a wall of text" was headings rendering at four sizes with
 * a smaller level appearing above a larger one. One level, one size.
 */
function Section({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12 border-t border-line pt-10">
      <h2 className="text-2xl font-semibold tracking-tight text-ink">
        {heading}
      </h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

/** Body copy: 17px, the strongest ink, capped at a readable measure. */
function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="max-w-[54ch] text-pretty text-base leading-relaxed text-ink">
      {children}
    </p>
  );
}

/** The name of one part of the product, inside a sentence. */
function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-ink">{children}</strong>;
}

/**
 * A figure read from a registry at render. Tabular so a row of them does not
 * jitter, and marked so it is obvious in the source which numbers are computed
 * rather than typed.
 */
function Num({ children }: { children: React.ReactNode }) {
  return (
    <span data-num className="font-semibold text-ink">
      {children}
    </span>
  );
}

function A({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="font-medium text-accent-ink underline underline-offset-4 transition-colors hover:text-ink focus-visible:focus-ring"
    >
      {children}
    </Link>
  );
}
