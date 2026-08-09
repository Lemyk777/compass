import type { Metadata } from "next";
import Link from "@/components/ui/Link";
import { FieldFilter } from "@/components/guide/FieldFilter";
import {
  GuideCard,
  ListHead,
  NextStep,
  SectionIntro,
} from "@/components/guide/parts";
import { withFields } from "@/lib/data/guide-fields";
import { guideMorph, guideSection } from "@/lib/data/guide-sections";
import { hubsByCountry, REGION_LABEL } from "@/lib/data/world";
import { destinationForHub } from "@/lib/data/study-destinations";
import { guideView } from "@/lib/guide/student-fields";
import { pageMeta } from "@/lib/seo";

// Step 3: the cities inside the countries — grouped BY country, because they are
// inside them. The guide used to run cities before countries, which asked a
// student to weigh Berlin and then zoomed out to Germany a step later.
//
// The step survived that reordering rather than being folded into the country
// pages, and the reason is in the data: 9 of the 22 hubs sit in countries we do
// not profile, and four of those — Almaty, Astana, Tashkent, Tbilisi — are the
// home region. Nesting cities strictly under country profiles would have
// deleted our own students' cities from the map.
//
// Pure server rendering: this list has no interactive state at all now that the
// filter lives in the URL.

const SECTION = guideSection("cities");

export const metadata: Metadata = pageMeta({
  title: "The cities the work sits in — Compass",
  description: SECTION.blurb,
  path: SECTION.href,
});

export default async function GuideCitiesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { signedIn, fields, stated, defaults } = await guideView(searchParams);

  const groups = hubsByCountry(fields);
  const total = groups.reduce((n, g) => n + g.hubs.length, 0);

  return (
    <div className="space-y-6">
      <ListHead
        intro={
          <SectionIntro
            step={SECTION.step}
            title={SECTION.title}
            blurb={SECTION.blurb}
            count={`${total} cities in ${groups.length} countries, home region first. A city with only good news listed would be an advert, so every one of these carries its catch.`}
          />
        }
        aside={<FieldFilter defaultFields={defaults} signedIn={signedIn} />}
      />

      {/* The GROUPS are what flows into columns here, not the cards inside them.
          Grouping by country is right — a city is inside one — but it cut 22
          cities into 19 groups, and 15 of those hold a single city. Laying the
          cards out three-up therefore did nothing at all: each group was one
          card on its own row, and the page just got taller and more repetitive
          the wider the screen was. Flowing the groups themselves means a wide
          screen shows five countries where it used to show one. */}
      <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {groups.map((g) => {
          // The country's own profile, where one exists. Plenty of these have
          // none, and that is simply left absent rather than hidden or
          // apologised for — see the note at the top.
          const destination = g.hubs
            .map((h) => destinationForHub(h.id))
            .find(Boolean);
          return (
            // The rule is what makes a country read as the header of the cities
            // under it. These groups flow into columns, so without one the
            // country name is just the first line of a run of cards, and a
            // reader scanning down a column cannot tell where Germany ends and
            // Korea begins. Same treatment as the field groups on step 1.
            <section
              key={`${g.region}-${g.country}`}
              className="space-y-2.5 border-t border-line pt-4"
            >
              {/* The country name IS the link to its profile, rather than a
                  separate "full profile →" chip beside it. That chip was a 16px
                  tap target — a third of the 44px minimum — and this is both
                  bigger and more obvious: the heading of a group of cities in
                  Germany should go to Germany. */}
              <div className="flex flex-wrap items-center gap-x-3">
                <h2 className="text-base font-semibold tracking-tight text-ink">
                  {destination ? (
                    <Link
                      href={withFields(
                        `/guide/places/${destination.id}`,
                        stated,
                      )}
                      className="group inline-flex min-h-11 items-center gap-1.5 transition-colors hover:text-accent focus-visible:focus-ring"
                    >
                      {g.country}
                      <span
                        aria-hidden
                        className="text-accent transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                      >
                        &rarr;
                      </span>
                    </Link>
                  ) : (
                    // Not a link, so it needs no tap area — only the linked
                    // headings pay the 44px, and paying it on plain text would
                    // add height on a phone for nothing.
                    g.country
                  )}
                </h2>
                <span className="text-[11px] uppercase tracking-[0.1em] text-ink-faint">
                  {REGION_LABEL[g.region]}
                </span>
              </div>
              <ul className="grid gap-2.5">
                {g.hubs.map((h) => (
                  <li key={h.id}>
                    <GuideCard
                      href={withFields(`/guide/cities/${h.id}`, stated)}
                      transitionName={guideMorph("hub", h.id)}
                      title={h.city}
                      line={h.what}
                      cta="The catch & the way in"
                    />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <NextStep from="cities" fields={stated} />
    </div>
  );
}
