import type { Metadata } from "next";
import { FieldFilter } from "@/components/guide/FieldFilter";
import { GuideCard, ListHead, NextStep, SectionIntro } from "@/components/guide/parts";
import Link from "@/components/ui/Link";
import { fieldsSuffix, withFields } from "@/lib/data/guide-fields";
import { guideMorph, guideSection } from "@/lib/data/guide-sections";
import { FACULTY_LABEL } from "@/lib/data/faculties";
import { destinationsForFaculties } from "@/lib/data/study-destinations";
import { HUBS } from "@/lib/data/world";
import { GuideFilterBar } from "@/components/guide/GuideFilterBar";
import {
  filterGuideRows,
  guideFacets,
  parseGuideFilters,
  type GuideRow,
} from "@/lib/data/guide-filter";
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

  // Two narrowings, and they are not the same thing. `?f=` is the section-wide
  // subject filter and it applies first — it is what the student carries
  // between steps. The panel below narrows THIS LIST only, so its counts have
  // to be computed over what the field filter already left.
  const byField = destinationsForFaculties(fields);
  const regionOf = new Map(HUBS.map((h) => [h.id, h.region]));
  const rows: GuideRow[] = byField.map((d) => ({
    id: d.id,
    // Every destination profiles at least one city, and a test enforces that
    // each hub is claimed by exactly one country — so the first hub's region is
    // the country's region.
    region: regionOf.get(d.hubs[0]) ?? "europe",
    // Searched over the page's CONTENT, not just its card front — which is
    // where this differs from the opportunities search on purpose. There the
    // rule is "only what is on the card", because the card is the whole
    // product. Here the complaint being answered is "I had to open all
    // seventeen to find out", so "free", "medicine" or "scholarship" has to
    // reach the sentence inside the page that actually says it.
    text: [
      d.name,
      d.where,
      d.oneLine,
      d.unique,
      d.money,
      d.suitsYou,
      d.notForYou,
      ...d.strengths,
      ...d.tradeoffs,
      ...d.fields.map((f) => FACULTY_LABEL[f]),
    ]
      .join(" ")
      .toLowerCase(),
    modelled: d.modelled,
  }));
  const filters = parseGuideFilters(searchParams);
  const facets = guideFacets(rows, filters);
  const keep = new Set(filterGuideRows(rows, filters).map((r) => r.id));
  const destinations = byField.filter((d) => keep.has(d.id));

  return (
    <div className="space-y-6">
      <ListHead
        intro={<SectionIntro
          step={SECTION.step}
          title={SECTION.title}
          blurb={SECTION.blurb}
          count={`${byField.length} countries. Each page states what it costs you before what it gives you, and names who should go somewhere else instead.`}
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

      <GuideFilterBar
        facets={facets}
        noun="countries"
        nounOne="country"
        offerModelled
        total={destinations.length}
      />

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
