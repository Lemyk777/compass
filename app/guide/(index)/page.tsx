import type { Metadata } from "next";
import Link from "@/components/ui/Link";
import { FieldFilter } from "@/components/guide/FieldFilter";
import { ListHead } from "@/components/guide/parts";
import { withFields } from "@/lib/data/guide-fields";
import { GUIDE_SECTIONS } from "@/lib/data/guide-sections";
import { careerAreasForFaculties } from "@/lib/data/careers";
import { FACULTY_VALUES } from "@/lib/data/faculties";
import { hubsForFaculties } from "@/lib/data/world";
import { destinationsForFaculties } from "@/lib/data/study-destinations";
import { homeRoutesForFaculties } from "@/lib/data/from-home";
import { guideView } from "@/lib/guide/student-fields";
import { pageMeta } from "@/lib/seo";

// The guide's front page: a map of the section, not the section itself.
//
// This used to be all four steps stacked on one scroll, which meant finding
// anything required reading everything — 33 spheres of work, 22 cities and 11
// country profiles in a single column. Each step is its own route now, and this
// page's whole job is to say what the four are and how much is inside each, so
// a student chooses where to go instead of falling through it.

export const metadata: Metadata = pageMeta({
  title: "Where this can take you — Compass",
  description:
    "What each field of study actually leads to, the kinds of work inside it, and where in the world that work sits — with the honest catch and the real way in for each place.",
  path: "/guide",
});

export default async function GuidePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { signedIn, fields, stated, defaults } = await guideView(searchParams);

  // `careerAreasForFaculties` is literal — empty in, empty out — so the guide's
  // own rule ("no fields chosen means show me everything") is applied here, at
  // the call site, rather than by changing a contract the report also relies on.
  const shownFields = fields.length ? fields : FACULTY_VALUES;

  const counts: Record<string, string> = {
    work: `${careerAreasForFaculties(shownFields).reduce(
      (n, g) => n + g.areas.length,
      0,
    )} areas of work`,
    cities: `${hubsForFaculties(fields).length} cities`,
    places: `${destinationsForFaculties(fields).length} countries in full`,
    "from-home": `${homeRoutesForFaculties(fields).length} routes`,
  };

  return (
    <div className="space-y-7">
      <ListHead
        intro={
          <header>
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Where this can take you
            </h1>
            <p className="mt-3 max-w-2xl text-pretty text-base leading-relaxed text-ink-soft">
              A job title is not a life. Four steps: the first three run from
              what kinds of work exist, to the countries that host that work, to
              the cities inside them. The fourth is the one nobody tells you
              about — what you can enter from home this year, without moving
              anywhere at all.
            </p>
          </header>
        }
        aside={<FieldFilter defaultFields={defaults} signedIn={signedIn} />}
      />

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {GUIDE_SECTIONS.map((s) => (
          <li key={s.id}>
            <Link
              href={withFields(s.href, stated)}
              className="group flex h-full flex-col rounded-2xl border border-line bg-card p-5 transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-accent hover:shadow-card active:scale-[0.99] active:duration-75 focus-visible:focus-ring motion-reduce:transform-none motion-reduce:transition-none"
            >
              <span className="flex items-center gap-2.5">
                <span
                  data-num
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-surface"
                >
                  {s.step}
                </span>
                <span className="text-base font-semibold text-ink">
                  {s.title}
                </span>
              </span>
              <span className="mt-2 text-sm leading-relaxed text-ink-soft">
                {s.blurb}
              </span>
              <span className="mt-3 flex items-center gap-1.5 text-xs font-medium text-accent">
                {counts[s.id]}
                <span
                  aria-hidden
                  className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                >
                  &rarr;
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="text-sm leading-relaxed text-ink-faint">
        Everything in the guide is curated by hand and checked against the
        organiser or the government that sets the rule — no prices, no rankings,
        and no place gets its appeal listed without its catch.
      </p>
    </div>
  );
}
