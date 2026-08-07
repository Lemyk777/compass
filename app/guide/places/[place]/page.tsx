import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/ui/Link";
import { DetailShell } from "@/components/guide/parts";
import { FACULTY_LABEL } from "@/lib/data/faculties";
import { fieldsSuffix, withFields } from "@/lib/data/guide-fields";
import { guideMorph } from "@/lib/data/guide-sections";
import { HUBS } from "@/lib/data/world";
import {
  STUDY_DESTINATIONS,
  destinationById,
  type StudyDestination,
} from "@/lib/data/study-destinations";
import { statedGuideFields } from "@/lib/guide/student-fields";

// One destination, in full: what it uniquely gives, what it costs you, what
// admissions weighs, what happens after you graduate, and who should not come.
//
// Moved here from `/guide/[place]`. The shell and the guide's own tabs come from
// app/guide/layout.tsx now; this file is only the profile.

export async function generateMetadata({
  params,
}: {
  params: { place: string };
}): Promise<Metadata> {
  const d = destinationById(params.place);
  if (!d) return { title: "Not found — Compass" };
  return {
    title: `Studying in ${d.name} — the honest picture | Compass`,
    description: d.oneLine,
  };
}

export default function DestinationPage({
  params,
  searchParams,
}: {
  params: { place: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const destination = destinationById(params.place);
  if (!destination) notFound();

  return (
    <DestinationBody
      destination={destination}
      stated={statedGuideFields(searchParams)}
    />
  );
}

function DestinationBody({
  destination: d,
  stated,
}: {
  destination: StudyDestination;
  stated: ReturnType<typeof statedGuideFields>;
}) {
  const hubs = HUBS.filter((h) => d.hubs.includes(h.id));
  const others = STUDY_DESTINATIONS.filter((x) => x.id !== d.id);

  return (
    <DetailShell
      crumb="Countries"
      crumbHref={withFields("/guide/places", stated)}
      title={d.name}
      transitionName={guideMorph("place", d.id)}
      sub={d.where}
      lead={d.oneLine}
      aside={
        <>
          <section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-ink">Strongest fields here</h2>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {d.fields.map((f) => (
                <li
                  key={f}
                  className="rounded-lg border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink-soft"
                >
                  {FACULTY_LABEL[f]}
                </li>
              ))}
            </ul>
          </section>

          {/* This panel used to be headed "Compare it with" and did not compare: the
              chips navigated to the other country's page, replacing the one you were
              reading. It promised the guide's whole premise — nobody chooses a
              country in isolation — and then threw away one of the two sides. Each
              chip now opens both countries next to each other on the same axes. */}
          <section className="rounded-2xl border border-line bg-card p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-ink">
              Compare {d.name} with&hellip;
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Nobody chooses a country in isolation. Pick one and the two are laid
              out side by side — money, admissions, what happens after you graduate,
              and who each one is wrong for.
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {others.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/guide/compare?a=${d.id}&b=${o.id}${fieldsSuffix(stated)}`}
                    className="inline-flex h-11 items-center rounded-full border border-line bg-surface px-4 text-sm font-medium text-ink-soft transition-[background-color,border-color,color,transform] duration-200 ease-out hover:border-accent hover:text-ink active:scale-[0.96] active:duration-75 focus-visible:focus-ring motion-reduce:transform-none motion-reduce:transition-none"
                  >
                    {o.name}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-5">
              <Link
                href="/opportunities"
                className="inline-flex h-11 items-center rounded-xl bg-ink px-5 text-sm font-medium text-white transition-colors hover:bg-ink/90 focus-visible:focus-ring"
              >
                What you can enter from home this year &rarr;
              </Link>
            </div>
          </section>
        </>
      }
    >
      {d.modelled && (
        <p className="-mt-2 inline-flex items-center rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent-ink">
          Compass calculates your admission odds for this destination
        </p>
      )}

      <section className="rounded-2xl border border-ivy/25 bg-ivy-soft/40 p-5 sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-ivy-ink/80">
          What only this place gives you
        </h2>
        <p className="mt-2 max-w-[60ch] text-base leading-relaxed text-ink">
          {d.unique}
        </p>
      </section>

      {/* Strengths and trade-offs side by side, deliberately equal in weight.
          A page that lists five upsides and one caveat is a brochure. */}
      <section className="grid gap-4 sm:grid-cols-2">
        <Column title="What is genuinely good" items={d.strengths} tone="good" />
        <Column title="What it actually costs you" items={d.tradeoffs} tone="bad" />
      </section>

      <section className="space-y-3">
        <Block title="Money — how paying for it works">{d.money}</Block>
        <Block title="Getting in — what they weigh">{d.admissions}</Block>
        <Block title="After you graduate">
          {d.afterStudy}
          <span className="mt-1.5 block text-xs text-ink-faint">
            Post-study work rules are set by politics and change. Check the rule
            for your own graduation year before you plan around it.
          </span>
        </Block>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-accent/40 bg-accent-soft/25 p-5">
          <h2 className="text-sm font-semibold text-ink">
            This suits you if&hellip;
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            {d.suitsYou}
          </p>
        </div>
        <div className="rounded-2xl border border-reach/40 bg-reach-soft/25 p-5">
          <h2 className="text-sm font-semibold text-ink">
            Look elsewhere if&hellip;
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            {d.notForYou}
          </p>
        </div>
      </section>

      {hubs.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-ink">
            The cities inside it
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            A country is not one job market. Each city opens its own page — what
            clusters there, the catch, and the door in.
          </p>
          <ul className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {hubs.map((h) => (
              <li key={h.id}>
                <Link
                  href={withFields(`/guide/cities/${h.id}`, stated)}
                  className="group flex h-full flex-col rounded-2xl border border-line bg-card p-4 transition-colors hover:border-accent focus-visible:focus-ring"
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-ink">
                      {h.city}{" "}
                      <span className="font-normal text-ink-faint">
                        {h.country}
                      </span>
                    </span>
                    <span
                      aria-hidden
                      className="shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-accent motion-reduce:transition-none"
                    >
                      &rarr;
                    </span>
                  </span>
                  <span className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-soft">
                    {h.what}
                  </span>
                  <span className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-faint">
                    <span className="font-medium text-ink-soft">
                      The catch:
                    </span>{" "}
                    {h.catch}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

    </DetailShell>
  );
}

function Column({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "good" | "bad";
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        tone === "good" ? "border-line bg-card" : "border-line bg-surface/60"
      }`}
    >
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      <ul className="mt-3 max-w-[60ch] space-y-2.5">
        {items.map((item) => (
          <li
            key={item}
            className="flex gap-2.5 text-sm leading-relaxed text-ink-soft"
          >
            <span
              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                tone === "good" ? "bg-accent" : "bg-reach"
              }`}
              aria-hidden
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
        {children}
      </p>
    </div>
  );
}
