import type { Metadata } from "next";
import { FieldFilter } from "@/components/guide/FieldFilter";
import { GuideCard, NextStep, SectionIntro } from "@/components/guide/parts";
import { withFields } from "@/lib/data/guide-fields";
import { guideMorph, guideSection } from "@/lib/data/guide-sections";
import { hubsByRegion, REGION_LABEL } from "@/lib/data/world";
import { guideView } from "@/lib/guide/student-fields";

// Step 2: the cities the work sits in, home region first — deliberately, because
// a guide written for students in Almaty and Tashkent that opens on San
// Francisco has already told them the answer is elsewhere.
//
// Pure server rendering: this list has no interactive state at all now that the
// filter lives in the URL.

const SECTION = guideSection("cities");

export const metadata: Metadata = {
  title: "The cities that work sits in — Compass",
  description: SECTION.blurb,
};

export default async function GuideCitiesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { signedIn, fields, stated, defaults } = await guideView(searchParams);

  const regions = hubsByRegion(fields);
  const total = regions.reduce((n, r) => n + r.hubs.length, 0);

  return (
    <div className="space-y-6">
      <SectionIntro
        step={SECTION.step}
        title={SECTION.title}
        blurb={SECTION.blurb}
        count={`${total} places, home region first. A city with only good news listed would be an advert, so every one of these carries its catch.`}
      />

      <FieldFilter defaultFields={defaults} signedIn={signedIn} />

      {regions.map((g) => (
        <section key={g.region} className="space-y-2.5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-faint">
            {REGION_LABEL[g.region]}
          </h2>
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {g.hubs.map((h) => (
              <li key={h.id}>
                <GuideCard
                  href={withFields(`/guide/cities/${h.id}`, stated)}
                  transitionName={guideMorph("hub", h.id)}
                  title={h.city}
                  sub={h.country}
                  line={h.what}
                  cta="The catch & the way in"
                />
              </li>
            ))}
          </ul>
        </section>
      ))}

      <NextStep from="cities" fields={stated} />
    </div>
  );
}
