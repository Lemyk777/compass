import type { Metadata } from "next";
import { FieldFilter } from "@/components/guide/FieldFilter";
import { GuideCard, NextStep, SectionIntro } from "@/components/guide/parts";
import { withFields } from "@/lib/data/guide-fields";
import { guideMorph, guideSection } from "@/lib/data/guide-sections";
import { destinationsForFaculties } from "@/lib/data/study-destinations";
import { guideView } from "@/lib/guide/student-fields";

// Step 3: the countries, each with its own page.
//
// These already had their own routes when the rest of the guide did not — the
// profiles are long enough to deserve one. What changed is the address: they
// used to sit at `/guide/[place]`, a dynamic segment in the root of the section,
// so every static sub-route added later (`/guide/work`, `/guide/cities`) was a
// name that had to not-be-a-country. They live under `/guide/places/` now and
// the old URLs redirect.

const SECTION = guideSection("places");

export const metadata: Metadata = {
  title: "The big study destinations, in full — Compass",
  description: SECTION.blurb,
};

export default async function GuidePlacesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { signedIn, fields, stated, defaults } = await guideView(searchParams);
  const destinations = destinationsForFaculties(fields);

  return (
    <div className="space-y-6">
      <SectionIntro
        step={SECTION.step}
        title={SECTION.title}
        blurb={SECTION.blurb}
        count={`${destinations.length} countries. Each page states what it costs you before what it gives you, and names who should go somewhere else instead.`}
      />

      <FieldFilter defaultFields={defaults} signedIn={signedIn} />

      <ul className="grid gap-2.5 sm:grid-cols-2">
        {destinations.map((d) => (
          <li key={d.id}>
            <GuideCard
              href={withFields(`/guide/places/${d.id}`, stated)}
              transitionName={guideMorph("place", d.id)}
              title={d.name}
              meta={d.where}
              line={d.oneLine}
              badge={d.modelled ? "Odds modelled" : undefined}
              cta="Money, admissions, after you graduate"
            />
          </li>
        ))}
      </ul>

      <NextStep from="places" fields={stated} />
    </div>
  );
}
