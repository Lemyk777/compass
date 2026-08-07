import type { Metadata } from "next";
import { FieldFilter } from "@/components/guide/FieldFilter";
import { GuideCard, ListHead, NextStep, SectionIntro } from "@/components/guide/parts";
import Link from "@/components/ui/Link";
import { fieldsSuffix, withFields } from "@/lib/data/guide-fields";
import { guideMorph, guideSection } from "@/lib/data/guide-sections";
import { destinationsForFaculties } from "@/lib/data/study-destinations";
import { guideView } from "@/lib/guide/student-fields";
import { pageMeta } from "@/lib/seo";

// Step 2: the countries, each with its own page — and the step the cities now
// hang under, because a country contains cities and the guide used to present
// the two the other way round.
//
// These already had their own routes when the rest of the guide did not — the
// profiles are long enough to deserve one. What changed is the address: they
// used to sit at `/guide/[place]`, a dynamic segment in the root of the section,
// so every static sub-route added later (`/guide/work`, `/guide/cities`) was a
// name that had to not-be-a-country. They live under `/guide/places/` now and
// the old URLs redirect.

const SECTION = guideSection("places");

export const metadata: Metadata = pageMeta({
  title: "The big study destinations, in full — Compass",
  description: SECTION.blurb,
  path: SECTION.href,
});

export default async function GuidePlacesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { signedIn, fields, stated, defaults } = await guideView(searchParams);
  const destinations = destinationsForFaculties(fields);

  return (
    <div className="space-y-6">
      <ListHead
        intro={<SectionIntro
          step={SECTION.step}
          title={SECTION.title}
          blurb={SECTION.blurb}
          count={`${destinations.length} countries. Each page states what it costs you before what it gives you, and names who should go somewhere else instead.`}
        />}
        aside={<FieldFilter defaultFields={defaults} signedIn={signedIn} />}
      />

      {/* The comparison is a first-class door, not only something you find at
          the bottom of one country's page — choosing between two is the
          question students actually arrive with. */}
      <Link
        href={`/guide/compare?${fieldsSuffix(stated).slice(1)}`}
        className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-card p-4 transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-accent hover:shadow-card focus-visible:focus-ring motion-reduce:transform-none motion-reduce:transition-none"
      >
        <span>
          <span className="text-sm font-semibold text-ink">
            Put two of them side by side
          </span>
          <span className="mt-0.5 block text-sm text-ink-soft">
            The same questions asked of both — money, admissions, after you
            graduate, and who each one is wrong for.
          </span>
        </span>
        <span aria-hidden className="shrink-0 text-ink-faint">
          &rarr;
        </span>
      </Link>

      <ul className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {destinations.map((d) => (
          <li key={d.id}>
            <GuideCard
              href={withFields(`/guide/places/${d.id}`, stated)}
              transitionName={guideMorph("place", d.id)}
              title={d.name}
              meta={d.where}
              line={d.oneLine}
              badge={d.modelled ? "Odds modelled" : undefined}
              cta={
                d.hubs.length === 1
                  ? "Money, admissions, and 1 city inside"
                  : `Money, admissions, and ${d.hubs.length} cities inside`
              }
            />
          </li>
        ))}
      </ul>

      <NextStep from="places" fields={stated} />
    </div>
  );
}
