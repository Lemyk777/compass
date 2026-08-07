import type { Metadata } from "next";
import { FieldFilter } from "@/components/guide/FieldFilter";
import { ListHead, NextStep, SectionIntro } from "@/components/guide/parts";
import { WorkList } from "@/components/guide/WorkList";
import { areaSlug, careerAreasForFaculties } from "@/lib/data/careers";
import { FACULTY_LABEL, FACULTY_VALUES } from "@/lib/data/faculties";
import { withFields } from "@/lib/data/guide-fields";
import { guideMorph, guideSection } from "@/lib/data/guide-sections";
import { guideView } from "@/lib/guide/student-fields";
import { pageMeta } from "@/lib/seo";

// Step 1: the areas of work a field opens.
//
// Areas, not one prescribed profession — we cannot see inside a student's head,
// so we widen instead of guessing (the same rule as "unknown facts never
// exclude"). The list is rendered here on the server; only the ranking is
// client-side, because the optional values refine reorders it.

const SECTION = guideSection("work");

export const metadata: Metadata = pageMeta({
  title: "Kinds of work a field opens — Compass",
  description: SECTION.blurb,
  path: SECTION.href,
});

export default async function GuideWorkPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { signedIn, fields, stated, defaults } = await guideView(searchParams);
  const shownFields = fields.length ? fields : FACULTY_VALUES;

  const groups = careerAreasForFaculties(shownFields).map((g) => ({
    faculty: g.faculty,
    label: FACULTY_LABEL[g.faculty],
    areas: g.areas.map((area) => {
      const slug = areaSlug(area.title);
      return {
        area,
        href: withFields(`/guide/work/${slug}`, stated),
        morph: guideMorph("area", slug),
      };
    }),
  }));
  const total = groups.reduce((n, g) => n + g.areas.length, 0);

  return (
    <div className="space-y-6">
      <ListHead
        intro={<SectionIntro
          step={SECTION.step}
          title={SECTION.title}
          blurb={SECTION.blurb}
          count={`${total} areas across ${groups.length} ${
            groups.length === 1 ? "field" : "fields"
          }. Open any one for the actual job titles inside it and the path in.`}
        />}
        aside={<FieldFilter defaultFields={defaults} signedIn={signedIn} />}
      />

      <WorkList groups={groups} />

      <NextStep from="work" fields={stated} />
    </div>
  );
}
