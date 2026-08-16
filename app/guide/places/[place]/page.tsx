import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/ui/Link";
import {
  DetailShell,
  ForYou,
  GuideBlock,
  GuidePart,
  PageContents,
} from "@/components/guide/parts";
import { FACULTY_LABEL } from "@/lib/data/faculties";
import { fieldsSuffix, withFields } from "@/lib/data/guide-fields";
import { guideMorph } from "@/lib/data/guide-sections";
import { HUBS } from "@/lib/data/world";
import {
  STUDY_DESTINATIONS,
  destinationById,
  type StudyDestination,
} from "@/lib/data/study-destinations";
import {
  ENGLISH_TAUGHT_LABEL,
  universitiesForPlace,
} from "@/lib/data/place-universities";
import { statedGuideFields } from "@/lib/guide/student-fields";
import { guidePickState, type PlanPickState } from "@/lib/guide/plan-state";
import { AddToPlan } from "@/components/guide/AddToPlan";
import { WorkFromHere } from "@/components/guide/Spine";
import { areasForDestination } from "@/lib/data/spine";
import { pageMeta } from "@/lib/seo";

// One destination, in full: what it uniquely gives, what it costs you, what
// admissions weighs, what happens after you graduate, and who should not come.
//
// Moved here from `/guide/[place]`. The shell and the guide's own tabs come from
// app/guide/layout.tsx now; this file is only the profile.

// `notFound()` below is a real 404 again. It had not been one: a section-wide
// `loading.tsx` flushed the response — status line included — before this page
// ran, so `/guide/places/anything` answered 200 carrying a not-found page and
// invited a crawler to index an address that does not exist. The boundary is
// now scoped to the list routes; see app/guide/(index)/loading.tsx.
export async function generateMetadata({
  params,
}: {
  params: { place: string };
}): Promise<Metadata> {
  const d = destinationById(params.place);
  if (!d) return { title: "Not found — Compass" };
  return pageMeta({
    title: `Studying in ${d.name} — the honest picture | Compass`,
    description: d.oneLine,
    path: `/guide/places/${d.id}`,
    type: "article",
  });
}

