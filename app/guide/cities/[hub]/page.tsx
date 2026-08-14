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
import { withFields } from "@/lib/data/guide-fields";
import { guideMorph } from "@/lib/data/guide-sections";
import { HUBS, REGION_LABEL } from "@/lib/data/world";
import { destinationForHub } from "@/lib/data/study-destinations";
import {
  ENGLISH_TAUGHT_LABEL,
  universitiesForHub,
} from "@/lib/data/place-universities";
import { statedGuideFields } from "@/lib/guide/student-fields";
import { guidePickState } from "@/lib/guide/plan-state";
import { AddToPlan } from "@/components/guide/AddToPlan";
import { WorkFromHere } from "@/components/guide/Spine";
import { areasForHub } from "@/lib/data/spine";
import { pageMeta } from "@/lib/seo";

// One city, in full. Same three facts as everywhere in world.ts and in the same
// order every time: what it is, what the catch is, how someone who is not from
// there actually gets in. The catch is not below the fold and not in smaller
// type — a place whose downside is harder to find than its appeal is being sold.

export async function generateMetadata({
  params,
}: {
  params: { hub: string };
}): Promise<Metadata> {
  const hub = HUBS.find((h) => h.id === params.hub);
  if (!hub) return { title: "Not found — Compass" };
  return pageMeta({
    title: `Working in ${hub.city} — the catch and the way in | Compass`,
    description: hub.what,
    path: `/guide/cities/${hub.id}`,
    type: "article",
  });
}

export default async function GuideHubPage({
  params,
  searchParams,
}: {
  params: { hub: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const hub = HUBS.find((h) => h.id === params.hub);
  if (!hub) notFound();

  // Whether this is already on the reader's plan. One cached read, shared with
  // whatever else on this request asks — see lib/guide/plan-state.ts.
  const pick = await guidePickState("hub", params.hub);
  const stated = statedGuideFields(searchParams);
  const country = destinationForHub(hub.id);
  const nearby = HUBS.filter(
    (h) => h.region === hub.region && h.id !== hub.id,
  ).slice(0, 5);

  // Seven equal boxes in a column told a reader nothing about what the page
  // held. Three named parts do, and the order is the order the questions come:
  // can I even get in and what does it cost me, what are the years there like,
  // and what work is actually here. The catch still opens the page — the rule
  // this whole layer is built on.
  const parts: { id: string; title: string; body: React.ReactNode }[] = [
    {
      id: "in",
      title: "The catch, and the way in",
      body: (
        <>
          <GuideBlock label="The catch" tone="warn">
            {hub.catch}
          </GuideBlock>
          <GuideBlock label="The way in" tone="good">
            {hub.route}
          </GuideBlock>
        </>
      ),
    },
    {
      id: "living",
      title: "Living there",
      body: (
        <>
          <GuideBlock label="What living here is actually like">
            {hub.dayHere}
          </GuideBlock>
          <GuideBlock label="How the money works">
            {hub.money}
            <span className="mt-1.5 block max-w-[60ch] text-xs text-ink-faint">
              Described in shape rather than figures on purpose: rents and
              salaries move every year and we cannot keep numbers true, but what
              is expensive and what quietly eats income stays true for far
              longer.
            </span>
          </GuideBlock>
          <GuideBlock label="The language you actually need">
            {hub.language}
          </GuideBlock>
        </>
      ),
    },
    {
      id: "work",
      title: "The work that clusters here",
      // Was a list of field LABELS and nothing else — it named the fields and
      // gave no way to read what any of them means, which is the dead end the
      // spine exists to close. Every area is a page now.
      body: (
        <WorkFromHere
          areas={areasForHub(hub)}
          stated={stated}
          where={hub.city}
        />
      ),
    },
  ];

  // Read out of the same registry the country page uses, filtered to this city,
  // so the two can never disagree about who is here. A test pins that.
  const named = universitiesForHub(hub.id);
  if (named.length > 0) {
    parts.push({
      id: "who",
      title: "Who is named here",
      body: (
        <>
          <p className="max-w-[60ch] text-sm leading-relaxed text-ink-soft">
            Not a ranking and not in order of merit — the places a subject is
            actually studied and taught at in this city, so you have something
            to search for.
          </p>
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {named.map((u) => (
              <li
                key={u.name}
                className="flex h-full flex-col rounded-2xl border border-line bg-card p-4"
              >
                <p className="text-sm font-semibold leading-snug text-ink">
                  {u.name}
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
          <p className="text-xs text-ink-faint">
            Language of teaching moves within a cycle — check it on the
            university&rsquo;s own page for your own entry year.
          </p>
        </>
      ),
    });
  }

  return (
    <DetailShell
      // A city is inside a country, so when we have that country's profile the
      // crumb IS the country — the trail then reads Guide / Germany / Berlin,
      // which is the containment stated rather than implied. Where there is no
      // profile (Almaty, Tashkent, Tbilisi and six more) the crumb falls back to
      // the full list, which is why that list still exists.
      crumb={country ? country.name : "Cities"}
      crumbHref={withFields(
        country ? `/guide/places/${country.id}` : "/guide/cities",
        stated,
      )}
      title={hub.city}
      transitionName={guideMorph("hub", hub.id)}
      sub={`${hub.country} · ${REGION_LABEL[hub.region]}`}
      lead={hub.what}
      aside={
        <>
          {/* First in the rail, because it is the one thing on this page that
              changes something rather than telling you something. */}
          <AddToPlan
            kind="hub"
            id={hub.id}
            label={hub.city}
            signedIn={pick.signedIn}
            saved={pick.saved}
            maps={pick.maps}
            returnTo={`/guide/cities/${hub.id}`}
          />
          {/* If this city sits in a country we profile in full, that page is the
              next question the student will have. */}
          {country && (
            <Link
              href={withFields(`/guide/places/${country.id}`, stated)}
              className="flex items-start justify-between gap-3 rounded-2xl border border-accent/40 bg-accent-soft/25 p-5 transition-colors hover:border-accent focus-visible:focus-ring"
            >
              <span>
                <span className="text-sm font-semibold text-ink">
                  Everything about {country.name}
                </span>
                <span className="mt-0.5 block text-sm text-ink-soft">
                  {country.oneLine}
                </span>
              </span>
              <span aria-hidden className="shrink-0 text-ink-faint">
                &rarr;
              </span>
            </Link>
          )}

          {nearby.length > 0 && (
            <section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-ink">
                Others in {REGION_LABEL[hub.region]}
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {nearby.map((h) => (
                  <li key={h.id}>
                    <Link
                      href={withFields(`/guide/cities/${h.id}`, stated)}
                      className="inline-flex h-11 items-center rounded-full border border-line bg-surface px-3.5 text-sm font-medium text-ink-soft transition-colors hover:border-accent hover:text-ink focus-visible:focus-ring"
                    >
                      {h.city}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      }
    >
      {/* Who it is for, before the description of it — the same reordering the
          country profiles got. On a city this is one field rather than two, so
          it renders as one full-width answer. */}
      <ForYou
        suits={hub.whoThrives}
        suitsLabel="Who this suits, and who it doesn’t"
      />

      <PageContents parts={parts} />

      {parts.map((part, i) => (
        <GuidePart key={part.id} id={part.id} step={i + 1} title={part.title}>
          {part.body}
        </GuidePart>
      ))}
    </DetailShell>
  );
}
