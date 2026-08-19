import Link from "@/components/ui/Link";
import { withFields } from "@/lib/data/guide-fields";
import { FACULTY_LABEL, type FacultyValue } from "@/lib/data/faculties";
import { areaSlug } from "@/lib/data/careers";
import type { Spine } from "@/lib/data/spine";
import type { CareerArea } from "@/lib/data/careers";

// The chain, rendered once and used from both directions (#16).
//
// Two exports, and they are two views of ONE relationship — `SpineChain` walks
// a field outward to the places that hire for it, `WorkFromHere` walks a place
// back to the work. They share this file so the two can never disagree about
// what a link between those layers means, the same reason a city page derives
// its institutions from the country registry instead of keeping a second list.
//
// Server components. `lib/data/spine.ts` reaches into five prose registries; a
// client island would drag all of it into a route bundle.

/** A city or country chip that opens a real page. */
function Stop({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center rounded-full border border-line bg-surface px-3.5 text-sm font-medium text-ink-soft transition-colors hover:border-accent hover:text-ink focus-visible:focus-ring"
    >
      {label}
    </Link>
  );
}

/**
 * Where one field's work lives: countries, the cities inside them, and who is
 * named there — then the ways in that need no move at all.
 */
export function SpineChain({
  spine,
  stated,
}: {
  spine: Spine;
  stated: FacultyValue[] | null;
}) {
  if (
    spine.stops.length === 0 &&
    spine.homeRoutes.length === 0 &&
    spine.majors.length === 0
  )
    return null;

  const countries = spine.stops.length;

  return (
    <div className="space-y-5">
      {/* The study step, FIRST — before the countries, because the chain runs
          work → what you'd study → where they teach it, and a student picks a
          country with a subject already in hand. Every one is a link: a stop
          with no page behind it is a name a student cannot click, which is the
          rule this module was written to enforce. */}
      {spine.majors.length > 0 && (
        <section className="rounded-2xl border border-line bg-card p-5">
          <h4 className="text-base font-semibold leading-snug text-ink">
            What you would study for it
          </h4>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {spine.majors.map((m) => (
              <li key={m.id}>
                <Link
                  href={withFields(`/guide/majors/${m.id}`, stated)}
                  className="inline-flex min-h-11 items-center rounded-lg border border-line bg-surface px-2.5 py-1 text-xs text-ink-soft transition-colors hover:border-accent hover:text-ink focus-visible:focus-ring"
                >
                  {m.name}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-ink-faint">
            Each says what the first year is really made of, and who should
            study something else instead.
          </p>
        </section>
      )}

      <p className="text-base leading-relaxed text-ink-soft">
        {/* Counted from the data, never written down — the same rule the landing
            page's numbers follow. A hardcoded figure drifts from the list a
            student then reads; a read cannot. */}
        {countries} {countries === 1 ? "country" : "countries"}
        {spine.hubCount > 0 && <> · {spine.hubCount} cities</>}
        {spine.universityCount > 0 && (
          <> · {spine.universityCount} institutions named for this field</>
        )}
        . Each one states its catch as well as its appeal.
      </p>

      <ul className="space-y-4">
        {spine.stops.map((stop) => (
          <li
            key={`${stop.country}-${stop.region}`}
            className="rounded-2xl border border-line bg-card p-5"
          >
            <h4 className="text-base font-semibold leading-snug text-ink">
              {/* A country we profile opens; one we only name does NOT become a
                  link. Naming a place as though it were a page and dead-ending
                  there was a real bug on the city pages, and this layer would
                  have repeated it at nine countries. */}
              {stop.destination ? (
                <Link
                  href={withFields(
                    `/guide/places/${stop.destination.id}`,
                    stated,
                  )}
                  className="underline-offset-4 transition-colors hover:text-accent-ink hover:underline focus-visible:focus-ring"
                >
                  {stop.country}
                </Link>
              ) : (
                stop.country
              )}
            </h4>

            {stop.hubs.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {stop.hubs.map((h) => (
                  <li key={h.id}>
                    <Stop
                      href={withFields(`/guide/cities/${h.id}`, stated)}
                      label={h.city}
                    />
                  </li>
                ))}
              </ul>
            )}

            {stop.universities.length > 0 && (
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                {/* Named, never ranked, and never reordered — the registry's own
                    order, filtered to the field. "Named here" is deliberate
                    wording: it is not a shortlist and not a recommendation. */}
                <span className="font-medium text-ink">Named here:</span>{" "}
                {stop.universities.map((u) => u.name).join(" · ")}
              </p>
            )}
          </li>
        ))}
      </ul>

      {spine.homeRoutes.length > 0 && (
        <div className="rounded-2xl border border-line bg-card p-5">
          <h4 className="text-base font-semibold leading-snug text-ink">
            Without leaving home
          </h4>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
            {/* Step 4 is in the chain on purpose, and last on purpose. A student
                reading a list of cities abroad should not have to discover
                separately that some of this is reachable from where they are. */}
            {spine.homeRoutes.length} of the routes that need no visa and no
            move lead into this field.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {spine.homeRoutes.map((r) => (
              <li key={r.id}>
                <Stop
                  href={withFields("/guide/from-home", stated)}
                  label={r.name}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * The other direction: the work a place is a route into.
 *
 * A country page explained its money, its admissions and its visa ladder in
 * full and then stopped, which is the area pages' dead end pointing the other
 * way. Grouped by field so the answer is "this is what this place is FOR",
 * not an undifferentiated list of thirty job families.
 */
export function WorkFromHere({
  areas,
  stated,
  where,
}: {
  areas: { faculty: FacultyValue; area: CareerArea }[];
  stated: FacultyValue[] | null;
  /** "in Berlin", "in Germany" — so the heading says what it is scoped to. */
  where: string;
}) {
  if (areas.length === 0) return null;

  const byFaculty = new Map<FacultyValue, CareerArea[]>();
  for (const { faculty, area } of areas) {
    byFaculty.set(faculty, [...(byFaculty.get(faculty) ?? []), area]);
  }

  return (
    <div className="space-y-4">
      <p className="text-base leading-relaxed text-ink-soft">
        The kinds of work {where} is a route into, each with what it actually
        involves, and what the catch is.
      </p>
      <ul className="space-y-4">
        {[...byFaculty.entries()].map(([faculty, list]) => (
          <li
            key={faculty}
            className="rounded-2xl border border-line bg-card p-5"
          >
            <h4 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
              {FACULTY_LABEL[faculty]}
            </h4>
            <ul className="mt-3 flex flex-wrap gap-2">
              {list.map((a) => (
                <li key={areaSlug(a.title)}>
                  <Stop
                    href={withFields(
                      `/guide/work/${areaSlug(a.title)}`,
                      stated,
                    )}
                    label={a.title}
                  />
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
