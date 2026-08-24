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
import { AddToPlan } from "@/components/guide/AddToPlan";
import { areaBySlug } from "@/lib/data/careers";
import { FACULTY_LABEL } from "@/lib/data/faculties";
import { withFields } from "@/lib/data/guide-fields";
import { guideMorph } from "@/lib/data/guide-sections";
import { majorById } from "@/lib/data/majors";
import { guidePickState } from "@/lib/guide/plan-state";
import { statedGuideFields } from "@/lib/guide/student-fields";
import { fitTitle, pageMeta } from "@/lib/seo";

// One subject, in full — the page that did not exist, which is why the chain
// stopped at "what kind of work" and resumed at "which country" with nothing in
// between.
//
// Same shape as every other subject page in the guide: answer → map → parts,
// with the parts declared once and read twice so a part cannot be in the
// contents and missing from the page.

export async function generateMetadata({
  params,
}: {
  params: { major: string };
}): Promise<Metadata> {
  const major = majorById(params.major);
  if (!major) return { title: "Not found — Compass" };
  return pageMeta({
    title: fitTitle(major.name, "what it is, and who should not"),
    description: major.whatItActuallyIs,
    path: `/guide/majors/${params.major}`,
    type: "article",
  });
}

export default async function GuideMajorPage({
  params,
  searchParams,
}: {
  params: { major: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const major = majorById(params.major);
  if (!major) notFound();

  // One cached read, shared with anything else on this request that asks.
  const pick = await guidePickState("major", params.major);
  const stated = statedGuideFields(searchParams);

  // The work this opens, resolved to real pages. A slug that no longer exists
  // is dropped rather than rendered as a dead link — a unit test makes that
  // impossible to ship, but the page does not assume the test ran.
  const leadsTo = major.leadsTo
    .map((slug) => ({ slug, found: areaBySlug(slug) }))
    .filter((x) => Boolean(x.found))
    .map((x) => ({ slug: x.slug, title: x.found!.area.title }));

  const parts: { id: string; title: string; body: React.ReactNode }[] = [
    {
      id: "what-it-is",
      title: "What this subject actually is",
      body: (
        <>
          {major.alsoCalled.length > 0 && (
            <GuideBlock label="You will also see it called">
              {major.alsoCalled.join(" · ")}
              <span className="mt-1 block text-xs text-ink-faint">
                The same subject, under a different department in a different
                country. Search for all of them.
              </span>
            </GuideBlock>
          )}

          {/* First, under the answer, rather than last on the page: the first
              year is where people leave, and the reason they leave is almost
              never the reason a prospectus implies. */}
          <GuideBlock label="What the first year is really made of">
            {major.firstYear}
          </GuideBlock>

          <GuideBlock label="The catch" tone="warn">
            {major.catch}
          </GuideBlock>

          {major.hardGate && (
            <GuideBlock label="The one hard requirement" tone="warn">
              {major.hardGate}
            </GuideBlock>
          )}
        </>
      ),
    },
    {
      id: "start-now",
      title: "What to do about it now",
      body: (
        <GuideBlock
          label="The school subjects that actually matter"
          tone="good"
        >
          <ul className="flex flex-wrap gap-1.5">
            {major.schoolSubjects.map((s) => (
              <li
                key={s}
                className="rounded-lg border border-line bg-surface px-2.5 py-1 text-xs text-ink-soft"
              >
                {s}
              </li>
            ))}
          </ul>
          <span className="mt-2 block text-xs text-ink-faint">
            What admissions screens on, and what the first year assumes you
            already have. The only thing on this page you can start today.
          </span>
        </GuideBlock>
      ),
    },
    {
      id: "leads-to",
      title: "Where it leads",
      body: (
        <GuideBlock label="Kinds of work this opens">
          <ul className="space-y-2">
            {leadsTo.map((a) => (
              <li key={a.slug}>
                <Link
                  href={withFields(`/guide/work/${a.slug}`, stated)}
                  className="group flex min-h-11 items-center justify-between gap-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink focus-visible:focus-ring"
                >
                  {a.title}
                  <span
                    aria-hidden
                    className="shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-accent motion-reduce:transition-none"
                  >
                    &rarr;
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <span className="mt-2 block text-xs text-ink-faint">
            A list, not a prediction. Most people in these jobs did not study
            exactly this, and most people who study this end up doing something
            the list does not name.
          </span>
        </GuideBlock>
      ),
    },
  ];

  return (
    <DetailShell
      crumb="What you’d study"
      crumbHref={withFields("/guide/majors", stated)}
      title={major.name}
      path={`/guide/majors/${params.major}`}
      transitionName={guideMorph("major", params.major)}
      sub={major.fields.map((f) => FACULTY_LABEL[f]).join(" · ")}
      lead={major.whatItActuallyIs}
      aside={
        <AddToPlan
          kind="major"
          id={params.major}
          label={major.name}
          signedIn={pick.signedIn}
          saved={pick.saved}
          maps={pick.maps}
          returnTo={`/guide/majors/${params.major}`}
        />
      }
    >
      {/* The answer before the map. A country says who it suits and who should
          look elsewhere; so does a subject, and here it carries more weight than
          anywhere else in the guide — this is the page where somebody talks
          themselves out of four years they would have resented. */}
      <ForYou suits={major.suitsYou} avoid={major.notForYou} />

      <PageContents parts={parts} />

      {parts.map((part, i) => (
        <GuidePart key={part.id} id={part.id} step={i + 1} title={part.title}>
          {part.body}
        </GuidePart>
      ))}
    </DetailShell>
  );
}
