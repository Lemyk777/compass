import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/ui/Link";
import { DetailShell, GuideBlock } from "@/components/guide/parts";
import { areaBySlug } from "@/lib/data/careers";
import { FACULTY_LABEL } from "@/lib/data/faculties";
import { withFields } from "@/lib/data/guide-fields";
import { guideMorph } from "@/lib/data/guide-sections";
import { VALUE_LABEL } from "@/lib/data/values";
import { hubsByRegion } from "@/lib/data/world";
import { statedGuideFields } from "@/lib/guide/student-fields";

// One area of work, in full. This was a modal sheet, which meant it had no URL:
// a student could not send it to a parent, could not bookmark it, and pressing
// back closed it instead of leaving the page. It is a page now.

export async function generateMetadata({
  params,
}: {
  params: { area: string };
}): Promise<Metadata> {
  const found = areaBySlug(params.area);
  if (!found) return { title: "Not found — Compass" };
  return {
    title: `${found.area.title} — what the work is, and how you get in | Compass`,
    description: found.area.what,
  };
}

export default function GuideAreaPage({
  params,
  searchParams,
}: {
  params: { area: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const found = areaBySlug(params.area);
  if (!found) notFound();

  const { faculty, area } = found;
  const stated = statedGuideFields(searchParams);
  // Where this particular kind of work actually clusters — the next question a
  // student has after "what are the jobs", and the reason the guide is ordered
  // as a zoom rather than as four unrelated lists.
  //
  // One city per region rather than the first four in the list: the map is
  // ordered home-region-first on purpose, so taking the head of it would show a
  // student four Central Asian cities and imply the work stops there. This keeps
  // home first AND shows the spread.
  const cities = hubsByRegion([faculty])
    .map((g) => g.hubs[0])
    .slice(0, 5);

  return (
    <DetailShell
      crumb="Kinds of work"
      crumbHref={withFields("/guide/work", stated)}
      title={area.title}
      transitionName={guideMorph("area", params.area)}
      sub={FACULTY_LABEL[faculty]}
      lead={area.what}
    >
      <div className="space-y-3">
        <GuideBlock label="The jobs inside this area">
          <ul className="flex flex-wrap gap-1.5">
            {area.roles.map((role) => (
              <li
                key={role}
                className="rounded-lg border border-line bg-surface px-2.5 py-1 text-xs text-ink-soft"
              >
                {role}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-ink-faint">
            A list, not a recommendation — you narrow it, we don&rsquo;t.
          </p>
        </GuideBlock>

        <GuideBlock label="The path in" tone="good">
          {area.path}
        </GuideBlock>

        <GuideBlock label="What this kind of work usually offers">
          {area.values.map((v) => VALUE_LABEL[v]).join(" · ")}
          <span className="mt-1 block text-xs text-ink-faint">
            A generalisation about the sphere, not a promise about a salary. Pay
            and security vary enormously by country and employer.
          </span>
        </GuideBlock>
      </div>

      {cities.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-ink">
            Where this work sits
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Each one states its catch as well as its appeal.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {cities.map((h) => (
              <li key={h.id}>
                <Link
                  href={withFields(`/guide/cities/${h.id}`, stated)}
                  className="inline-flex h-11 items-center rounded-full border border-line bg-card px-4 text-sm font-medium text-ink-soft transition-colors hover:border-accent hover:text-ink focus-visible:focus-ring"
                >
                  {h.city}
                  <span className="ml-1.5 text-ink-faint">{h.country}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link
        href="/opportunities"
        className="flex items-center justify-between gap-3 rounded-2xl bg-ink p-5 text-white transition-colors hover:bg-ink/90 focus-visible:focus-ring"
      >
        <span>
          <span className="text-sm font-semibold">
            The first step towards this, this year
          </span>
          <span className="mt-0.5 block text-sm text-white/70">
            What you can actually enter now, at your age — competitions, courses
            and programmes.
          </span>
        </span>
        <span aria-hidden className="shrink-0">
          &rarr;
        </span>
      </Link>
    </DetailShell>
  );
}
