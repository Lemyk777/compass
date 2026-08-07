import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/ui/Link";
import {
  DetailShell,
  GuideBlock,
  GuidePart,
  PageContents,
} from "@/components/guide/parts";
import { areaBySlug, areaSlug } from "@/lib/data/careers";
import { FACULTY_LABEL } from "@/lib/data/faculties";
import { withFields } from "@/lib/data/guide-fields";
import { guideMorph } from "@/lib/data/guide-sections";
import { VALUE_LABEL } from "@/lib/data/values";
import { hubsByRegion } from "@/lib/data/world";
import { statedGuideFields } from "@/lib/guide/student-fields";
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
  // `adjacent` holds area TITLES; resolve each to its route. A test pins that
  // every one of them resolves, so a silent dead entry cannot ship.
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
              A list, not a recommendation — you narrow it, we don&rsquo;t.
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
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
              Stage by stage
            </h3>
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
                    className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-white"
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{label}</p>
                    <p className="mt-0.5 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
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
      // Its own part rather than the seventh box down, because it is the only
      // thing on the page a reader can act on today, and a page that ends in
      // reading is where a student leaves.
      id: "try-it",
      title: "Test it this month",
      body: (
        <GuideBlock label="Free, and finishable in a few evenings" tone="good">
          {area.tryItNow}
        </GuideBlock>
      ),
    },
  ];

  return (
    <DetailShell
      crumb="Kinds of work"
      crumbHref={withFields("/guide/work", stated)}
      title={area.title}
      transitionName={guideMorph("area", params.area)}
      sub={FACULTY_LABEL[faculty]}
      lead={area.what}
      aside={
        <>
          {/* Nearby areas, for the student who is close but not quite. The
              guide's rule is that we widen rather than guess, and this is that
              rule made clickable. */}
          {neighbours.length > 0 && (
            <section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-ink">
                Close to this, if it is not quite right
              </h2>
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

          {cities.length > 0 && (
            <section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-ink">
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
                      className="inline-flex h-11 items-center rounded-full border border-line bg-surface px-3.5 text-sm font-medium text-ink-soft transition-colors hover:border-accent hover:text-ink focus-visible:focus-ring"
                    >
                      {h.city}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Link
            href="/opportunities"
            className="flex items-start justify-between gap-3 rounded-2xl bg-ink p-5 text-white transition-colors hover:bg-ink/90 focus-visible:focus-ring"
          >
            <span>
              <span className="text-sm font-semibold">
                The first step towards this, this year
              </span>
              <span className="mt-0.5 block text-sm text-white/70">
                What you can actually enter now, at your age.
              </span>
            </span>
            <span aria-hidden className="shrink-0">
              &rarr;
            </span>
          </Link>
        </>
      }
    >
      <PageContents parts={parts} />

      {parts.map((part) => (
        <GuidePart key={part.id} id={part.id} title={part.title}>
          {part.body}
        </GuidePart>
      ))}
    </DetailShell>
  );
}
