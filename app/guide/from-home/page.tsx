import type { Metadata } from "next";
import { FieldFilter } from "@/components/guide/FieldFilter";
import {
  GuideBlock,
  GuidePart,
  ListHead,
  NextStep,
  PageContents,
  SectionIntro,
} from "@/components/guide/parts";
import { guideSection } from "@/lib/data/guide-sections";
import { homeRoutesForFaculties } from "@/lib/data/from-home";
import { guideView } from "@/lib/guide/student-fields";
import { pageMeta } from "@/lib/seo";

// Step 4, and the one the guide would be dishonest without.
//
// This was a single closing paragraph under three long sections — the most
// actionable thing we can tell a student ("you can start this month, from here,
// for nothing") in the least visible position on the page.
//
// It then became six bordered cards, each carrying all seven of a route's
// fields at the same weight, and that is the state this page is being fixed
// out of. Two things were wrong and they are the same two the country profiles
// already learned:
//
//  1. **Six identical cards are a wall, not a structure.** Same border, same
//     radius, same padding, forty-two blocks of prose — a fifth of the page's
//     height spent on card chrome that told a reader nothing, because a surface
//     that means everything means nothing. The route entries are bare now, and
//     only the two blocks that make a CLAIM about the reader keep a tint.
//  2. **The page had no map.** A reader could not tell from any height what it
//     held or where they were in it. That is the "wall of text" complaint, and
//     it was never about length.
//
// So this page is now built from the same parts as every country and city page
// — `PageContents`, `GuidePart`, `GuideBlock`. Three levels of depth only read
// as one section if they are literally made of the same pieces, and a student
// arriving here from Berlin should not have to re-learn how a page works.
//
// No detail pages, still: six short entries do not need a level below them, and
// the actual next click is Opportunities, where the rows and their checked
// links live.

const SECTION = guideSection("from-home");

export const metadata: Metadata = pageMeta({
  title: "What you can do without leaving — Compass",
  description: SECTION.blurb,
  path: SECTION.href,
});

export default async function GuideFromHomePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { signedIn, fields, stated, defaults } = await guideView(searchParams);
  const routes = homeRoutesForFaculties(fields);

  // Declared once and read twice — once by the contents list, once as the
  // sections themselves. Same rule as the subject pages: a part cannot exist in
  // the map and be missing from the page.
  const parts = routes.map((r) => ({ id: r.id, title: r.name, route: r }));

  return (
    <div className="space-y-6">
      <ListHead
        intro={<SectionIntro
          step={SECTION.step}
          title={SECTION.title}
          blurb={SECTION.blurb}
          count={`${routes.length} routes that judge the work, not the address it came from.`}
        />}
        aside={<FieldFilter defaultFields={defaults} signedIn={signedIn} />}
      />

      <PageContents parts={parts} />

      {/* One sentence, and the length is the point. The full version of this
          thought is four lines, and hoisting all four put the first route
          1073px down an 812px-tall phone — a student opened "what you can do
          without leaving" and saw nothing they could do. The rest of the
          argument closes the page, where a reflection belongs; what has to be
          at the top is the part that is actionable. */}
      <p className="max-w-[60ch] text-pretty text-base leading-relaxed text-ink-soft">
        Every one of these is open to you this month, from where you already
        live.
      </p>

      <div className="space-y-8">
        {parts.map(({ id, title, route: r }, i) => (
          <GuidePart key={id} id={id} step={i + 1} title={title}>
            <p className="max-w-[60ch] text-pretty text-base leading-relaxed text-ink-soft">
              {r.what}
            </p>

            {/* The two blocks that address the reader, level with each other.
                A catch shown under an appeal is a footnote; beside it, it is a
                condition. That balance is the rule the whole layer is built on,
                and it is why these two are the only tinted things here. */}
            <div className="grid gap-2.5 sm:grid-cols-2">
              <GuideBlock label="The catch" tone="warn">
                {r.catch}
              </GuideBlock>
              <GuideBlock label="Your first move" tone="good">
                {r.firstMove}
              </GuideBlock>
            </div>

            {/* The rest, bare and compact. These are facts about the route
                rather than claims about the reader, so they get weight and
                colour for hierarchy instead of a container each — which is what
                had them competing with the two blocks above. */}
            <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-3">
              {(
                [
                  ["What it costs you in time", r.commitment],
                  ["What you can show afterwards", r.proof],
                  ["Who it suits, and who it doesn’t", r.whoThrives],
                ] as const
              ).map(([label, body]) => (
                <div key={label} className="min-w-0">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                    {label}
                  </dt>
                  <dd className="mt-1 text-sm leading-relaxed text-ink-soft">
                    {body}
                  </dd>
                </div>
              ))}
            </dl>
          </GuidePart>
        ))}
      </div>

      <p className="max-w-[60ch] text-pretty text-sm leading-relaxed text-ink-faint">
        Leaving is one route. It is not the only one, and for plenty of students
        it is not the best one — a strong record built from where you are is
        what makes leaving possible later, if you still want to.
      </p>

      <NextStep from="from-home" fields={stated} />
    </div>
  );
}
