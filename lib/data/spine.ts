import type { FacultyValue } from "@/lib/data/faculties";
import {
  CAREER_AREAS_BY_FACULTY,
  areaSlug,
  type CareerArea,
} from "@/lib/data/careers";
import { HUBS, REGION_ORDER, type Hub, type RegionKey } from "@/lib/data/world";
import {
  STUDY_DESTINATIONS,
  destinationForHub,
  type StudyDestination,
} from "@/lib/data/study-destinations";
import {
  universitiesForPlace,
  type NamedUniversity,
} from "@/lib/data/place-universities";
import { HOME_ROUTES, type HomeRoute } from "@/lib/data/from-home";

// THE SPINE — the chain the guide already had the parts for and never joined.
//
// The guide's four steps each answered their own question and then stopped. An
// area of work listed the cities it lives in as bare chips: no country, no
// university, no way in from home. A country listed its cities and its
// universities but never said what WORK any of it leads to. So a student who
// had decided on "designing physical things" still had to carry that decision
// by hand into three other lists.
//
// **Nothing here is new content.** Every layer already carries the same key —
// `FacultyValue`:
//
//   CAREER_AREAS_BY_FACULTY   is keyed by it
//   Hub.fields                is a list of it
//   StudyDestination.fields   is a list of it
//   NamedUniversity.knownFor  is a list of it
//   HomeRoute.fields          is a list of it
//
// That is what makes this a FUNCTION rather than a table. A stored spine would
// be a sixth copy of the same relationships and would start drifting the first
// time a city gained a field — which is the same reason the planner refuses to
// snapshot the catalog.
//
// Three product rules are enforced here rather than in a component, so a view
// added later cannot forget them:
//
//   1. THE HOME REGION LEADS. Stops come out in `REGION_ORDER`, which puts
//      Central Asia and the Caucasus first — for the same reason the world map
//      and the destination list do. A chain that lists sixteen ways to leave
//      and none to stay is not neutral, it is recommending.
//   2. EVERY STOP HAS A ROUTE IN. A country with neither a profile page nor a
//      single city page is a name a student cannot click, and a list of those
//      is an advert. Such stops are dropped, and a test asserts it.
//   3. NOTHING IS RANKED. Universities keep their registry order and are only
//      ever listed under a field they are actually `knownFor`. There is no
//      score, no "best", and no reordering by anything.
//
// SERVER-ONLY IN PRACTICE, like `careers.ts` itself: this module reaches into
// five prose registries totalling ~4,000 lines. A client component must take
// what it needs as PROPS. Same rule as the catalog's bundle trap.

/** One country on the chain, with the cities and institutions inside it. */
export type SpineStop = {
  /** The country's own name — from the profile when we have one, else the hub's. */
  country: string;
  region: RegionKey;
  /**
   * The full country profile, when one exists. Often it does not: a city we
   * name is not a promise that we wrote up the country around it, and Almaty
   * was the proof for a long time. Callers must render `null` as plain text
   * rather than as a link that dead-ends.
   */
  destination: StudyDestination | null;
  /** The cities here whose labour market includes this field. */
  hubs: Hub[];
  /** Institutions here named for THIS field, in the registry's own order. */
  universities: NamedUniversity[];
};

export type Spine = {
  faculty: FacultyValue;
  /** Where this work lives, home region first. */
  stops: SpineStop[];
  /** Ways in that need no visa and no move. */
  homeRoutes: HomeRoute[];
  hubCount: number;
  universityCount: number;
};

/** Institutions named for one field, anywhere, grouped by the country they sit in. */
function universitiesByDestination(
  faculty: FacultyValue,
): Map<string, NamedUniversity[]> {
  const out = new Map<string, NamedUniversity[]>();
  for (const d of STUDY_DESTINATIONS) {
    const named = universitiesForPlace(d.id).filter((u) =>
      u.knownFor.includes(faculty),
    );
    if (named.length > 0) out.set(d.id, named);
  }
  return out;
}

