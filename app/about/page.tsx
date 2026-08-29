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
// and its only contact was an address at the bottom of the terms.
//
// THREE RULES, and each is a defect this project has already had:
//
//  1. THE PROSE IS 17px AND `text-ink`. "Small, dark and dim" has been reported
//     four times, contrast measured innocent every time, and the real defect was
//     always size. Long-form here is `text-base`, never `text-sm`, and it takes
//     the strongest ink token rather than the soft one the guide uses for
//     secondary copy.
//  2. EVERY CLAIM IS SOURCED FROM THE PRODUCT. The counts are read from the
//     registries at render, like the landing page, so this page cannot quote a
//     number the reader will not then see.
//  3. THE PARTS ARE ONE ARRAY, READ TWICE — once by the contents list and once
//     as the sections. Same rule as a guide subject page: a part cannot exist in
//     the map and be missing from the page.
//
// The rhythm is the layout's whole argument, and it replaced a measured defect.
// The first version gave all eleven sections the identical interval (48px, 40px
// of padding and a hairline, every time), which is one spacing value repeated
// until nothing has more weight than anything else. Groups are expressed by
// PROXIMITY now: a generous gap and a rule open a group, a tight gap continues
// one. No group labels, because a label above a heading is a kicker and the
// heading already carries its own weight.
//
// The order changed with it. "Who makes this" used to sit tenth of eleven, four
// thousand eight hundred pixels down a page that is six and a half screens long,
// which is the one question most people open an About page to answer. It is
// second now, and the four groups read: why and who · what you get · how it is
// kept honest · the practical facts.

export const metadata: Metadata = pageMeta({
  title: "About Compass — who this is for, and what we refuse to do",
  description:
    "Compass is a free tool that shows school students what they can actually enter this year. Who builds it, how we check a date, and what we will not put on a card.",
  path: "/about",
  type: "article",
});

