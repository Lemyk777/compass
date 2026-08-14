# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Starting a session?** Read
> [docs/BACKLOG_2026-08.md](docs/BACKLOG_2026-08.md) **§1 first** — it says what
> is deployed versus what is only on the branch, and getting that wrong is the
> fastest way to do work twice. §8 has the ordered next list, §5 the findings,
> §7 the working method.

## What this is

Compass — a guidance tool for international students. **Opportunities is the front door**: what competitions, olympiads, courses and programmes a student can actually enter, at their age, with honest dates and costs. The **planner** ([docs/PLANNER_PLAN.md](docs/PLANNER_PLAN.md)) is the third section, where what they committed to becomes dated work. The admission analysis (factor scores, per-school likelihood ranges, benchmarks, gap analysis, recommendations across **US · Italy · Hong Kong · UAE · Korea**) is now one opt-in input, not the product a student arrives for. Three roles share one backend: **student** (core product), **ambassador** (referral growth), **admin/founder** (metrics). Full product spec lives in [docs/compass-project-blueprint.md](docs/compass-project-blueprint.md); setup in [docs/SETUP.md](docs/SETUP.md); a map of the codebase in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md); the plan of record for the front door in [docs/OPPORTUNITIES_PLAN.md](docs/OPPORTUNITIES_PLAN.md).

Stack: Next.js 14 (App Router, RSC, server actions) · TypeScript (strict) · Tailwind · Supabase (Postgres + Auth + RLS) · Anthropic `claude-haiku-4-5` · Recharts · Zod · framer-motion.

## Commands

```bash
npm run dev            # dev server at http://localhost:3000
npm run build          # production build — also runs ESLint + type-check (use as the main gate)
npm run lint           # ESLint only
npx tsc --noEmit       # type-check only
npm run test:unit      # unit tests for the deterministic engine (node:test, no key/network)
npm run test:links     # every catalog URL; non-zero exit if any is DEAD
npm run test:guide-links # the guide's official sources (ministries, portals)
npm run test:analyze   # run the §12 sample profile through the LIVE analysis engine
node --import tsx scripts/test-session-checks.ts   # 60 pure logic checks
```

The **CI gate** ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs on every push and PR without secrets: `npm run build`, the session logic checks, then `npm run test:unit`. Locally that trio is the verification path — `test:analyze` is the only one needing a real `ANTHROPIC_API_KEY` in `.env.local` (loaded via `node --env-file`).

[scripts/test-engine.ts](scripts/test-engine.ts) covers the deterministic core: rubric/overall scoring, `computeBenchmarks`, eligibility arithmetic (grade↔grad-year, inferred age ranges, "unknown facts never exclude"), the interest quiz, the careers registry, and matching invariants. Add a case here whenever you touch scoring or eligibility.

**Never run `npm run build` while `npm run dev` is running.** They share `.next/`, and the production build replaces chunks the dev server still references — the dev server then dies with `Error: Cannot find module './NNNN.js'` from `.next/server/webpack-runtime.js`, which looks like a code bug and is not one. Stop the dev server first, or recover with `rm -rf .next` and restart it.

## Environment

Five vars (see [.env.example](.env.example)) in `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SITE_URL`. Without them the app still builds and `/demo` renders the full report from a sample; auth and analysis require them.

## Site structure: the student's section vs the report

Two shells, and the distinction is load-bearing:

- **The student's section** — `/opportunities` (what you can enter) and `/guide/*`
  (where it leads). Frame: [components/student/StudentShell.tsx](components/student/StudentShell.tsx)
  — one narrow column, two destinations, the report a link away. Both are
  session-aware and work signed out; `/opportunities` shows the guest
  eligibility checker, the guide opens on every field instead of the student's.
- **The report** — `/dashboard/*`, the opt-in admission analysis, in the sidebar
  shell. **Whether Opportunities appears as a tab there depends on one thing:
  does the student have an analysis?**
  - **Has one** → the report keeps its Opportunities panel exactly as before
    (removing it would read as the feature being deleted), and the panel opens
    with a loud door across to the dedicated section (`SectionDoor`).
  - **Has none** → no tab; `/dashboard/opportunities` redirects to
    `/opportunities`, and the sidebar's top link goes up to it. Handing a
    student with no report an eight-tab analysis console is the inversion we
    undid.
  - `/demo` always shows the tab — it previews the report shell with no account.

  The flag is `analysis !== null` (`sectionsFor` in `Sidebar.tsx`, the count
  query in `app/dashboard/opportunities/page.tsx`). `standalone` on
  `DashboardProvider` is what stops the section linking to itself.

[lib/dashboard/load.ts](lib/dashboard/load.ts) is the one loader feeding both
shells (profile, analysis, live dates, intents) — don't duplicate those queries.

## Opportunities — the front door (read [docs/OPPORTUNITIES_PLAN.md](docs/OPPORTUNITIES_PLAN.md) first)

Everything here is **deterministic** — no model call — and the design rules come from [docs/OPPORTUNITIES_RESEARCH.md](docs/OPPORTUNITIES_RESEARCH.md) (information alone measured zero; what moved behaviour was removing ambiguity and removing the work).

- **The default intake is two inline questions**, both on the Opportunities view: school year (`YearPrompt` → `saveGraduationYear`) then field (`FieldPrompt` → `saveFaculties`, both in [app/dashboard/actions.ts](app/dashboard/actions.ts)). A student who can't answer the second takes the optional **interest quiz** ([lib/data/interest-quiz.ts](lib/data/interest-quiz.ts) — fixed per-option weights, pure scoring). **The full analysis questionnaire is opt-in** — new signups land on `/dashboard/opportunities`, not `/onboarding`. Don't re-add a mandatory intake gate.
- **Empty faculties is a valid answer** meaning "show everything", not "show nothing". Unknown facts never exclude.
- **The filter panel is pure, and its rules are the product's rules**
  ([lib/data/opportunity-filter.ts](lib/data/opportunity-filter.ts), rendered by
  [components/opportunities/FilterBar.tsx](components/opportunities/FilterBar.tsx)):
  a search box plus money / when / level / "only what I can enter now", every
  option carrying its own count. Three things not to "improve": groups are
  **ANDed, options inside a group ORed** — the only combination a person
  predicts; **"Free" never includes a cost we have not verified**, so `unknown`
  and `varies` belong to no money bucket (a filter must not do what a card is
  forbidden from doing); and **any active filter opens the full list on its
  own**, because a search that returned the same five recommendations reads as
  broken. Kind stays on the sticky tabs — one criterion, one control — and the
  counts on each control are computed with that control's own selection lifted.
  The module type-imports key-dates only (see the bundle rule below), and the
  rules are unit-tested in [scripts/test-engine.ts](scripts/test-engine.ts).