/**
 * The whole chain for one field of study.
 *
 * Grouped by COUNTRY and ordered by region, so the shape on screen matches the
 * containment the guide spent a release establishing: a city is inside a
 * country, and the country comes first.
 */
export function spineForFaculty(faculty: FacultyValue): Spine {
  const uniByDest = universitiesByDestination(faculty);
  const stops: SpineStop[] = [];

  // ONE walk over the regions, and that is the fix rather than the style.
  //
  // This was two passes — cities first, then the countries that claim the field
  // without a city carrying it — and the second pass appended after the first
  // had already run through every region. So the chain went ... North America,
  // and then back to Asia-Pacific. The home-region rule was true of each pass
  // and false of the result, which is precisely the drift the join was supposed
  // to end; a test caught it on the first run.
  for (const region of REGION_ORDER) {
    // The cities here whose labour market includes this field.
    for (const hub of HUBS.filter(
      (h) => h.region === region && h.fields.includes(faculty),
    )) {
      const existing = stops.find(
        (s) => s.country === hub.country && s.region === region,
      );
      if (existing) {
        existing.hubs.push(hub);
        continue;
      }
      const destination = destinationForHub(hub.id) ?? null;
      stops.push({
        country: destination?.name ?? hub.country,
        region,
        destination,
        hubs: [hub],
        universities: destination ? (uniByDest.get(destination.id) ?? []) : [],
      });
    }

    // Then the countries in the SAME region that claim the field themselves
    // without any of their cities carrying it. Still a real answer — it just
    // arrives through the country page rather than through a city — and second
    // within the region, so it never displaces a city-led stop.
    for (const d of STUDY_DESTINATIONS) {
      if (!d.fields.includes(faculty)) continue;
      if (stops.some((s) => s.destination?.id === d.id)) continue;
      const anyHub = HUBS.find((h) => d.hubs.includes(h.id));
      if (!anyHub || anyHub.region !== region) continue;
      stops.push({
        country: d.name,
        region,
        destination: d,
        hubs: [],
        universities: uniByDest.get(d.id) ?? [],
      });
    }
  }

  // Rule 2: a stop nobody can open is an advert. Every one that survives has at
  // least a country page or a city page behind it.
  const reachable = stops.filter(
    (s) => s.destination !== null || s.hubs.length > 0,
  );

  return {
    faculty,
    stops: reachable,
    homeRoutes: HOME_ROUTES.filter((r) => r.fields.includes(faculty)),
    hubCount: reachable.reduce((n, s) => n + s.hubs.length, 0),
    universityCount: reachable.reduce((n, s) => n + s.universities.length, 0),
  };
}

/** The field an area of work belongs to. Its key in the registry IS the answer. */
export function facultyOfArea(area: CareerArea): FacultyValue | undefined {
  for (const [faculty, areas] of Object.entries(CAREER_AREAS_BY_FACULTY)) {
    // By slug, not by identity: an area has no id, and the slug is the thing
    // the routes already agree on.
    if (areas.some((a) => areaSlug(a.title) === areaSlug(area.title))) {
      return faculty as FacultyValue;
    }
  }
  return undefined;
}

/**
 * The reverse direction: what work a PLACE is for.
 *
 * The country and city pages explained money, admissions and visas in full and
 * then never said what any of it leads to — which is the same dead end the area
 * pages had, pointing the other way. Widened rather than guessed, exactly like
 * matching: a place with no stated fields returns nothing rather than
 * everything, because "we did not say" and "all of them" are different claims.
 */
export function areasForFields(
  fields: FacultyValue[],
): { faculty: FacultyValue; area: CareerArea }[] {
  const out: { faculty: FacultyValue; area: CareerArea }[] = [];
  for (const faculty of fields) {
    for (const area of CAREER_AREAS_BY_FACULTY[faculty] ?? []) {
      out.push({ faculty, area });
    }
  }
  return out;
}

/** What work a city's own labour market is for. */
export function areasForHub(hub: Hub) {
  return areasForFields(hub.fields);
}

/** What work a country is a route into. */
export function areasForDestination(destination: StudyDestination) {
  return areasForFields(destination.fields);
}