export default async function DestinationPage({
  params,
  searchParams,
}: {
  params: { place: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const destination = destinationById(params.place);
  if (!destination) notFound();

  return (
    <DestinationBody
      destination={destination}
      stated={statedGuideFields(searchParams)}
      // Resolved in the route rather than inside the body, so the body stays
      // the pure renderer it already was. One cached read — see plan-state.ts.
      pick={await guidePickState("place", params.place)}
    />
  );
}

function DestinationBody({
  destination: d,
  stated,
  pick,
}: {
  destination: StudyDestination;
  stated: ReturnType<typeof statedGuideFields>;
  pick: PlanPickState;
}) {
  const hubs = HUBS.filter((h) => d.hubs.includes(h.id));
  const named = universitiesForPlace(d.id);
  const others = STUDY_DESTINATIONS.filter((x) => x.id !== d.id);

  // The page's skeleton, declared once and read twice — by the contents list at
  // the top and by the sections themselves. Two readers of one array is the
  // whole reason a part cannot appear in the map and be missing from the page.
  //
  // The grouping is the fix for "it is just a wall of text": nine equal boxes
  // gave a reader no way to tell what a page contained or where they were in
  // it. These are the four questions in the order they get asked — what is the
  // trade, what does it cost, how do I get in, what is it like there and after.
  const parts: { id: string; title: string; body: React.ReactNode }[] = [
    {
      id: "the-deal",
      title: "What it gives, what it costs",
      body: (
        <>
          <section className="rounded-2xl border border-ivy/25 bg-ivy-soft/40 p-5 sm:p-6">
            <h3 className="text-sm font-semibold text-ivy-ink">
              What only this place gives you
            </h3>
            <p className="mt-2 max-w-[54ch] text-base leading-relaxed text-ink">
              {d.unique}
            </p>
          </section>

          {/* Strengths and trade-offs side by side, deliberately equal in
              weight. A page that lists five upsides and one caveat is a
              brochure. */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Column title="What is good here" items={d.strengths} tone="good" />
            <Column title="What it costs you" items={d.tradeoffs} tone="bad" />
          </div>
        </>
      ),
    },
    {
      id: "money",
      title: "Money",
      body: <GuideBlock label="How paying for it works">{d.money}</GuideBlock>,
    },
    {
      id: "getting-in",
      title: "Getting in",
      body: (
        <>
          <GuideBlock label="What they weigh">{d.admissions}</GuideBlock>
          {/* Timing is the way a strong applicant most often loses a place, and
              unlike merit it is entirely preventable by knowing it early. */}
          <GuideBlock label="The cycle — when things actually happen">
            {d.applicationCycle}
          </GuideBlock>
          <GuideBlock label="How an application is actually read here">
            {d.howTheyRead}
          </GuideBlock>
          <GuideBlock label="What applicants from this region get wrong">
            {d.commonMistake}
          </GuideBlock>
        </>
      ),
    },
    // "How do I get in" is only half a question — in to WHERE. The guide
    // explained a country's admissions, money and visa ladder in full and then
    // never named an institution, so a student who had decided on Germany still
    // had nothing to search for on Monday morning. This is that half.
    {
      id: "where",
      title: "Who is named here",
      body: (
        <>
          <p className="max-w-[54ch] text-sm leading-relaxed text-ink-soft">
            Not a ranking, and deliberately not in any order of merit — these
            are the places a subject is actually studied and taught at here, so
            you have something to search for. A position in a league table is
            stale within a year, differs between the four tables that publish
            one, and is the wrong first question. What each is named for holds
            for years.
          </p>
          <ul className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {named.map((u) => (
              <li
                key={u.name}
                className="flex h-full flex-col rounded-2xl border border-line bg-card p-4"
              >
                <p className="text-sm font-semibold leading-snug text-ink">
                  {u.name}
                </p>
                <p className="mt-1 text-xs text-ink-faint">
                  {/* A city we profile opens; one we don't is plain text. Naming
                      a city as if it were a page and dead-ending there was a
                      real bug once. */}
                  {u.hub ? (
                    <Link
                      href={withFields(`/guide/cities/${u.hub}`, stated)}
                      className="rounded underline-offset-2 transition-colors hover:text-ink hover:underline focus-visible:focus-ring"
                    >
                      {u.city}
                    </Link>
                  ) : (
                    u.city
                  )}
                </p>
                <ul className="mt-2.5 flex flex-1 flex-wrap content-start gap-1.5">
                  {u.knownFor.map((f) => (
                    <li
                      key={f}
                      className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-ink-soft"
                    >
                      {FACULTY_LABEL[f]}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-ink-soft">
                  {ENGLISH_TAUGHT_LABEL[u.englishTaught]}
                </p>
              </li>
            ))}
          </ul>
          <p className="max-w-[54ch] text-xs text-ink-faint">
            Language of teaching is the one thing here that moves within a
            cycle. A country can widen or cut its English-taught intake in a
            single year. Check it on the university&rsquo;s own page, for your
            own entry year.
          </p>
        </>
      ),
    },
    {
      id: "living",
      title: "Living there, and after",
      body: (
        <>
          <GuideBlock label="What studying there is like">
            {d.studyingThere}
          </GuideBlock>
          <GuideBlock label="After you graduate">
            {d.afterStudy}
            <span className="mt-1.5 block text-xs text-ink-faint">
              Post-study work rules are set by politics and change. Check the
              rule for your own graduation year before you plan around it.
            </span>
          </GuideBlock>
        </>
      ),
    },
  ];

  // The claim "checked against the organiser or the government that sets the
  // rule" was unprovable while the guide linked to none of them — and the
  // catalog next door has shipped "Official page ↗" on every row for months.
  // This is that pattern, applied to the layer that makes the bigger claims.
  parts.push({
    id: "sources",
    title: "Check it yourself",
    body: (
      <>
        <p className="max-w-[54ch] text-sm leading-relaxed text-ink-soft">
          The rules on this page are set by these bodies, not by us. Immigration
          and fee rules in particular change between the year you read this and
          the year you graduate, so open the one that decides your case and read
          it for your own year.
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {d.sources.map((s) => (
            <li key={s.url}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-full items-start justify-between gap-3 rounded-2xl border border-line bg-card p-4 text-sm font-medium text-ink-soft transition-colors hover:border-accent hover:text-ink focus-visible:focus-ring"
              >
                <span>{s.label}</span>
                <span aria-hidden className="shrink-0 text-ink-faint">
                  &#8599;
                </span>
              </a>
            </li>
          ))}
        </ul>
        <p className="text-xs text-ink-faint">Links checked August 2026.</p>
      </>
    ),
  });

  const areas = areasForDestination(d);
  if (areas.length > 0) {
    parts.push({
      id: "leads-to",
      title: "What studying here is a route into",
      body: <WorkFromHere areas={areas} stated={stated} where={d.name} />,
    });
  }

  if (hubs.length > 0) {
    parts.push({
      id: "cities",
      title: "The cities inside it",
      body: (
        <>
          <p className="max-w-[54ch] text-sm text-ink-soft">
            Each one opens its own page: what clusters there, the catch, and the
            door in for someone who is not from there.
          </p>
          <ul className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {hubs.map((h) => (
              <li key={h.id}>
                <Link
                  href={withFields(`/guide/cities/${h.id}`, stated)}
                  className="group flex h-full flex-col rounded-2xl border border-line bg-card p-4 transition-colors hover:border-accent focus-visible:focus-ring"
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-ink">
                      {h.city}{" "}
                      <span className="font-normal text-ink-faint">
                        {h.country}
                      </span>
                    </span>
                    <span
                      aria-hidden
                      className="shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-accent motion-reduce:transition-none"
                    >
                      &rarr;
                    </span>
                  </span>
                  <span className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-soft">
                    {h.what}
                  </span>
                  <span className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-faint">
                    <span className="font-medium text-ink-soft">
                      The catch:
                    </span>{" "}
                    {h.catch}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      ),
    });
  }

  return (
    <DetailShell
      crumb="Countries"
      crumbHref={withFields("/guide/places", stated)}
      title={d.name}
      transitionName={guideMorph("place", d.id)}
      sub={d.where}
      lead={d.oneLine}
      aside={
        <>
          {/* First in the rail, because it is the one thing on this page that
              changes something rather than telling you something. */}
          <AddToPlan
            kind="place"
            id={d.id}
            label={d.name}
            signedIn={pick.signedIn}
            saved={pick.saved}
            maps={pick.maps}
            returnTo={`/guide/places/${d.id}`}
          />
          <section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-ink">
              Strongest fields here
            </h2>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {d.fields.map((f) => (
                <li
                  key={f}
                  className="rounded-lg border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink-soft"
                >
                  {FACULTY_LABEL[f]}
                </li>
              ))}
            </ul>
          </section>

          {/* This panel used to be headed "Compare it with" and did not compare: the
              chips navigated to the other country's page, replacing the one you were
              reading. It promised the guide's whole premise — nobody chooses a
              country in isolation — and then threw away one of the two sides. Each
              chip now opens both countries next to each other on the same axes. */}
          <section className="rounded-2xl border border-line bg-card p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-ink">
              Compare {d.name} with&hellip;
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Nobody chooses a country in isolation. Pick one and the two are
              laid out side by side — money, admissions, what happens after you
              graduate, and who each one is wrong for.
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {others.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/guide/compare?a=${d.id}&b=${o.id}${fieldsSuffix(stated)}`}
                    className="inline-flex h-11 items-center rounded-full border border-line bg-surface px-4 text-sm font-medium text-ink-soft transition-[background-color,border-color,color,transform] duration-200 ease-out hover:border-accent hover:text-ink active:scale-[0.96] active:duration-75 focus-visible:focus-ring motion-reduce:transform-none motion-reduce:transition-none"
                  >
                    {o.name}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-5">
              <Link
                href="/opportunities"
                className="inline-flex h-11 items-center rounded-xl bg-ink px-5 text-sm font-medium text-surface transition-colors hover:bg-ink/90 focus-visible:focus-ring"
              >
                What you can enter from home this year &rarr;
              </Link>
            </div>
          </section>
        </>
      }
    >
      {d.modelled && (
        <p className="-mt-2 inline-flex items-center rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent-ink">
          Compass calculates your admission odds for this destination
        </p>
      )}

      {/* The answer before the description. This pair used to close the page,
          under seven blocks of prose — so the only two sentences addressed to
          the reader were the ones they were least likely to reach, and the
          profile read as an encyclopaedia entry rather than as guidance. */}
      <ForYou suits={d.suitsYou} avoid={d.notForYou} />

      <PageContents parts={parts} />

      {parts.map((part, i) => (
        <GuidePart key={part.id} id={part.id} step={i + 1} title={part.title}>
          {part.body}
        </GuidePart>
      ))}
    </DetailShell>
  );
}

/**
 * One half of the honesty pair. Both halves are tinted, and tinted equally: the
 * two used to be a white card beside a `bg-surface/60` card, which is the same
 * card twice as far as a reader is concerned — the one comparison the page
 * exists to make was the least visible thing on it. Equal weight is the rule
 * (five upsides and one caveat is a brochure); equal weight at zero contrast is
 * just a rule nobody can see being followed.
 */
function Column({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "good" | "bad";
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        tone === "good"
          ? "border-accent/35 bg-accent-soft/25"
          : "border-reach/30 bg-reach-soft/30"
      }`}
    >
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <ul className="mt-3 max-w-[54ch] space-y-2.5">
        {items.map((item) => (
          <li
            key={item}
            className="flex gap-2.5 text-sm leading-relaxed text-ink-soft"
          >
            <span
              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                tone === "good" ? "bg-accent" : "bg-reach"
              }`}
              aria-hidden
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
