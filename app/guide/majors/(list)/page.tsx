import type { Metadata } from "next";
import { FieldFilter } from "@/components/guide/FieldFilter";
import {
  GuideCard,
  ListHead,
  NextStep,
  SectionIntro,
} from "@/components/guide/parts";
import { FACULTY_LABEL, FACULTY_VALUES } from "@/lib/data/faculties";
import { withFields } from "@/lib/data/guide-fields";
import { guideMorph, guideSection } from "@/lib/data/guide-sections";
import { majorsByField } from "@/lib/data/majors";
import { guideView } from "@/lib/guide/student-fields";
import { pageMeta } from "@/lib/seo";

// Step 2: the subject you actually apply with.
//
// The guide could say what kinds of work exist and which countries host them,
// and never named the row a student fills in on a form. This is that row.
//
// Grouped by field rather than listed flat, for the same reason the cities step
// is grouped by country: forty-four cards in one column is a wall, and the
// grouping is itself information — it answers "which of the eight fields is
// this under", which is a question the student is actively trying to settle.

const SECTION = guideSection("majors");

export const metadata: Metadata = pageMeta({
  title: "What you would actually study — Compass",
  description: SECTION.blurb,
  path: SECTION.href,
});

export default async function GuideMajorsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { signedIn, fields, stated, defaults } = await guideView(searchParams);
  // Empty in ⇒ everything. An unstated field widens the list; it never empties
  // it, which is the same rule the catalog and the world map already follow.
  const shownFields = fields.length ? fields : FACULTY_VALUES;

  const groups = majorsByField(shownFields);
  const total = groups.reduce((n, g) => n + g.majors.length, 0);

  return (
    <div className="space-y-6">
      <ListHead
        intro={
          <SectionIntro
            step={SECTION.step}
            title={SECTION.title}
            blurb={SECTION.blurb}
            count={`${total} subjects`}
          />
        }
        aside={<FieldFilter defaultFields={defaults} signedIn={signedIn} />}
      />

      {groups.map((group) => (
        <section key={group.faculty} className="space-y-2.5">
          <h2 className="text-sm font-semibold text-ink-soft">
            {FACULTY_LABEL[group.faculty]}
          </h2>
          <ul className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {group.majors.map((major) => (
              <li key={major.id}>
                <GuideCard
                  href={withFields(`/guide/majors/${major.id}`, stated)}
                  title={major.name}
                  // The other names the same subject is taught under, on the
                  // CARD and not only on the page behind it. A student
                  // searching for "informatics" has to be able to see that this
                  // is the same door without opening forty-four cards to find
                  // out — which is the whole reason the field exists.
                  meta={
                    major.alsoCalled.length > 0
                      ? `also called ${major.alsoCalled.join(" · ")}`
                      : undefined
                  }
                  line={major.whatItActuallyIs}
                  transitionName={guideMorph("major", major.id)}
                  cta="What the first year is really like"
                />
              </li>
            ))}
          </ul>
        </section>
      ))}

      <NextStep from="majors" fields={fields.length ? fields : null} />
    </div>
  );
}
