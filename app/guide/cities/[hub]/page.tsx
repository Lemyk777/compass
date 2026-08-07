import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/ui/Link";
import { DetailShell, GuideBlock } from "@/components/guide/parts";
import { FACULTY_LABEL } from "@/lib/data/faculties";
import { withFields } from "@/lib/data/guide-fields";
import { guideMorph } from "@/lib/data/guide-sections";
import { HUBS, REGION_LABEL } from "@/lib/data/world";
import { destinationForHub } from "@/lib/data/study-destinations";
import { statedGuideFields } from "@/lib/guide/student-fields";

// One city, in full. Same three facts as everywhere in world.ts and in the same
// order every time: what it is, what the catch is, how someone who is not from
// there actually gets in. The catch is not below the fold and not in smaller
// type — a place whose downside is harder to find than its appeal is being sold.

export async function generateMetadata({
  params,
}: {
  params: { hub: string };
}): Promise<Metadata> {
  const hub = HUBS.find((h) => h.id === params.hub);
  if (!hub) return { title: "Not found — Compass" };
  return {
    title: `Working in ${hub.city} — the catch and the way in | Compass`,
    description: hub.what,
  };
}

export default function GuideHubPage({
  params,
  searchParams,
}: {
  params: { hub: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const hub = HUBS.find((h) => h.id === params.hub);
  if (!hub) notFound();

  const stated = statedGuideFields(searchParams);
  const country = destinationForHub(hub.id);
  const nearby = HUBS.filter(
    (h) => h.region === hub.region && h.id !== hub.id,
  ).slice(0, 5);

  return (
    <DetailShell
      // A city is inside a country, so when we have that country's profile the
      // crumb IS the country — the trail then reads Guide / Germany / Berlin,
      // which is the containment stated rather than implied. Where there is no
      // profile (Almaty, Tashkent, Tbilisi and six more) the crumb falls back to
      // the full list, which is why that list still exists.
      crumb={country ? country.name : "Cities"}
      crumbHref={withFields(
        country ? `/guide/places/${country.id}` : "/guide/cities",
        stated,
      )}
      title={hub.city}
      transitionName={guideMorph("hub", hub.id)}
      sub={`${hub.country} · ${REGION_LABEL[hub.region]}`}
      lead={hub.what}
      aside={
        <>
          {/* If this city sits in a country we profile in full, that page is the
              next question the student will have. */}
          {country && (
            <Link
              href={withFields(`/guide/places/${country.id}`, stated)}
              className="flex items-start justify-between gap-3 rounded-2xl border border-accent/40 bg-accent-soft/25 p-5 transition-colors hover:border-accent focus-visible:focus-ring"
            >
              <span>
                <span className="text-sm font-semibold text-ink">
                  Everything about {country.name}
                </span>
                <span className="mt-0.5 block text-sm text-ink-soft">
                  {country.oneLine}
                </span>
              </span>
              <span aria-hidden className="shrink-0 text-ink-faint">
                &rarr;
              </span>
            </Link>
          )}

          {nearby.length > 0 && (
            <section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-ink">
                Others in {REGION_LABEL[hub.region]}
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {nearby.map((h) => (
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
        </>
      }
    >
      <div className="space-y-3">
        <GuideBlock label="The catch" tone="warn">
          {hub.catch}
        </GuideBlock>
        <GuideBlock label="The way in" tone="good">
          {hub.route}
        </GuideBlock>
        <GuideBlock label="The work that clusters here">
          {hub.fields.map((f) => FACULTY_LABEL[f]).join(" · ")}
        </GuideBlock>
      </div>
    </DetailShell>
  );
}
