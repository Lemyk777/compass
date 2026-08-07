import type { Metadata } from "next";
import Link from "@/components/ui/Link";
import { FieldFilter } from "@/components/guide/FieldFilter";
import { GuideCard, NextStep, SectionIntro } from "@/components/guide/parts";
import { withFields } from "@/lib/data/guide-fields";
import { guideMorph, guideSection } from "@/lib/data/guide-sections";
import { hubsByCountry, REGION_LABEL } from "@/lib/data/world";
import { destinationForHub } from "@/lib/data/study-destinations";
import { guideView } from "@/lib/guide/student-fields";

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

export const metadata: Metadata = {
  title: "The cities the work sits in — Compass",
  description: SECTION.blurb,
};

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
      <SectionIntro
        step={SECTION.step}
        title={SECTION.title}
        blurb={SECTION.blurb}
        count={`${total} cities in ${groups.length} countries, home region first. A city with only good news listed would be an advert, so every one of these carries its catch.`}
      />

      <FieldFilter defaultFields={defaults} signedIn={signedIn} />

      {groups.map((g) => {
        // The country's own profile, where one exists. Plenty of these have
        // none, and that is simply left absent rather than hidden or apologised
        // for — see the note at the top.
        const destination = g.hubs
          .map((h) => destinationForHub(h.id))
          .find(Boolean);
        return (
          <section key={`${g.region}-${g.country}`} className="space-y-2.5">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-sm font-semibold text-ink">{g.country}</h2>
              <span className="text-xs uppercase tracking-[0.1em] text-ink-faint">
                {REGION_LABEL[g.region]}
              </span>
              {destination && (
                <Link
                  href={withFields(`/guide/places/${destination.id}`, stated)}
                  className="text-xs font-medium text-accent underline-offset-2 hover:underline focus-visible:focus-ring"
                >
                  The full country profile &rarr;
                </Link>
              )}
            </div>
            <ul className="grid gap-2.5 sm:grid-cols-2">
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

      <NextStep from="cities" fields={stated} />
    </div>
  );
}