- **The catalog is split by concern**: entries live in [lib/data/competitions-data.ts](lib/data/competitions-data.ts), matching logic in [lib/data/key-dates.ts](lib/data/key-dates.ts) (which re-exports the data, so existing imports still work), and the careers layer in [lib/data/careers.ts](lib/data/careers.ts). The careers
  layer moved to **the guide** — a section of routes, not a page (see below),
  which runs interest → field → sphere of work → the cities that work lives in
  ([lib/data/world.ts](lib/data/world.ts)) → what to enter from home. Every hub
  there must carry BOTH its catch and a real route in — a city with only good
  news listed is an advert, and a test enforces it. The deep layer is
  [lib/data/study-destinations.ts](lib/data/study-destinations.ts) → `/guide/places/[place]`:
  17 full country profiles (money, admissions, after-study, cities, sources).
  **The home region leads the list on purpose** — Kazakhstan and Georgia first —
  for the same reason the world map does: for many of our
  readers a strong degree at home plus a funded master's abroad is the honest
  answer, and a guide listing sixteen ways to leave and none to stay is not
  neutral, it is recommending. **Rules,
  test-enforced: trade-offs must outnumber strengths, `notForYou` is mandatory,
  and no prices or rankings** — those rot within a year, structural facts don't.
  Post-study work rules DO drift; they're written as "current rule, check it"
  and need a yearly pass. The layer names career
  **areas** with the real job titles inside them — never one prescribed
  profession per field. We can't know which job a student is reaching
  for, so we widen instead of guessing (the same rule as "unknown facts never
  exclude"); a unit test enforces ≥3 roles per area. The optional values refine
  ([lib/data/values.ts](lib/data/values.ts)) may only **reorder** those areas —
  never filter them, and never change the chosen fields, which are what actually
  drive matching. Answers live in `localStorage`, not the profile.
- **Bundle rule (easy to break):** `key-dates.ts` builds a lookup map over the whole ~2,700-entry catalog at module load, so *any* runtime import drags the dataset into that route's client bundle. Client components must import `formatDate`/`opportunityCost` from [lib/data/opportunity-format.ts](lib/data/opportunity-format.ts), and the three matching views (`OpportunitiesView`, `EligibilityChecker`, `FirstWin`) **dynamic-import** `buildExtracurriculars`. Keep it that way; type-only imports from key-dates are free.
- **Never show a countdown for a date we can't stand behind.** A confirmed date renders as a countdown; anything else is "Dates TBA" or "open now". Verify a date against the organiser's own page before setting `dateConfirmed: true`, and read what the page says — `test:links` cannot tell you a contest was discontinued.
- **`pinned` is the ONLY editorial override in the ordering, and it reorders
  only.** Everything else about the order is derived from the student's profile
  (fit → confirmed date → days left). A pinned row still has to pass eligibility:
  a card telling a student they can enter something they cannot is the one
  failure this product does not get to make, and "we pinned it" is not a reason
  the student can see. **One at a time** — a list where several rows outrank the
  student's own fit has no order at all. Tests assert all three, and they are
  written against whatever is pinned *today* rather than a named entry, because a
  pinned row is short-lived and a test naming one fails the day it expires.
- **An admin can post an opportunity from the top of the list**
  ([QuickAddOpportunity](components/admin/QuickAddOpportunity.tsx) →
  `quickAddOpportunity` in [app/admin/opportunities/actions.ts](app/admin/opportunities/actions.ts)).
  It writes the **same `competition_deadlines` row a partner post writes**, with
  `partner_id` null, so it flows through `resolveCompetitions()` and renders
  through the same card — no second catalog, no second renderer. Validation lives
  in the server action, not only in the form: a server action is a public HTTP
  endpoint. It is mounted with `next/dynamic`, deliberately — `{isAdmin && …}`
  decides what *renders*, not what *ships*, and a static import put the admin
  form in every student's bundle.

## The guide is a section of routes, not a page

`/guide` was one scroll holding all four steps; finding anything meant reading
33 areas of work, 22 cities and 11 country profiles in a single column, and the
detail behind every card was a modal with no URL. Every step and every subject
is its own route now:

```
/guide                    index — the four steps, with counts
/guide/work               1 · areas of work      → /guide/work/[area]
/guide/places             2 · countries in full  → /guide/places/[place]
/guide/cities             3 · the cities in them → /guide/cities/[hub]
/guide/from-home          4 · routes that need no move
/guide/compare?a=&b=      two countries on the same axes
```

- **The order is a zoom IN, and it shipped backwards once.** Cities came before
  countries, so the guide asked a student to weigh Berlin and then zoomed out to
  Germany a step later. A country contains cities; it comes first.
- **One hub is one city.** Four hubs used to carry a paired label — `Toronto &
  Waterloo`, `Dubai & Abu Dhabi`, `Zurich & Lausanne`, `Osaka & Kyoto` — because
  a hub models a *labour market*, and those pairs recruit across. It reads as a
  bug to a student, and it produced exactly the duplicate-looking lists that got
  reported for Amsterdam and Shanghai. Those two were fixed by splitting; these
  four now are too, so the same problem has one answer everywhere. `San Francisco
  Bay Area` stays — that is the accepted name of a region, not two cities glued
  together. A rename is a **public URL change**: `osaka-kyoto` → `osaka` is a 308
  from `RENAMED_HUB_IDS`, not a 404.
- **Every city now sits in a country we profile** (17 countries, 38 cities as of
  2026-08-11). It was 11 and 22, and nine cities — including Almaty, Astana
  and Tbilisi, the whole home region — had no country page at all, so
  their breadcrumb dead-ended at the list. The unit test that used to *require*
  those orphans now asserts the opposite and stronger thing: every hub is
  claimed by exactly one destination, and no destination claims a hub twice.
  Adding a city means adding it to some country's `hubs`, or the test fails.
- **Cities stay their own step even so.** The containment is expressed by the
  list being grouped BY country (`hubsByCountry`), by a city's breadcrumb being
  its country (`destinationForHub`), and by the country page listing the cities
  inside it — but "which country" and "which city inside it" are different
  questions and a student asks them in that order, which is what the two steps
  are for.
- **Country profiles carry `sources`** — the ministry, recognition database,
  application portal or scholarship body that actually sets the rules on that
  page, rendered as the "Check it yourself" part. The guide claimed to be
  "checked against the organiser or the government that sets the rule" for two
  releases while linking to none of them. **Official bodies only** (a unit test
  rejects rankings, Wikipedia and blogs, and requires https), and
  `npm run test:guide-links` checks they still answer. A 403/429/**412** is a bot
  wall and is reported without failing — the server answered, so the page is
  there. A **timeout is not**: it proves nothing, so such a link does not ship.
  That rule is why Germany links anabin and uni-assist rather than DAAD.
- **The guide names institutions but never ranks them**
  ([lib/data/place-universities.ts](lib/data/place-universities.ts), rendered as
  "Who is named here" on both `/guide/places/[place]` and `/guide/cities/[hub]`).
  The profiles explained a country's admissions, money and visa ladder in full
  and then named nobody, so a student who had chosen Germany still had nothing to
  search for. The ban on `top \d+` / `rank(ed|ing) #N` forbids **positions, not
  names**: each entry is `{ name, city, hub, knownFor[], englishTaught }`, where
  `knownFor` uses the faculty taxonomy so it stays filterable, and a test also
  rejects superlatives ("best", "leading", "prestigious") because those are a
  ranking with the number filed off. `hub` is a real hub id **or null**, and null
  must render as plain text — naming a city as though it were a page and
  dead-ending there was a real bug. A **city page derives from the same registry**
  rather than keeping a second list, so the two can never disagree; a test pins
  that. `englishTaught` is the one field that rots (same lesson as the
  Netherlands, §5.3 of the backlog): coarse three-way, never a promise about a
  named programme, re-verify yearly.
- **`/guide/compare` is a real comparison.** The country pages carried a panel
  headed "Compare it with" that only navigated to the other country, throwing
  away the side you had just read. Every axis is rendered for both, trade-offs
  level with strengths. On mobile the columns stack, so each answer is labelled
  with its country — an unlabelled stack is not a comparison.

- **The four steps are JOINED, and the join is a function**
  ([lib/data/spine.ts](lib/data/spine.ts), rendered by
  [components/guide/Spine.tsx](components/guide/Spine.tsx)). Every layer already
  carried `FacultyValue` — `CAREER_AREAS_BY_FACULTY` is keyed by it,
  `Hub.fields`, `StudyDestination.fields`, `NamedUniversity.knownFor` and
  `HomeRoute.fields` are all lists of it — so the chain needed no new content,
  only deriving. **Never store it**: a saved spine is a sixth copy of the same
  relationships and drifts the first time a city gains a field, the same reason
  the planner refuses to snapshot the catalog. Four rules live in the module so
  a new view cannot forget them: the **home region leads** (`REGION_ORDER`);
  **every stop has a page behind it**, or it is a name a student cannot click;
  institutions appear **only under a field they are `knownFor`, in the
  registry's order** — never sorted by anything, which would be a ranking; and a
  country we merely NAME is plain text, not a link. It is **server-only in
  practice** (five prose registries, ~4,000 lines) and a test fails any client
  component that imports it. The round trip is asserted: a city on a field's
  chain must lead back to that field's areas.
- **The steps live in one registry** ([lib/data/guide-sections.ts](lib/data/guide-sections.ts)) that the tabs, the index cards and the "next step" footer all read. Add or rename a step there, not in four places.
- **One session read per request.** `guideView()`/`guideSession()` in [lib/guide/student-fields.ts](lib/guide/student-fields.ts) are `cache()`d, because the layout (picking a shell), the page (labelling the filter) and the filter's default each used to call `getSession()` — three `auth.getUser()` round trips and three `profiles` reads before a page drew anything. Ask through `guideView`, not `getSession`, inside the guide.
- **The field filter is `?f=`, not state** ([lib/data/guide-fields.ts](lib/data/guide-fields.ts) + [lib/guide/student-fields.ts](lib/guide/student-fields.ts)). Three states, and the last two are NOT the same: absent = "not stated" (falls back to the student's own fields), `f=all` = the student deliberately widened it, `f=a,b` = those fields. Collapsing them re-applies the profile on every navigation. Every in-section link carries it via `withFields`.
- **The old `/guide/<country>` URLs redirect from [next.config.mjs](next.config.mjs), not from a route.** A `redirect()` inside a page is only a real 308 if nothing has streamed yet, and this layout is `force-dynamic`; `redirects()` runs before routing and is a true 308 either way. It also let the `[place]` route be deleted, so an unknown `/guide/anything` is now a real 404 instead of a 200 carrying a "not found" page. **The list is enumerated, never `/guide/:place`** — a pattern runs before routing and would swallow `/guide/work` and every step name added later. It is duplicated in [lib/data/legacy-guide-urls.ts](lib/data/legacy-guide-urls.ts) because the config cannot import TypeScript, and a unit test asserts config, list and registry all agree.
- **Detail pages, not sheets.** A modal has no URL: it cannot be sent to a parent, and Back closes it instead of leaving. `DetailShell`/`GuideBlock`/`GuideCard` in [components/guide/parts.tsx](components/guide/parts.tsx) are what make three levels of depth read as one section.
- **A subject page has a shape: answer → map → parts.** Every country, city and area page opens with `ForYou` (who it suits, who should look elsewhere — it used to sit *under* seven blocks of prose, so the only sentences addressed to the reader were the ones they were least likely to reach), then `PageContents`, then two to five `GuidePart`s. The parts are declared as **one array per page and read twice** — once by the contents list, once as the sections — so a part cannot exist in the map and be missing from the page. This is the fix for "it's just a wall of text": the complaint was never about length, it was that nine equally-weighted boxes gave a reader no way to tell what a page held or where they were in it. Heading levels follow: `GuidePart` is `h2`, `GuideBlock` is `h3`.
- **Every sub-page owns its way out** ([components/guide/DetailExit.tsx](components/guide/DetailExit.tsx), in `DetailShell` and on `/guide/compare`). Turning the sheets into pages took the ✕ and the Escape key with them, and left one breadcrumb at the top of a profile several screens long — past the first scroll the only exit was the browser's own Back, which on a phone is a swipe and inside a webview may not exist. So: **Close** beside the breadcrumb, the same control as a floating pill once that one scrolls off (IntersectionObserver on the inline link, `rootMargin -64px` for the sticky nav), and Escape. The pill names where it lands ("← Countries"), never a bare arrow. **Closing prefers `router.back()`, but only when it provably means that list** — [NavTrail](components/guide/NavTrail.tsx) in the guide layout remembers the previous URL (module-level, so a reload forgets it; read at click time, because the layout's effect runs after the page's), and back is what restores the student's place in a 33-card list. Everything else pushes to `crumbHref`, which is also what a shared link or a hop between two detail pages gets.
- **Server-rendered except the two islands** — `FieldFilter` (writes the URL) and `WorkList` (the values refine reorders it from `localStorage`). `WorkList` takes its areas as **props**; importing `careers.ts` into a client component ships all 500 lines of it. Same rule as the catalog's bundle trap above.
- A career area has no id — its slug is derived from its title (`areaSlug`), and a unit test pins that all 33 stay distinct.
- **The depth layer is test-enforced, and its rules are the product's rules.** Every area of work states a `catch` (mandatory — cities always had one, careers did not, which made that layer the only place able to read as a brochure) **and a `suitsYou`/`notForYou` pair**; every city and from-home route names who should **look elsewhere**; and no entry in `world.ts` may quote a price, salary or ranking — a regex test enforces that, because figures rot within a year and shape ("housing is the whole problem") does not. Adding an area, city, country or route means filling those fields or the tests fail.
- **`careers.ts` is server-only in practice.** It is ~1,100 lines of prose, and the interest quiz is a CLIENT component that needs eight labels from it — so the titles live in [lib/data/career-titles.ts](lib/data/career-titles.ts), duplicated and pinned to the registry by a test. Import labels from there, never the registry, in anything that runs in the browser.
- **One motion per view, and it is the morph.** A card's title and the `<h1>` of the page it opens share a `view-transition-name` (`guideMorph`, tested for validity and uniqueness), so the browser morphs one into the other and the transition answers "where did this page come from?". A staggered card entrance was tried and removed for two reasons worth not rediscovering: a fade-up holds the card at `opacity: 0` until the animation runs, which makes the page's actual content depend on an animation finishing; and it fights the morph, because a view transition snapshots the incoming page while those cards are still sliding. Everything else is `transition`-based (hover lift, press scale) so the resting state is always visible.
- The global reduced-motion guard in [app/globals.css](app/globals.css) zeroes `animation-delay`/`transition-delay` as well as the durations. Without that, any `fill-mode: both` entrance leaves a reduced-motion reader staring at invisible content for the length of the delay.
- **That CSS guard does not reach framer-motion, and nothing else did either.**
  It zeroes CSS animation and transition durations; framer drives inline
  `transform`/`opacity` from JavaScript, so the rule is invisible to it — and for
  a long time every framer animation in the product ran at full strength for a
  reader who had asked their system for less. The five components that actually
  render `motion.*` are the whole surface: `DirectionSummary`, `PromptSwap` in
  `OpportunitiesView`, `MotionCard`, `Onboarding` and the landing `MapView`. Four
  wrap their motion subtree in [MotionSafe](components/ui/MotionSafe.tsx)
  (`MotionConfig reducedMotion="user"` — drops movement, keeps the crossfade);
  `MotionCard` uses `useReducedMotion()` directly to switch off its layout FLIP,
  because it renders once per card and would otherwise mean a context provider
  per card. **Mount `MotionSafe` inside a component that already imports framer,
  never in a shell** — hoisting it would drag framer into the guide's route
  bundles, which are server-rendered apart from two islands.
- **The loading skeleton is on the LIST routes only, and that is load-bearing.** A `loading.tsx` is a Suspense boundary, and a boundary lets the server flush the response — status line included — before the page under it renders. One section-wide `app/guide/loading.tsx` therefore made every unknown id answer **200** carrying a not-found page. The skeleton (`components/guide/Skeleton.tsx`) now sits in six scoped files, which is why `/guide`, `/guide/work`, `/guide/places` and `/guide/cities` each live in a `(index)`/`(list)` route group — a group adds nothing to the URL but stops the subject pages inheriting the boundary. It is also where the wait actually is: a list page resolves the session (`guideView`), a subject page reads static data. Don't "tidy" the groups away or hoist the file back up.

## The planner — one list, two views (read [docs/PLANNER_PLAN.md](docs/PLANNER_PLAN.md) first)

The student's third section, at `/planner` (agenda) and `/planner/board`.
Private — `robots.ts` blocks it, the sitemap does not list it, each page calls
`requireSession` with **its own path**.

- **The selection rule is one sentence: the planner holds things that have a
  date and a state.** From that everything follows, including the split between
  the views: **the agenda shows everything with a date, the board shows
  everything with a state the student owns.** Committed opportunities are the
  intersection and appear on both. SAT cutoffs and verified application
  deadlines are dated facts about the world with no state, so they are agenda-
  only — a card nobody can move is what breaks a board. Roadmap **phases** are
  separators in the agenda and never items: a phase is a *period*, so it has
  neither a single date nor a state.
- **Nothing is duplicated. `movePlannerItem` dispatches on `origin`** — an
  opportunity's state is written to `opportunity_intents`, a student's own task
  to `planner_items`. One fact, one home; a snapshot table would drift from the
  catalog the first time a deadline was corrected, and from the number
  `/admin/intents` reads.
- **`dueISO` is null unless the date is confirmed, and that is the whole
  enforcement of "never show a countdown for a date we can't stand behind".**
  The rule lives in the TYPE, not in a component, so a view added later cannot
  forget it. Unconfirmed rows are still listed — under "Dates not announced
  yet", with no position in time.
- **`opportunity_intents.status` gained `doing` (migration 0028).** Not a
  convenience for a middle column: we ask "when will you start?" and previously
  had no way to record whether they did. `applied` keeps its exact meaning, so
  every existing count is unchanged — but anything that *reads* status must
  handle the new value, and `/admin/intents` counts it separately rather than
  folding it into "planning".
- **`dropped` is an archive line, not a column.** The row is kept (0022), but a
  permanent column headed "gave up" on a school student's own planning screen is
  not a neutral design choice.
- **Moving is a button, never a drag.** Native HTML5 drag cannot be operated
  from a keyboard and is poor on touch, and most of our students are on a phone.
  `stepStatus` is the whole move model, and it is pure.
- **`lib/planner/load.ts` is the ONLY place the planner touches `key-dates` or
  `roadmap`**, it is server-only, and it reaches both through dynamic `import()`.
  `lib/data/planner.ts` takes `PlannerCompetition` — a structural subset of
  `Competition` — so the pure core never imports the catalog at all. Same bundle
  rule as `guide-filter.ts`; `/planner` is 110 kB against an 87.8 kB baseline
  because of it.
- **No client component in the planner calls `new Date()`.** `todayISO` is
  resolved once in the loader and passed down. That is what makes the two views
  agree with each other, survive hydration, and stay unit-testable.
- **A derived card cannot be deleted, only dropped** — deleting it would delete
  the record of a commitment. Own tasks delete.
- The views are a registry ([lib/data/planner-sections.ts](lib/data/planner-sections.ts)),
  same as the guide's steps. Adding mind maps was one entry, as intended.

### Mind maps (`/planner/maps`, migration 0029)

- **We store the STRUCTURE, never the coordinates.** A node has a parent and a
  position among its siblings; the picture is computed by `layoutTree` in
  [lib/data/mindmap.ts](lib/data/mindmap.ts), so one tree always draws one map.
  That is what keeps release 1's "moving is a button, never a drag" rule true
  here (there is nothing to drag), what makes the outline keyboard-operable
  without a second parallel interaction model, and what makes the geometry
  unit-testable. If placement is ever really wanted, the additive answer is two
  nullable **offset** columns on top of the computed position — never a switch
  to stored coordinates.
- **`buildTree` is defensive about three states the database can hold and a
  renderer cannot survive**: a parent from another map (dropped), a cycle
  (broken, not recursed into), and depth past `MINDMAP_MAX_DEPTH` (truncated).
  The query is already scoped; the builder does not assume it was written right.
- **The outline is a real ARIA tree — Tab moves in and out, arrows move within.**
  Binding Tab to "indent" is the convention in note apps and it takes away the
  one key a screen-reader user needs to leave the widget. Structural edits live
  in the action bar instead, which also makes them visible rather than folklore.
- **The action bar sits OUTSIDE the diagram's scroll container.** A dropdown
  inside an `overflow-x: auto` ancestor is clipped; that is why there isn't one.
  Each button is disabled exactly when its operation is impossible, using the
  same pure predicates (`canIndent`/`canOutdent`/`canMoveUp`/`canMoveDown`) the
  server actions check — a lit button the server then refuses teaches the
  structure's rules wrongly.
- **The diagram is `role="img"`; the outline is the content.** Two
  representations of one tree, and only one of them is authoritative or
  focusable. Two focusable copies is a worse experience, not a more accessible
  one.
- **"Send to plan" writes a `planner_items` row and keeps the node.** Deleting
  the thinking at the moment you act on it is backwards, and a test asserts the
  promote path contains no delete.

## Being findable is a feature (`sitemap.ts`, `robots.ts`, canonicals)

The guide is public on purpose — a family choosing between Germany and Korea
should read it without an account — and for a while nothing told a crawler its
77 evergreen pages existed. Four things now do, and each has a rule:

- **[app/sitemap.ts](app/sitemap.ts) is generated from the registries**
  (`GUIDE_SECTIONS`, `allCareerAreas`, `STUDY_DESTINATIONS`, `HUBS`), never
  hand-listed — same reason the landing page counts the catalog instead of
  quoting a number. It carries **no `lastModified`**: we don't record when a
  country profile was revised, and stamping `new Date()` would tell a crawler
  the whole site changed on every deploy.
- **[app/robots.ts](app/robots.ts) blocks preview deploys entirely** (`VERCEL_ENV
  !== "production"`), because a `*.vercel.app` copy competes with the canonical
  domain for our own content. Note the prefix trap: robots matching is by
  prefix, so `Disallow: /partner` would also hide `/partners`, the public list —
  hence `/partner$`. A unit test asserts no rule blocks anything the sitemap
  advertises, and that the private trees really are blocked.
- **Canonicals come from [lib/seo.ts](lib/seo.ts) (`pageMeta`) and drop the
  query string.** `?f=` is a filter, not a different document. The one exception
  is `/guide/compare`, where the query *is* the subject — and there the pair is
  sorted, so `?a=italy&b=germany` and `?a=germany&b=italy` report one canonical
  instead of competing as identical twins.
- **An unknown id must be a real 404.** See the loading-boundary note in the
  guide section above: this was a 200 for months and it is the one status a
  crawler must not see for an address that doesn't exist.

**What is NOT fixed, deliberately: the guide is still `force-dynamic` and
uncacheable.** Two independent causes, both measured: the layout reads the
session to choose a shell (Next 14 has no partial prerendering, so that alone
forces a per-request render), and middleware mints `compass_vid`/`compass_sid`
on every request, so every HTML response carries `Set-Cookie` and
`cache-control: private, no-store`. Making the guide static means either giving
up the signed-in shell or duplicating the route tree — an owner call, not a
refactor. The cost is small for a crawler (static data, no auth round trip when
there is no cookie), so it was left alone.

## Layout: width buys columns, never line length

[components/ui/Shell.tsx](components/ui/Shell.tsx) is the one content container
for the student's section (1024 → 1152 → 1280 → **1440**, gutters growing with
it). It replaced a `max-w-5xl` set independently in three files, which on a
1920px display spent ~900px on empty gutter and turned every page's content into
HEIGHT instead.

The rule in the file's name is the one that matters, and breaking it is the
obvious-looking mistake: **a wider container must be answered with more cards
per row, or a side rail moved up beside the content — never with longer text.**
Widening alone took the country page to 131 characters per line against a
readable measure of 60–75. Long-form prose therefore carries its own cap
(`max-w-[60ch]`) regardless of how wide the shell is.

Two things learned by measuring, worth not rediscovering:

- **`ch` is the width of a zero, not of an average letter.** `68ch` rendered as
  ~82 real characters in this font; `60ch` lands at ~72. Set the cap by
  measuring, not by reading the number as characters.
- **Density has to be applied at the level that actually repeats.** Making the
  city cards 4-up cut the page by 2%, because the list is grouped by country and
  15 of the 19 groups hold a single city. Flowing the *groups* into columns cut
  it from 4487px to 2047px. Look at what repeats before adding `grid-cols`.

`DetailShell`'s `aside` is the same idea at page level: below `lg` the onward
links follow the content as before, from `lg` they become a sticky rail in the
column that was empty anyway. It is pinned at `top-20` because StudentNav is
sticky and ~57px tall.
- Step 4 obeys the world-map rule: every route in [lib/data/from-home.ts](lib/data/from-home.ts) carries its catch and a first move, test-enforced. **No URLs in that file** — the catalog owns links, because `test:links` checks those.

## The landing page: the front door has to be on the front page

[app/(marketing)/page.tsx](app/(marketing)/page.tsx) was built end-to-end for
the admission report — hero, three pains, "how we score you", a scorecard, a
campus-mascot gallery, an FAQ about the score. Opportunities appeared on it as a
button. It now runs in the product's own order: **what you can enter → what the
list is made of → how it works → why lists usually fail → where it leads (the
guide) → honest by design → the report, opt-in → organisations → FAQ → close.**

- **Every number on the page is computed from the data at request time** —
  `COMPETITIONS.length`, the free count, the always-open count, `allCareerAreas()`,
  `HUBS`, `STUDY_DESTINATIONS`, `HOME_ROUTES`. A hardcoded "150+" drifts from what
  the student then sees; a read cannot.
- **The hero visual is the product, not a picture of it.** `OpportunityPreview`
  is a SERVER component rendering four real catalog rows with the same four facts
  every card carries (what it is · who can enter · what it costs · when it
  closes). It ships as HTML: no image, no hydration, no JS.
- **The map belongs to the report section and mounts only when scrolled to.**
  It plots the universities the analysis benchmarks against — that is report
  content, and it is the most expensive thing on the page.

- **The hero's background is `HeroField`, and it is four layers of paint with
  no JavaScript** ([components/marketing/HeroField.tsx](components/marketing/HeroField.tsx),
  the CSS under "THE HERO FIELD" in [app/globals.css](app/globals.css)). The
  section used to paint `bg-surface` and stop, which on the dark theme is a flat
  near-black rectangle under the badge, the `<h1>` and both calls to action. Five
  rules, all test-enforced, and each is a bug that shipped or nearly did:
  - **Only `transform` and `opacity` ever animate.** That rules out the two
    recipes every tutorial leads with — a mesh animated through
    `background-position`, and a `filter: blur` radius — because each re-paints
    every frame. So **the softness is in the paint**: a blob is a
    radial-gradient whose own falloff *is* the blur, and there is no `filter`
    anywhere in the block. The field replaced two `blur-3xl` divs, so the
    section has fewer paints than before.
  - **Gradient stops are `rgb(var(--x) / 0)`, never `transparent`.** The keyword
    is `rgba(0, 0, 0, 0)`, so a stop running to it interpolates through black and
    leaves a grey bruise round every blob — worst on the light theme.
  - **Every loop is closed (`0%` == `100%`).** The reduced-motion guard forces
    `animation-iteration-count: 1` *as well as* a ~0 duration, so an infinite
    animation does not pause where it started — it **jumps to its end state**.
    The lattice is allowed to close by geometry instead: it drifts exactly one
    cell, so its end is pixel-identical to its start and `linear infinite` has
    no seam. The sparks are the one exception, and deliberately: their 100% is
    `opacity: 0`, so reduced motion *removes* the runners rather than freezing
    three dots in mid-air.
  - **The field's strength is a solve, not a taste.** The bound: at the worst
    composite it can produce anywhere — the beam and its sweep overlapping, the
    strongest blob centred on top — the faintest text on it must still clear
    4.5:1. Fixing the hero's promise paragraph was part of the same job: it was
    `text-ink/60`, i.e. **4.53:1 on the bare light page**, AA by three
    hundredths before any background existed. **An alpha modifier on `ink` is a
    colour nobody has checked** — reach for `ink-soft`/`ink-faint`, which are.
  - **Vertical anchors are `vh`, never `%` of the section.** That section is
    ~900px on a desktop and **1635px at 375×812**, because below `lg` the
    message and the card stack. Percentage offsets put two of the three lights
    outside the fold on a phone while looking perfect on the display they were
    built on.

- **Every band under the hero is [Band](components/marketing/Band.tsx), which
  carries Shell's ramp** (1152 → 1280 → 1440). Nine sections used to set
  `max-w-6xl` on their own, so at 1920 the page held 1152px of content inside
  768px of gutter while the hero above it ran to 1600 — it narrowed at exactly
  the point where the reader stopped looking at the product and started reading
  about it. Same rule as Shell: **width buys columns, never line length**, so a
  widened band has to be answered with more cards per row, and any prose in it
  needs its own cap. **Cap prose in `ch`, not in `rem`** — `max-w-2xl` bounds
  the box and does not track the type inside it, which is how the partners band
  reached 89 characters a line. And **measure in real characters, not in `ch`**:
  a `ch` is the width of a zero and reads ~20% narrow, so "78ch" is ~94
  characters. A test fails any landing container that caps at 1152.
- **The planner is on this page now, and the order it appears in is the
  product's:** what you can enter → where it leads → **then it becomes work** →
  the report. Its three cards are read from `PLANNER_SECTIONS`, not written out,
  for the same reason every count here is computed. It was deliberately absent
  for two releases: this page does not describe a feature until it works, and
  until `0028`/`0029` were applied two of the three views returned an error
  naming a migration.

Four traps that cost real seconds, all of them found by measuring:

1. **Never preload every country's terrain.** `MapView` used to warm all five
   rasters on mount — 2.0 MB, on the landing page, competing with the fonts.
   Only the two countries one click away are warmed now, and on idle.
2. **The map's geometry is precomputed, not imported.** `OutlineMap` used to
   `import` five GeoJSON files (~126 kB → a 140 kB client chunk) and re-project
   58 US rings on the main thread on every country switch. Run
   `npm run map:outlines` to regenerate [lib/data/map-outlines.ts](lib/data/map-outlines.ts)
   after touching `public/data`; a unit test diffs the committed file against the
   generator, so a stale commit fails rather than drawing an old coastline.
3. **`getUniversityLogos()` is size-capped, and picks by weight.** /public/logos
   is 94 files / 3.8 MB and the marquee renders the list twice. It now takes the
   32 lightest files under 40 kB (~143 kB). Selecting alphabetically instead
   ended the row at "Lehigh" and dropped MIT, Yale, Stanford and Princeton —
   all small files that were never the problem.
4. **The landing page ships no framer-motion.** FAQ is native `<details>` (zero
   JS, answers in the HTML for search, keyboard-operable for free); `HowItWorks`
   and `FinalCTA` are plain server components. The old versions held content at
   `opacity: 0` behind a scroll observer — the same anti-pattern the guide
   removed. And **no animated `filter: blur`**: the rotating headline blurred on
   a 2.6s loop forever, re-rasterising a 60px `<h1>` for as long as the tab was
   open. Transform and opacity only, and the interval stops when the hero
   scrolls out of view.

Result: first-load JS for `/` went 163 kB → 107 kB, and the first paint pulls
no terrain, no logos and no GeoJSON at all.

## Partner organisations (Astana Hub, Shymkent Hub, …)

An organisation posts its own competitions under its own name, logo and
verification tick. Migration `0024_partners.sql`; routes `/partners` (public
list + profile + application), `/partner` (their console), `/admin/partners`
(review). Role `partner` is granted by an admin approving an application.

- **Trust is granted once, per organisation, not per post.** An approved partner
  publishes instantly with no queue. The safety net is removal: an admin can
  unpublish one post or suspend the whole partner, and
  [lib/partners/live.ts](lib/partners/live.ts) drops every row whose partner is
  not `active`. That file is the single mapping from live rows to `Competition`
  for both student surfaces — don't reimplement it per page.
- **The tick means "we confirmed the account belongs to that organisation, and
  they posted this."** Not "this is good". Verification is a separate admin
  action from approval, and a partner cannot rename itself after being verified.
- **A partner-set deadline is `dateConfirmed: true`** — the one place that is
  granted without a scrape or a hand check, because it's the organiser stating
  their own date. Past dates are rejected at the form.
- Partner posts land in `competition_deadlines` with a `partner_id`, so they
  flow through `resolveCompetitions()` like any other live row. No second
  catalog, no second renderer.

## Site traffic (`/admin/traffic`) — the denominator

`events` (0001) only ever recorded what a **signed-in** user did, so every
conversion number on `/admin` was a fraction with an unknown bottom half.
Migration `0025_traffic.sql` adds `page_views`, and this is the bottom half:
everyone who arrives, signed in or not.

- **Two anonymous ids, both minted in middleware** ([lib/supabase/middleware.ts](lib/supabase/middleware.ts)):
  `compass_vid` (1 year → "a visitor") and `compass_sid` (re-set every request
  with a 30-minute max-age, so it slides → "a visit"). Both are httpOnly random
  uuids, derived from nothing about the person. They are also written onto the
  **request**, or the very first page load of a new visitor would be invisible.
- **Path only, never the query string.** `cleanPath` in
  [lib/traffic/track.ts](lib/traffic/track.ts) is the privacy boundary of the
  whole feature — our URLs carry `?ref=` codes, `?next=` paths and auth callback
  tokens, and none of that may reach an analytics table. A unit test pins it.
- **Time on page is VISIBLE time.** The row is written when a page opens; a
  beacon fills in `dwell_ms` when it closes ([components/analytics/Traffic.tsx](components/analytics/Traffic.tsx)),
  and the clock pauses when the tab is backgrounded. Writing the row on *close*
  instead would be tidier and would lose every visit the browser kills. **A null
  `dwell_ms` means unknown, not zero** — such visits are excluded from the
  median and from the bounce denominator rather than counted as 0s.
- **Not recorded:** `/admin` (a dashboard that counts its own reader tells you
  about yourself), `localhost`, and `*.vercel.app` previews — set `TRACK_LOCAL=1`
  to record local ones while testing. Bots are filtered by UA, and the tracker
  is client-side, so crawlers that don't run JS never arrive at all.
- **Every metric is a definition, and definitions live in one place**
  ([lib/traffic/summarize.ts](lib/traffic/summarize.ts), pure, unit-tested).
  "Returned" = seen on **2+ separate days**, never "clicked twice". The page
  repeats the relevant definition under each panel on purpose: an analytics
  screen whose terms are unwritten gets believed for six months and then
  distrusted forever.
- `page_views` has **RLS on with no policies** — stricter than every other
  table, because a visitor has no account, so "own rows" has no meaning and a
  readable traffic log would let any user enumerate what everyone else reads.
  The service-role client is the only reader and writer.

## The AI analysis pipeline (the heart — read these together)

Spans [lib/ai/prompt.ts](lib/ai/prompt.ts), [lib/ai/analyze.ts](lib/ai/analyze.ts), [lib/ai/schema.ts](lib/ai/schema.ts), [lib/ai/assemble.ts](lib/ai/assemble.ts), [lib/ai/italy-analyze.ts](lib/ai/italy-analyze.ts), [lib/rubric.ts](lib/rubric.ts), [lib/data/universities.ts](lib/data/universities.ts).

- **Multi-Country Architecture:** The US pathway uses the AI model. The Italy pathway (`italy_programs`) is evaluated strictly deterministically in code (`lib/ai/italy-analyze.ts`), bypassing AI generation to avoid hallucinations.
- **The model returns qualitative JSON only.** It does NOT compute the overall score or the benchmark table. The model output is validated against `modelAnalysisSchema` (the full `analysisSchema` minus `overall_score`, `benchmarks`, and Italy data). Then `assembleAnalysis()` computes the **overall score**, **benchmarks**, and **Italy program analyses** deterministically in code, producing the full `Analysis` the dashboard renders. Same profile → same numbers, run to run.
- **Prompt caching:** `STATIC_SYSTEM_PROMPT` (instructions + rubric + ~55 universities) is sent as a cached system block and **must stay byte-identical across requests** — only the per-user profile (the user message) varies. Don't put per-user data in the system block; keep dataset ordering stable.
- **Robustness:** the call is **streamed** (`messages.stream().finalMessage()`), `maxRetries` lets the SDK back off on 429/5xx, and a parse failure retries once. A reply cut off by the token cap (`stop_reason === "max_tokens"`) fails fast with an actionable error. `app/api/analyze/route.ts` sets `maxDuration = 60` and rate-limits to 5 analyses/hour/user.
- The dashboard re-validates the stored analysis with the full `analysisSchema` and renders charts from the JSON — the model never draws.

## Colour is themed: two palettes, one set of tokens

The product follows the reader's operating system — there is no toggle and no
`dark:` variant anywhere. [app/globals.css](app/globals.css) holds every colour
**once per theme**, and [tailwind.config.ts](tailwind.config.ts) holds none: it
names roles and reads `rgb(var(--token) / <alpha-value>)`.

- **Values are CHANNEL TRIPLETS (`16 25 43`), never hex.** That form is what
  keeps Tailwind's opacity modifiers working, and the product has 256 of them
  (`bg-accent-soft/25`, `text-ink/60`). Hex here breaks every one silently.
- **Anything read outside Tailwind must be `rgb(var(--x))`**, not the bare
  variable — a raw triplet is not a colour. That covers Recharts fills,
  `lib/tiers.ts`, and inline `style`.
- **Three roles per colour, and they are not interchangeable:** `DEFAULT` is a
  FILL (graphics, 3:1), `soft` is a tinted background, `ink` is TEXT (4.5:1 on
  the page, on a card, and on its own tint). `text-reach` is always wrong; use
  `text-reach-ink`. A unit test enforces both the ratios and the usage, **in
  both themes**.
- **`text-on-fill`, not `text-white`, for text on a saturated fill.** A fill has
  to get lighter in dark mode to stay visible, so white on it is 2.69:1. And
  `bg-ink text-white` is the classic inversion trap — `ink` is nearly white in
  dark mode, so that button became white on white. Use `text-surface` there.
- **The filled primary button is `bg-cta text-cta-ink`, never `bg-ink`.** Same
  root cause one layer down: `bg-ink text-surface` is a handsome deep-navy
  control on a light page and a NEAR-WHITE SLAB on a dark one, and at `size="lg"`
  it becomes the brightest object on the screen. It was reported twice, about two
  different buttons, which is how we knew it was the rule and not the placement.
  `cta` stays the same navy in light mode and becomes the accent in dark — a
  button, unlike the `band`, cannot simply stay dark, because it has to lift
  clear of the page it sits on. The test asserts a **luminance ceiling** (< 0.55
  in both themes) alongside the label contrast: contrast alone passed the whole
  time this was broken. Small `bg-ink` controls — the 7×7 step badges, the admin
  toggles — are still correct; the rule is about things that fill an area.
- **Shadows theme too** (`--shadow-card`/`--shadow-lift`): a translucent navy
  cannot darken a dark surface, so the dark values are pure black at 40–80%.
- **What must NOT theme:** national flags, the Google logo, and the ambassador's
  QR code (a themed QR can stop scanning). `AuthAside` paints its own fixed dark
  gradient, so white text there is correct in both.
- `:root[data-theme="dark"]` / `:not([data-theme="light"])` are already wired
  alongside the media query, so adding a toggle later is one component, not a
  refactor. **Note the measuring trap:** flipping that attribute at runtime does
  not repaint `var()`-derived colours in a throttled/hidden browser pane — the
  custom property updates and `color` does not. Audit a theme by loading the
  page under that OS setting, not by toggling the attribute.

## Type is a system, and one of its axes is the theme

Colour was already tokenised per theme; type was not, and the gap was the whole
reason the dark theme read as harder work. **Contrast was never the problem** —
every text token on `/opportunities` measured 5.48:1 or better while the
complaint stood. Four rules, all test-enforced:

- **`--type-tracking-body` is a theme token** (`app/globals.css`): 0 in light,
  `0.008em` in dark. Light text on a dark ground **blooms** — glyphs spread into
  the background, counters close, and the space between letters is eaten — and
  Inter feels it more than most because its default fit is tight. It is applied
  on `body` so it **inherits**, and so the 73 `tracking-tight` headings and the
  38 tracked labels keep the value they chose. Nothing in the product sets
  tracking on body copy, which is what makes that insertion point clean. Bounded
  at 0.02em by a test: past that it stops being optical compensation and starts
  being letter-spacing a reader can see.
- **11px is the floor, everywhere.** 69 labels sat at 10px and four at 9px,
  across 21 files — the report's programme cards, four country breakdowns, the
  admin tables, the guide's badges, the landing's own hero preview. A floor that
  holds in some components is not a floor, so the test walks the whole tree.
- **A card needs a step, and size alone should not carry it.** The two cards
  that carry the product both measured flat: the opportunity card ran title 18 /
  body 15.2 (a step of **1.18**), and the guide card — the navigation for 88
  pages — ran title 14 / body 14, a step of exactly **1.00**. Both are 1.14–1.25
  in size *and* 200 in weight now. No contrast test could ever have caught
  either, which is the point: "everything is nearly the same size, nearly the
  same distance apart" is what a reader means by a wall of text.
- **Group facts that are the same kind of fact.** The opportunity card had five
  text tiers 4–10px apart and therefore no groups. Eligibility and the deadline
  are both *the terms of entry*; they are one block now, set off from the
  description by real space. Five tiers became four.

**`text-accent` is a fill, not a foreground** — 4.28:1 on the page background.
The existing "no tier fill as text" test named this exact mistake and covered
only `reach`/`target`/`likely`, so 22 call sites were painting text with
`accent`. It covers `accent` now, with an exemption for icons (a graphic owes
3:1). Two traps in that exemption: an icon's evidence is often **not on the same
line** as its colour — the size can come from a `${px}` variable and
`role="img"` sits two lines up — and **`AuthAside` paints its own fixed dark
gradient in both themes**, so `accent-ink` is a regression there rather than a
fix.

**The surfaces we never drew still carry the design.** Text selection was themed
already; the **scrollbar** (the largest of them — Chrome's default on a
near-black page is a light grey slab that is the brightest vertical object on
screen) and the **caret** now are too, both from `--ink`.

## Tailwind classes are linted against the config

`eslint-plugin-tailwindcss` runs inside `next build` with
`no-custom-classname: error`, so **any class Tailwind cannot generate fails the
build by name** — a typo (`bg-inkk`), or a utility from a plugin we don't install.
This exists because Tailwind silently drops what it can't resolve: four modals
carried `animate-in fade-in zoom-in-95` from the uninstalled `tailwindcss-animate`
for months and simply never animated, with a green build the whole time. Two
places had even been patched around with inline `style={{ height: 18 }}`.

Pinned to `eslint-plugin-tailwindcss@3.17.5` on purpose: 3.18 pulls
`tailwind-api-utils`, which fails to resolve Tailwind 3 ("Could not resolve
tailwindcss"), and 4.x needs ESLint 9 while Next 14 ships ESLint 8. If a real
custom class is ever needed, add it to `settings.tailwindcss.whitelist` in
[.eslintrc.json](.eslintrc.json) — don't disable the rule.

## Controls: merge classes, and let the caller win

[components/ui/Button.tsx](components/ui/Button.tsx) is the button system —
`variant` × `size` × `shape` (`rounded` | `pill`). Four rules, all
test-enforced in [scripts/test-engine.ts](scripts/test-engine.ts), and each one
is a bug this codebase shipped:

- **A component that mixes its own classes with a caller's `className` must
  merge them with `cn`** ([lib/utils.ts](lib/utils.ts) — clsx + tailwind-merge),
  never a template string. Tailwind utilities of the same type share
  specificity, so with concatenation `px-7` from a caller and `px-8` from a size
  both ship and the winner is whichever Tailwind emitted later. The landing
  hero's primary CTA asked for `px-7 py-4` and rendered `px-8 h-14` for its whole
  life — green build, clean lint, correct-looking review.
- **A `!` Tailwind escape at a call site is never a style decision.** It is that
  bug, found locally and forced. Fix the component instead. A test fails the
  build on any `!utility-`.
- **Focus is `focus-visible:focus-ring`** — the themed utility in
  `globals.css` (`ring-accent` over `ring-offset-surface`). Never a hardcoded
  offset: `ring-offset-white` paints a white halo on the dark theme's near-black
  page, and no light-mode screenshot will ever show it. A test bans it, and a
  second test fails any `<a>`/`<button>` that paints itself as a control
  (rounded / border / bg / padding) without a focus style — there were eleven.
- **Don't rebuild a variant by hand.** `rounded-full bg-ink px-8 py-4 …` on a raw
  `<Link>` is a second definition of `primary` that changes to the real one never
  reach — that is exactly how the landing page and `FinalCTA` ended up with no
  focus ring and no press state.

`cn` costs ~9 kB in any **client** bundle importing the component; server-rendered
call sites pay nothing, so `/` is unaffected. `Shell.tsx` and `Logo.tsx`
deliberately still concatenate: no call site overrides one of their groups, and
their client importers don't otherwise carry tailwind-merge.

`eslint-disable-next-line` disables exactly the **next line** — put the reason
above it, never as a `--` tail wrapping onto more comment lines, or the directive
suppresses a comment while the real line keeps warning. Test-enforced.

## Input bounds (single source of truth)

[lib/limits.ts](lib/limits.ts) (`LIMITS`) defines all caps and is enforced in **three places**: the intake Zod schema ([app/onboarding/actions.ts](app/onboarding/actions.ts)), the onboarding UI ([components/onboarding/Onboarding.tsx](components/onboarding/Onboarding.tsx)), and the model-input builder (`buildModelInput` in analyze.ts). Change a limit here and all three follow. This bounds token cost and prevents oversized profiles from timing out the analysis.

## Intake: Common App–style Activities & Honors

The activities and honors sections mirror the Common Application 1:1 (field set, options, char limits). Types and option lists (`ACTIVITY_TYPES`, `GRADE_LEVELS`, `ACTIVITY_TIMING`, `HONOR_LEVELS`) live in [lib/types.ts](lib/types.ts). `normalizeActivities`/`normalizeHonors` there map older `{title, detail}` rows onto the current shape, so existing DB profiles keep working — use them whenever reading `activities`/`honors` from the DB. Activities stay in the `activities` jsonb column; honors are in their own `honors` column (migration `0002`).

## Supabase access model

- [lib/supabase/server.ts](lib/supabase/server.ts) — anon key, respects RLS **as the logged-in user**. Default for server components / route handlers / actions.
- [lib/supabase/admin.ts](lib/supabase/admin.ts) — service role, **bypasses RLS, server-only**. Use only for trusted writes (provisioning, event log, inserting analyses, admin metrics, rate-limit counts).
- [lib/supabase/client.ts](lib/supabase/client.ts) — browser client (auth UI).
- [lib/supabase/middleware.ts](lib/supabase/middleware.ts) — refreshes the auth session on every request AND captures the `?ref=CODE` ambassador code into a long-lived cookie.

RLS gives every table "own rows only"; ambassador signup counts come from the `signup_count_for_code` SECURITY DEFINER function. Inserts that must cross users (events, ambassador counters) go through the service-role client.

## Auth & roles

[lib/auth/session.ts](lib/auth/session.ts): `getSession` / `requireSession` / `requireRole` and `landingPathForRole`. [lib/auth/provision.ts](lib/auth/provision.ts): idempotent post-signup provisioning (profile row + referral attribution + signup event), run with the service role from [app/auth/callback/route.ts](app/auth/callback/route.ts). Roles (`student`/`ambassador`/`admin`) are set **manually in the DB** — there is no UI for promotion (see [docs/SETUP.md](docs/SETUP.md) §7).

## Database migrations

SQL files in [supabase/migrations/](supabase/migrations/). They are applied **manually** in the Supabase SQL editor (no migration runner wired up). After adding a migration, tell the user to run it.

**`npm run db:check` answers "is the database actually what this code assumes?"**
in a couple of seconds ([scripts/check-schema.ts](scripts/check-schema.ts)) —
read-only, one probe per table, no config to expose. Run it after applying a
migration, and before believing any note about what is applied: the first run
found `profiles.heard_from` (0006) missing, which had been silently discarding
every "how did you hear about us?" answer.

**Add the expected columns to that script in the same commit as a new
migration.** It is what lets defensive scaffolding be deleted instead of
accumulating: code no longer has to survive an unknown schema, because the
schema is checkable. The `undefined_column` retry paths around
`opportunity_intents` were removed on exactly that basis. `0001_init.sql` = schema + RLS + helper function; `0002_honors.sql` = the `honors` column.

## i18n — the site is English-only

[lib/i18n/dictionary.ts](lib/i18n/dictionary.ts) is a flat `key → string` map. The RU dictionary and the language toggle were **removed** — add new strings in English only, and don't re-add a translation layer. Use `getT()` on the server, `useT()` on the client. New copy can also just live in the component; there is no requirement to route it through the dictionary.

## Cost & abuse

**Both cron endpoints fail CLOSED** ([lib/cron/auth.ts](lib/cron/auth.ts)): no
`CRON_SECRET` in the environment ⇒ 503, nobody runs them. The previous gate was
`if (secret && header !== secret) 401`, which let *everything* through while the
variable was unset — and it was unset in production. Those routes fetch pages,
call the model, and write with the service-role key, so an open one is a direct
route to an unbounded bill. **`CRON_SECRET` must be set in Vercel or the
scheduled runs stop** (Vercel sends the header automatically once it exists). A
unit test pins the fail-closed shape.

The only real financial risk is an uncapped API bill. The code rate-limits per user and caps `max_tokens`, but the **hard spend cap must be set in the Anthropic console** (it cannot be set from code). Keep prompt caching working and input bounded.

## Branching

`main` is **production** (Vercel deploys it) and is protected. `develop` is the
integration branch — branch from it, PR back into it. A release is a PR from
`develop` to `main`; a hotfix branches from `main` and is merged back into
`develop` afterwards. Never commit straight to `main`. Full model in
[CONTRIBUTING.md](CONTRIBUTING.md).

## Working agreement: committing

Do **not** create the final `git commit` unless the user's prompt explicitly tells you to (e.g. "commit it yourself", "сделай и закоммить сам"). Otherwise, do all the work — including building and verifying — then stop before the commit and present the result for approval. Everything else may proceed without asking. Never commit secrets; `.env.local` is git-ignored.