type Part = {
  id: string;
  title: string;
  /** Opens a new group: the generous interval and the rule above it. */
  opensGroup?: boolean;
  body: React.ReactNode;
};

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

  const parts: Part[] = [
    {
      id: "why",
      title: "Why this exists",
      opensGroup: true,
      body: (
        <>
          <P>
            Most lists of opportunities for students turn out to be written for
            university students, or for one country&rsquo;s nationals, and you
            find that out after reading the rules. If the rules are linked at
            all. Half the links are dead. The dates are from last year. A course
            listed as free charges for the certificate at the end.
          </P>
          <P>
            Those are not small annoyances. A student who plans around a guessed
            deadline and misses the real one has lost a year, and nobody tells
            them why. The whole product is built around not doing that to
            anyone.
          </P>
        </>
      ),
    },
    {
      // Second, not tenth. This is the question the page is opened to answer.
      // Its opening paragraph takes the lead size rather than a card: emphasis
      // from size, not from a container drawn around it.
      id: "who",
      title: "Who makes this",
      body: (
        <>
          <p className="max-w-[54ch] text-pretty text-lg leading-relaxed text-ink">
            We are Alibek Ussipbayev and Kirill Kim. We are in our final year at
            the Nazarbayev Intellectual School of Physics and Mathematics in
            Shymkent, Kazakhstan.
          </p>
          <P>
            We built this because we ran into every problem it solves. At the
            start we did not know what to enter, or how, or what we wanted out
            of any of it. Later the questions got bigger and no easier. Where do
            you apply? Which country, and why that one? Which faculty, and why?
            Which university? Where is the teaching better, where are the grants
            more generous, where is there work at the end of it, where are you
            allowed to stay? What is open to someone your age at all, and what
            is the catch in each case?
          </P>
          <P>
            Everything on this site is an answer we needed ourselves and had to
            find the slow way. We are still at school, which is not a
            credential, but it does mean we were the people this is for before
            we were the people making it.
          </P>
        </>
      ),
    },

    {
      id: "inside",
      title: "What is on the site",
      opensGroup: true,
      body: (
        <>
          <P>Three parts, in the order a student actually needs them.</P>
          <P>
            <Strong>Opportunities</Strong> is the front door. It holds{" "}
            <Num>{total}</Num> entries, of which <Num>{free}</Num> cost nothing
            at all. Answer one question, what year you are in at school, and the
            list narrows to what is open to you. You do not need an account for
            this.
          </P>
          <P>
            <Strong>The guide</Strong> is for the question underneath, which is
            usually where any of it leads. It walks from <Num>{areas}</Num>{" "}
            kinds of work, through the <Num>{MAJORS.length}</Num> subjects you
            would apply with, to <Num>{STUDY_DESTINATIONS.length}</Num>{" "}
            countries and the <Num>{HUBS.length}</Num> cities inside them. It
            also lists <Num>{HOME_ROUTES.length}</Num> routes that need no visa
            and no move.
          </P>
          <P>
            <Strong>The plan</Strong> is where what you committed to becomes
            dated work: an agenda, a board, and mind maps for thinking a
            decision through. That part is private to you.
          </P>
          <P>
            There is also an admission report, with per-school ranges for the
            US, Italy, Hong Kong, the UAE and Korea. It is free and it is
            optional. It used to be the first thing we asked people to fill in,
            which was backwards, so now it waits until you want it.
          </P>
        </>
      ),
    },
    {
      id: "cost",
      title: "What it costs",
      body: (
        <>
          <P>
            Compass is free, all of it, including the admission report. There is
            no paid tier and nothing is held back behind one.
          </P>
          <P>
            Some of the opportunities themselves cost money, which is exactly
            why every entry carries a cost label instead of a price we made up.
            Where we have not verified what something costs, the card says so
            and points at the official page.
          </P>
        </>
      ),
    },

    {
      id: "dates",
      title: "How we check a date",
      opensGroup: true,
      body: (
        <>
          <P>
            A countdown appears only when we have checked that date against the
            organiser&rsquo;s own page for the current cycle. Where we have not,
            the card says the dates are not announced yet, and it says that
            instead of guessing.
          </P>
          <P>
            A lot of entries never have a deadline to check.{" "}
            <Num>{alwaysOpen}</Num> of the <Num>{total}</Num> are open whenever
            you are ready to start: a self-paced course, a journal that reads
            submissions all year, a community you can join tonight. Those are
            the most useful rows we have for someone who has just found the
            site, and they used to be presented as the least, because &ldquo;no
            date&rdquo; was being shown as &ldquo;dates not announced&rdquo;.
          </P>
          <P>
            That rule costs us something. It means many entries show no clock,
            which looks less impressive than a page full of ticking numbers. We
            would rather look emptier than send someone to a form that closed in
            March.
          </P>
          <P>
            Every link in the catalog is tested on a schedule, and a broken one
            fails the build rather than sitting there quietly. The one thing a
            test cannot tell us is that a contest was discontinued, so the dates
            get a hand pass as well.
          </P>
        </>
      ),
    },
    {
      // Four refusals. They were four indistinguishable paragraphs, which is
      // prose pretending not to be a list; the reader could not count them or
      // come back to one.
      id: "refuse",
      title: "What we will not do",
      body: (
        <ul className="max-w-[54ch] space-y-5">
          <Refusal heading="We do not rank universities.">
            Positions rot within a year and they flatten a decision that is not
            one-dimensional, so the guide names institutions and says what they
            are known for, and stops there.
          </Refusal>
          <Refusal heading="We do not call something free unless it is free end to end.">
            &ldquo;Free to learn, pay for the certificate&rdquo; and &ldquo;free
            to enter, pay if you get through round one&rdquo; are the two cases
            students get caught by, so each has its own label rather than hiding
            under one word.
          </Refusal>
          <Refusal heading="A missing fact never removes an opportunity from your list.">
            If we do not know your grades, you still see the thing, with a note
            that we could not check that part. Being quietly shown less because
            of a blank field is the worst version of a tool like this.
          </Refusal>
          <Refusal heading="We do not tell you what kind of person you are.">
            The site asks you to compare real working days and notices what you
            pick, and it will say &ldquo;you chose the one where the result
            lands the same evening, twice&rdquo;. It will not hand you a
            personality type, because that is a claim we cannot support.
          </Refusal>
        </ul>
      ),
    },
    {
      id: "order",
      title: "What the order of the list means",
      body: (
        <>
          <P>
            The countries in the guide lead with the United States, Hong Kong,
            Italy, Korea and the UAE. That is not a ranking and it is not a
            recommendation. Those five are where Compass already works out your
            admission odds rather than only describing the place, so they are
            the ones with an engine behind them instead of prose alone.
          </P>
          <P>
            Past those five the order means nothing. Do not read anything into a
            country sitting seventh rather than ninth. Every profile is held to
            the same rules whatever position it is in: more trade-offs than
            strengths, a section naming who should look somewhere else, and no
            prices or rankings anywhere. A test fails the build if a profile
            breaks one of them.
          </P>
        </>
      ),
    },
    {
      id: "staying",
      title: "Staying is one of the answers",
      body: (
        <>
          <P>
            Leaving is not the default here. There are{" "}
            <Num>{HOME_ROUTES.length}</Num> routes that need no visa and no move
            at all, and Kazakhstan and Georgia carry full profiles like
            everywhere else.
          </P>
          <P>
            The Kazakhstan page says the mistake plainly: treating staying as
            failure. The students who do well from here choose the local degree
            deliberately, spend on tests and certificates what they did not
            spend on tuition, and leave later for a funded master&rsquo;s with a
            real record behind them. The ones who struggle enrol at home as a
            fallback, disengage for four years, and arrive at the same decision
            at twenty-two with nothing added.
          </P>
        </>
      ),
    },

    {
      id: "organisations",
      title: "Organisations posting here",
      opensGroup: true,
      body: (
        <>
          <P>
            A hub, a university or an olympiad can post its own competitions
            under its own name and logo. Approved organisations publish straight
            away with no queue, and a deadline they set is treated as confirmed,
            because it is the organiser stating their own date.
          </P>
          <P>
            The verification tick means one thing: we confirmed the account
            belongs to that organisation, and they posted this. It is not a
            quality rating and it never will be. If you run something for school
            students, <A href="/partners/apply">you can apply here</A>.
          </P>
        </>
      ),
    },
    {
      id: "privacy",
      title: "What we record about you",
      body: (
        <>
          <P>
            We count page views so we know whether any of this is being read.
            Those records keep the path of the page and nothing else. Query
            strings are stripped before anything is written, because our URLs
            carry referral codes and sign-in tokens, and none of that belongs in
            an analytics table.
          </P>
          <P>
            If you make an account, what you save is yours and you can ask for
            it to be deleted. The full detail is in the{" "}
            <A href="/privacy">privacy policy</A>.
          </P>
        </>
      ),
    },
    {
      id: "contact",
      title: "Getting in touch",
      body: (
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
      ),
    },
  ];

  return (
    <div className="min-h-dvh bg-surface text-ink">
      <SkipLink />

      <header className="border-b border-line/70">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-6 py-5">
          {/* Not wrapped in a Link. `BrandLink` IS one, with its own href and
              its own aria-label, so wrapping it nests an anchor inside an
              anchor: invalid HTML, and React fails hydration over it. */}
          <BrandLink transition={false} className="shrink-0" />
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
            programmes, narrowed to the ones open to someone their age, from the
            country they live in, with the real deadline and the real cost.
          </p>

          <Contents parts={parts} />

          {parts.map((part) => (
            <section
              key={part.id}
              id={part.id}
              // The rhythm, and the only structural decision on this page. A
              // group opens with a generous interval and a rule; a section
              // inside one follows at less than half that and no rule. Every
              // section used to take the identical 48/40, which is proximity
              // switched off.
              className={
                part.opensGroup
                  ? "mt-16 scroll-mt-6 border-t border-line pt-12"
                  : "mt-10 scroll-mt-6"
              }
            >
              <h2 className="text-2xl font-semibold tracking-tight text-ink">
                {part.title}
              </h2>
              <div className="mt-4 space-y-4">{part.body}</div>
            </section>
          ))}

          <div className="mt-16 flex flex-wrap items-center gap-3 border-t border-line pt-12">
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
 * What this page holds, and where to jump.
 *
 * Eleven sections over six and a half screens is exactly the length at which a
 * reader stops being able to tell what a page contains or where they are in it,
 * which is the complaint the guide's subject pages already answered. Same shape
 * as that answer: a `p` and not an `h2`, because this is the label on a
 * navigation widget and the `nav` is already named for assistive tech; a
 * heading here would put a 12px level above the 24px ones below it.
 */
function Contents({ parts }: { parts: Part[] }) {
  return (
    <nav
      aria-label="On this page"
      className="mt-8 rounded-2xl border border-line bg-card px-4 py-3 sm:px-5"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
        On this page
      </p>
      {/* One scrolling row on a phone, wrapping from `sm`. `-mx-1 px-1` so the
          focus ring on the first chip is not clipped by the scroll container. */}
      <ul className="-mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden">
        {parts.map((part) => (
          <li key={part.id} className="shrink-0">
            <a
              href={`#${part.id}`}
              className="inline-flex min-h-11 items-center whitespace-nowrap rounded-full border border-line bg-surface px-3.5 text-sm font-medium text-ink-soft transition-colors hover:border-accent hover:text-ink focus-visible:focus-ring sm:whitespace-normal"
            >
              {part.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
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

/**
 * One refusal. The claim carries the weight and the reason follows it in the
 * same block, so the four can be counted and returned to.
 */
function Refusal({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <li className="text-pretty text-base leading-relaxed text-ink">
      <strong className="font-semibold">{heading}</strong>{" "}
      <span className="text-ink">{children}</span>
    </li>
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
