// The region taxonomy, on its own, so a CLIENT component can name a region
// without importing the 822-line world registry to do it.
//
// Same move as `career-titles.ts` next door, and for the same reason: the guide's
// filter bar is a client island that needed exactly one five-entry label map,
// and reached into `world.ts` for it. That import was measured and does not in
// fact ship — `world.ts` is a set of plain consts with no module-level side
// effects, so webpack shakes the prose out. But it only survives review because
// somebody measured it, and the identical-looking import from `key-dates.ts`
// (which builds a lookup map at module load and therefore cannot be shaken)
// silently shipped the whole catalog to eight routes. A rule that holds only
// when you check the bundle is not a rule, so the taxonomy lives here and the
// registries stay server-side.
//
// `world.ts` re-exports all three, so every existing import still resolves.

export type RegionKey =
  | "central_asia"
  | "europe"
  | "asia_pacific"
  | "middle_east"
  | "north_america";

export const REGION_LABEL: Record<RegionKey, string> = {
  central_asia: "Central Asia & the Caucasus",
  europe: "Europe",
  asia_pacific: "Asia-Pacific",
  middle_east: "Middle East & Türkiye",
  north_america: "North America",
};

/** Curated display order — home region first, deliberately. */
export const REGION_ORDER: RegionKey[] = [
  "central_asia",
  "europe",
  "middle_east",
  "asia_pacific",
  "north_america",
];
