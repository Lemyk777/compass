// The short address of every country profile — `/guide/<country>` — as a 308 to
// its canonical page.
//
// It started as the old addresses: the profiles lived at `/guide/<country>`
// before the guide became a section of routes, and they are public, shareable
// pages, so those URLs had to keep working. Countries added since get the same
// short URL rather than an exception, because the alternative is a list that
// means "the first eleven" and drifts the moment anyone forgets which is which.
// The unit test asserts these ids are exactly the destination registry.
//
// This list is duplicated into next.config.mjs, which cannot import TypeScript.
// That duplication is deliberate and is held honest by a unit test asserting
// that these ids are exactly the ids in study-destinations.ts: add a twelfth
// country and the test fails until its legacy URL is redirected too.
//
// Why the config and not a page: a `redirect()` inside a route only becomes a
// real 308 if nothing has been streamed yet. The guide's layout is
// `force-dynamic` and streams, so in production Next fell back to serving 200
// with a `<meta http-equiv="refresh">` — which lands a human on the right page
// but tells a crawler the old URL is a real, empty page. `redirects()` in the
// config runs before routing and is a true 308 in dev and production alike.
//
// The list is explicit rather than a `/guide/:id` pattern for the reason the
// profiles were moved in the first place: a pattern would also swallow
// `/guide/work`, `/guide/cities` and every step name added later.
export const LEGACY_GUIDE_PLACE_IDS = [
  "kazakhstan",
  "uzbekistan",
  "georgia",
  "poland",
  "turkiye",
  "china",
  "japan",
  "india",
  "united-states",
  "united-kingdom",
  "hong-kong",
  "singapore",
  "germany",
  "italy",
  "netherlands",
  "canada",
  "south-korea",
  "uae",
  "switzerland",
] as const;
