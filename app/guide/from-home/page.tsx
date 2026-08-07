import type { Metadata } from "next";
import { FieldFilter } from "@/components/guide/FieldFilter";
import { ListHead, NextStep, SectionIntro } from "@/components/guide/parts";
import { guideSection } from "@/lib/data/guide-sections";
import { homeRoutesForFaculties } from "@/lib/data/from-home";
import { guideView } from "@/lib/guide/student-fields";

// Step 4, and the one the guide would be dishonest without.
//
// This was a single closing paragraph under three long sections — the most
// actionable thing we can tell a student ("you can start this month, from here,
// for nothing") in the least visible position on the page. Every route is now
// stated with the same three facts as a city: what it is, what the catch is, and
// the smallest real first move.
//
// No detail pages here on purpose: six short entries do not need a level below
// them, and the actual next click is Opportunities, where the rows and their
// checked links live.

const SECTION = guideSection("from-home");

export const metadata: Metadata = {
  title: "What you can do without leaving — Compass",
  description: SECTION.blurb,
};

export default async function GuideFromHomePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { signedIn, fields, stated, defaults } = await guideView(searchParams);
  const routes = homeRoutesForFaculties(fields);

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

      <ul className="grid gap-3 xl:grid-cols-2">
        {routes.map((r) => (
          <li
            key={r.id}
            className="rounded-2xl border border-line bg-card p-5 sm:p-6"
          >
            <h2 className="text-base font-semibold text-ink">{r.name}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
              {r.what}
            </p>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
              <div className="rounded-xl border border-reach/30 bg-reach-soft/40 p-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                  The catch
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  {r.catch}
                </p>
              </div>
              <div className="rounded-xl border border-accent/35 bg-accent-soft/25 p-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                  Your first move
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  {r.firstMove}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <p className="max-w-2xl text-sm leading-relaxed text-ink-faint">
        Leaving is one route. It is not the only one, and for plenty of students
        it is not the best one — a strong record built from where you are is what
        makes leaving possible later, if you still want to.
      </p>

      <NextStep from="from-home" fields={stated} />
    </div>
  );
}
