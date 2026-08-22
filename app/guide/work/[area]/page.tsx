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
import { areaBySlug, areaSlug } from "@/lib/data/careers";
import { FACULTY_LABEL } from "@/lib/data/faculties";
import { withFields } from "@/lib/data/guide-fields";
import { guideMorph } from "@/lib/data/guide-sections";
import { VALUE_LABEL } from "@/lib/data/values";
import { SpineChain } from "@/components/guide/Spine";
import { spineForFaculty } from "@/lib/data/spine";
import { statedGuideFields } from "@/lib/guide/student-fields";
import { guidePickState } from "@/lib/guide/plan-state";
import { AddToPlan } from "@/components/guide/AddToPlan";
import { TryTheWork } from "@/components/guide/TryTheWork";
import { simulationsForArea } from "@/lib/data/try-it";
import { pageMeta } from "@/lib/seo";

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
  return pageMeta({
    title: `${found.area.title} — what the work is, and how you get in | Compass`,
    description: found.area.what,
    path: `/guide/work/${params.area}`,
    type: "article",
  });
}

export default async function GuideAreaPage({
  params,
  searchParams,
}: {
  params: { area: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const found = areaBySlug(params.area);
  if (!found) notFound();

  // Whether this is already on the reader's plan. One cached read, shared with
  // whatever else on this request asks — see lib/guide/plan-state.ts.
  const pick = await guidePickState("work", params.area);

  const { faculty, area } = found;
  const stated = statedGuideFields(searchParams);
  // Where this particular kind of work actually clusters — the next question a
  // student has after "what are the jobs", and the reason the guide is ordered
  // as a zoom rather than as four unrelated lists.
  //
  // One city per region rather than the first four in the list: the map is
  // ordered home-region-first on purpose, so taking the head of it would show a
  // student four Central Asian cities and imply the work stops there. This keeps
  // `adjacent` holds area TITLES; resolve each to its route. A test pins that
  // every one of them resolves, so a silent dead entry cannot ship.
  // The whole chain for this area’s field, derived — see lib/data/spine.ts.
  const spine = spineForFaculty(faculty);
  const neighbours = area.adjacent
    .map((title) => ({ title, slug: areaSlug(title) }))
    .filter((n) => Boolean(areaBySlug(n.slug)));

  // Three parts, in the order a student asks the questions: what is this work
  // actually like and what does it cost me, how do people get there, and what
  // can I do about it this month. Eight boxes in one column answered the same
  // things and looked like one undifferentiated wall.
  //
  // The route part opens with the one-line version and then breaks it into
  // stages — a summary before its own detail, which is the shape every other
  // level of the guide already uses.
  const parts: { id: string; title: string; body: React.ReactNode }[] = [
    {
      id: "what-it-is",
      title: "What the work actually is",
      body: (
        <>
          <GuideBlock label="What the work is actually like">
            {area.dayToDay}
          </GuideBlock>

          <GuideBlock label="The catch" tone="warn">
            {area.catch}
          </GuideBlock>

          <GuideBlock label="What people get wrong about it">
            {area.misconception}
          </GuideBlock>

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
              A list, not a recommendation. You narrow it, we don&rsquo;t.
            </p>
          </GuideBlock>

          <GuideBlock label="What this kind of work usually offers">
            {area.values.map((v) => VALUE_LABEL[v]).join(" · ")}
            <span className="mt-1 block text-xs text-ink-faint">
              A generalisation about the sphere, not a promise about a salary.
              Pay and security vary enormously by country and employer.
            </span>
          </GuideBlock>
        </>
      ),
    },
    {
      id: "route",
      title: "How you get there",
      body: (
        <>
          <GuideBlock label="The one-line version">{area.path}</GuideBlock>

          {/* Three stages rather than one sentence, because "study engineering"
              hides every decision that actually matters — when to specialise,
              what the degree is like, and what the first job is really doing. */}
          <section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
            <h3 className="text-lg font-semibold text-ink">Stage by stage</h3>
            <ol className="mt-3 space-y-3">
              {(
                [
                  ["While you are still at school", area.stages.school],
                  ["What you study", area.stages.study],
                  ["How the first years actually go", area.stages.first],
                ] as const
              ).map(([label, body], i) => (
                <li key={label} className="flex gap-3">
                  <span
                    data-num
                    aria-hidden
                    className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-[12px] font-semibold text-surface"
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{label}</p>
                    <p className="mt-0.5 max-w-[54ch] text-base leading-relaxed text-ink-soft">
                      {body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </>
      ),
    },
    {
      // The chain: the country, the cities inside it, who is named there for
      // this field, and the routes that need no move. Every one of those facts
      // already existed one registry away and none of them were joined — a
      // student who had chosen this work still had to carry the choice by hand
      // into three other lists.
      id: "where",
      title: "Where this work lives, and how you reach it",
      body: <SpineChain spine={spine} stated={stated} />,
    },
    {
      // Its own part rather than the seventh box down, because it is the only
      // thing on the page a reader can act on today, and a page that ends in
      // reading is where a student leaves.
      id: "try-it",
      title: "Test it this month",
      body: (
        <>
          <GuideBlock label="Free, and finishable in a few evenings" tone="good">
            {area.tryItNow}
          </GuideBlock>
          {/* The founder's own ask, and the best-evidenced item on the list: a
              student weighing investment banking should meet the bank's own
              simulation HERE, not in a catalog of 173 rows. Renders nothing for
              an area with no honest answer — absence over a near-miss, because
              a reader would spend an evening on it and learn the wrong thing
              about a career. */}
          <TryTheWork
            simulations={simulationsForArea(params.area)}
            areaTitle={area.title}
          />
        </>
      ),
    },
  ];

  return (
    <DetailShell
      crumb="Kinds of work"
      crumbHref={withFields("/guide/work", stated)}
      title={area.title}
      path={`/guide/work/${params.area}`}
      transitionName={guideMorph("area", params.area)}
      sub={FACULTY_LABEL[faculty]}
      lead={area.what}
      aside={
        <>
          {/* First in the rail, because it is the one thing on this page that
              changes something rather than telling you something. */}
          <AddToPlan
            kind="work"
            id={params.area}
            label={area.title}
            signedIn={pick.signedIn}
            saved={pick.saved}
            maps={pick.maps}
            returnTo={`/guide/work/${params.area}`}
          />
          {/* Nearby areas, for the student who is close but not quite. The
              guide's rule is that we widen rather than guess, and this is that
              rule made clickable. */}
          {neighbours.length > 0 && (
            <section
              aria-label="Areas of work close to this one"
              className="rounded-2xl border border-line bg-card p-4 sm:p-5"
            >
              <p className="text-sm font-semibold text-ink">
                Close to this, if it is not quite right
              </p>
              <ul className="mt-3 space-y-2">
                {neighbours.map((n) => (
                  <li key={n.slug}>
                    <Link
                      href={withFields(`/guide/work/${n.slug}`, stated)}
                      className="group flex min-h-11 items-center justify-between gap-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink focus-visible:focus-ring"
                    >
                      {n.title}
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
            </section>
          )}

          {/* The flat city-chip list that used to sit here is gone: the spine
              part above says the same thing with the country, the institutions
              and the routes from home attached. Two lists of the same cities,
              one of them poorer, is how the layers drifted apart in the first
              place. */}
          <Link
            href="/opportunities"
            className="group flex items-start justify-between gap-3 rounded-2xl bg-accent p-5 text-on-fill transition-[background-color,transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lift focus-visible:focus-ring motion-reduce:transform-none motion-reduce:transition-none"
          >
            <span>
              <span className="text-sm font-semibold">
                The first step towards this, this year
              </span>
              <span className="mt-0.5 block text-sm text-on-fill/75">
                What you can actually enter now, at your age.
              </span>
            </span>
            <span
              aria-hidden
              className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
            >
              &rarr;
            </span>
          </Link>
        </>
      }
    >
      {/* The answer before the map, which is the shape every other subject page
          in the guide already had. This one opened on its table of contents:
          a country tells you who it suits and who should look elsewhere, a city
          tells you who thrives there, and an area of work told you neither — so
          the only part of the page addressed to the reader was missing from
          precisely the layer a student meets first. */}
      <ForYou suits={area.suitsYou} avoid={area.notForYou} />

      <PageContents parts={parts} />

      {parts.map((part, i) => (
        <GuidePart key={part.id} id={part.id} step={i + 1} title={part.title}>
          {part.body}
        </GuidePart>
      ))}
    </DetailShell>
  );
}
