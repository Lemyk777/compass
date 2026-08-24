# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Starting a session?** Read
> [docs/BACKLOG_2026-08.md](docs/BACKLOG_2026-08.md) **§1 first** — it says what
> is deployed versus what is only on the branch, and getting that wrong is the
> fastest way to do work twice. §8 has the ordered next list, §5 the findings,
> §7 the working method, and **§9 the direction** — what the next build is for,
> as opposed to what it is. §8 also ends with a list of **problems** that are
> nobody's work item.
>
> **Splitting the work up? [docs/WORKFLOW.md](docs/WORKFLOW.md)** says which
> kinds of work may be handed to a subagent and what each one has to come back
> with. The rule is one sentence — *a piece of work may be split off only when
> it ends in a fact the main session can check without redoing the work* — and
> the four agents that satisfy it live in [.claude/agents/](.claude/agents).
> There is deliberately no reviewer agent: three whole-branch reviews of the
> companion found six real bugs by reading and missed the three that mattered,
> because all three were properties of height, position and adjacency. A fourth
> reader would have missed them too.
>
> **The recurring one is that a guard here can be useless in FIVE distinct ways,
> and only the first is visible in a diff.** (1) The regex loses its
> backslashes, so it matches nothing and reports nothing — three guards, found
> by grepping 433 regex literals for the signature; the eleven ban patterns now
> live in one `BAN` table with a typed fixture each. (2) The regex is correct
> but aimed at a string the defect never appears in. (3) The guard is correct
> and its INPUT SURFACE is narrower than the rule — a class-string scanner
> cannot see `fontSize: 10` passed as a JSX prop. (4) **The guard is correct,
> bites, reads the right string, and measures the wrong PROPERTY** — the
> companion's beats passed a word cap, an opening-word rule and a banned-noun
> list while reading as riddles, because all three measure form and the defect
> was structure. (5) **The defect arrives through a channel the guard cannot
> see at all** — the contrast guards read class names for alpha colour
> utilities, and a filter chip failed at **3.27:1** because of an `opacity-50`
> on the element, which composites AFTER the class is written and over colours
> that individually pass. No class-name scan could ever have caught it. Ask
> what a passing guard actually proves, and whether a reader's complaint could
> survive it untouched.
>
> **A sixth thing, not a fail-open but a guard that gets exempted to death:**
> one aimed at a vocabulary's WORDS rather than its SHAPE. Counting how often
> a cost model's name appeared anywhere in a file flagged nine files and eight
> were unrelated unions sharing a generic word (`"unknown"`, `"free"`).
> Rewriting it to the shape every real instance had — an array literal holding
> 3+ DISTINCT members — went from 9 findings (1 real) to 1 finding (1 real).
> Words are shared across unrelated concepts; shape is not.
>
> **Then [docs/AUDIT_2026-08-14.md](docs/AUDIT_2026-08-14.md)** — nine findings
> with evidence. **Seven are closed and two are open** (status table at the top
> of that file, re-verified 2026-08-24). The two left, A7 and A8, are both DATA
> rather than code. Four closed together on 2026-08-24 because they were four
> symptoms of one cause — see the vocabulary rule in the Opportunities section.
>
> A1 closed because its date passed on
> 2026-08-14, which turned "a confirmed date is never already in the past" red on
> `main` for every branch, and the owner's answer on 2026-08-15 was to remove the
> row (catalog 173 → 172). The audit's do-not-touch instruction did its job — it
> said raise it with the owner rather than fix it, and that is what happened. A3
> closed with the one-list release. **Two side effects of removing that row are
> live rules now: the catalog has ZERO `pinned` entries and ZERO `region`-tagged
> entries, and a unit test pins each zero.**

## What this is

Compass — a guidance tool for international students. **Opportunities is the front door**: what competitions, olympiads, courses and programmes a student can actually enter, at their age, with honest dates and costs. The **planner** ([docs/PLANNER_PLAN.md](docs/PLANNER_PLAN.md)) is the third section, where what they committed to becomes dated work. The admission analysis (factor scores, per-school likelihood ranges, benchmarks, gap analysis, recommendations across **US · Italy · Hong Kong · UAE · Korea**) is now one opt-in input, not the product a student arrives for. Three roles share one backend: **student** (core product), **ambassador** (referral growth), **admin/founder** (metrics). Full product spec lives in [docs/compass-project-blueprint.md](docs/compass-project-blueprint.md); setup in [docs/SETUP.md](docs/SETUP.md); a map of the codebase in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md); the plan of record for the front door in [docs/OPPORTUNITIES_PLAN.md](docs/OPPORTUNITIES_PLAN.md).

Stack: Next.js 14 (App Router, RSC, server actions) · TypeScript (strict) · Tailwind · Supabase (Postgres + Auth + RLS) · Anthropic `claude-haiku-4-5` · Recharts · Zod · framer-motion.

## Commands

```bash
npm run dev            # dev server at http://localhost:3000
npm run build          # production build — also runs ESLint + type-check (use as the main gate)
npm run lint           # ESLint only
npx tsc --noEmit       # type-check only
npm run test:unit      # 316 unit tests for the deterministic engine (node:test, no key/network)
npm run test:onboarding # 126 tests over the intake schema + server action (db/auth mocked, not in CI)
npm run test:links     # every catalog URL; fails ONLY on a 4xx that is not a bot wall
npm run test:guide-links # the guide's official sources (ministries, portals)
npm run test:analyze   # run the §12 sample profile through the LIVE analysis engine
node --import tsx scripts/test-session-checks.ts   # 61 pure logic checks
```

The **CI gate** ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs on every push and PR without secrets: `npm run build`, the session logic checks, then `npm run test:unit`. Locally that trio is the verification path — `test:analyze` is the only one needing a real `ANTHROPIC_API_KEY` in `.env.local` (loaded via `node --env-file`).

[scripts/test-engine.ts](scripts/test-engine.ts) covers the deterministic core: rubric/overall scoring, `computeBenchmarks`, eligibility arithmetic (grade↔grad-year, inferred age ranges, "unknown facts never exclude"), the interest quiz, the careers registry, and matching invariants. Add a case here whenever you touch scoring or eligibility.

**Never run `npm run build` while `npm run dev` is running.** They share `.next/`, and the production build replaces chunks the dev server still references — the dev server then dies with `Error: Cannot find module './NNNN.js'` from `.next/server/webpack-runtime.js`, which looks like a code bug and is not one. Stop the dev server first, or recover with `rm -rf .next` and restart it.

## Environment

**Six** vars (see [.env.example](.env.example)) in `.env.local`. Five run the app: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SITE_URL`. Without them the app still builds and `/demo` renders the full report from a sample; auth and analysis require them.

The sixth is **`CRON_SECRET`**, and it is easy to miss because nothing looks broken without it: both cron endpoints fail CLOSED with a 503, so the date sync and the discovery run simply never happen. It must be set in Vercel or the scheduled runs stop. See "Cost & abuse" below for why that direction is deliberate.

## Site structure: the student's section vs the report

Two shells, and the distinction is load-bearing:

- **The student's section** — `/opportunities` (what you can enter), `/guide/*`
  (where it leads) and `/planner` (what it becomes). Frame:
  [components/student/StudentShell.tsx](components/student/StudentShell.tsx)
  — one narrow column, the companion beside it, the report a link away. The
  first two are session-aware and work signed out; `/opportunities` shows the
  guest eligibility checker, the guide opens on every field instead of the
  student's. `/planner` is private.
  **Every opportunity also has its own address** — `/opportunities/[id]`,
  server-rendered, public, in the sitemap, and the reason the detail stopped
  being a modal: a modal has no URL, so the most natural thing a student does
  with this product (find a contest and send it to a friend) was impossible. Its
  Open Graph tags carry the four facts every card carries, so a shared link
  unfurls into who can enter, what it costs and when it closes rather than into
  the site-wide banner. Sending the organiser's own link sends a page that says
  none of that.
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
- **Matching ANNOTATES; it does not hide — and that makes `matchedOnly`
  mandatory.** `buildExtracurriculars` used to drop rows outside the student's
  field or country, which meant a student saw 114 of 172 with no way to ask why
  and **no route to the rest at all**; the control that looked like the way
  there read "Show everything we track for you (114)", where "everything" was
  false. It returns every row now, carrying `offField` / `offRegion`, and the
  filter panel owns the narrowing.
  **Every surface WITHOUT a filter panel must call `matchedOnly`**
  ([lib/data/opportunity-filter.ts](lib/data/opportunity-filter.ts)) — the guest
  eligibility checker, onboarding's `FirstWin`, and `lib/planner/load.ts`. This
  is not tidiness: without it a student in Uzbekistan is shown a competition
  that only runs in Kazakhstan, and **nothing looks wrong** — there are simply
  more rows than there should be. A unit test pins all three files by name, and
  the session check asserts the guarantee where a student meets it (the row
  comes back MARKED, and `matchedOnly` drops it).
  Still hard filters, deliberately: a **past confirmed date** (a closed date is
  a fact about the world, not a narrowing — "show expired" is offering rubbish)
  and rows the student can never enter. `too_young` stays visible.
- **The "matched to you" filter group is INVERTED from every other group**, and
  the type says so. Everywhere else an empty array means "no narrowing"; here
  the default is both options ON, because the honest default is still the
  student's own list. Two consequences, both implemented: `activeFilterCount`
  counts the group by what is **missing** (a widened list is a choice and must
  open the full list like any other filter), and `withoutChip` restores in
  `MATCH_OPTIONS` order because this field is a set and an unstable order makes
  two equal states compare unequal.
  It also killed a shortcut that had been correct for years:
  `filterOpportunities` returned the array untouched when no filter was active,
  which now returns all 172 — the exact bug the group exists to fix.
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
- **An opportunity's four vocabularies — kind, level, tier, cost — live in
  [lib/data/opportunity-vocab.ts](lib/data/opportunity-vocab.ts), and that
  module exists to settle a fight between two of the rules on this page.** The
  one-list rule says a vocabulary is declared once and every validator, filter,
  facet and form derives from it. The bundle rule below says nothing
  client-reachable may import a runtime value from `key-dates`. The canonical
  arrays lived in `key-dates`, so the one-list rule was **unfollowable**
  everywhere the bundle rule applied, and it lost silently every time: `level`
  ended up hand-written in five places and `cost` in seven. The tell was four
  consecutive fields of one Zod object in `app/partner/actions.ts` — the first
  derived from the canonical array, the next three written out by hand. Two of
  those copies were already wrong, both silently: `school` was accepted by the
  admin write path and unknown to everything that reads it, and the admin form
  offered nine of the ten cost models with **`funded`** — *they pay you* — as
  the missing one.
  **`opportunity-vocab` imports nothing at all**, so a client bundle, a server
  action, an edge function and a test can all reach the same array. Every label
  map in it is a `Record<Union, …>`, so **a member added without its label does
  not compile** — the guarantee belongs to the compiler, not to a test somebody
  has to remember. `key-dates` re-exports every name, so old imports still
  resolve. Four tests cover what a type cannot: that nobody keeps a private
  copy, that the derived lists still cover their vocabulary, that every cost
  model reaches a money bucket or is *named* as unbucketed, and that this module
  never gains an import. **When you find the same mistake in many places written
  by people who plainly knew better, look for the second rule that made the
  first one impossible to obey.**
- **The catalog is split by concern**: entries live in [lib/data/competitions-data.ts](lib/data/competitions-data.ts), matching logic in [lib/data/key-dates.ts](lib/data/key-dates.ts) (which re-exports the data, so existing imports still work), and the careers layer in [lib/data/careers.ts](lib/data/careers.ts). The careers
  layer moved to **the guide** — a section of routes, not a page (see below),
  which runs interest → field → sphere of work → the cities that work lives in
  ([lib/data/world.ts](lib/data/world.ts)) → what to enter from home. Every hub
  there must carry BOTH its catch and a real route in — a city with only good
  news listed is an advert, and a test enforces it. The deep layer is
  [lib/data/study-destinations.ts](lib/data/study-destinations.ts) → `/guide/places/[place]`:
  17 full country profiles (money, admissions, after-study, cities, sources).
  **The list leads with the five destinations we actually MODEL, and the order
  is derived from `modelled` rather than written down** (changed 2026-08-22).
  It used to lead with the home region, Kazakhstan and Georgia first, on the
  argument that a guide listing eighteen ways to leave and none to stay is
  recommending rather than reporting. That argument lost to its mirror image,
  raised by the students who built this: leading with Kazakhstan reads as
  steering a reader home, which is the same bias pointing the other way, and it
  is not the question they arrive with. Both versions were a claim dressed as a
  list. `modelled` means Compass already computes admission odds there, which is
  a fact about the product and not a view about a country — past those five the
  order asserts nothing, and `/about` says so in as many words. A unit test pins
  that the lead IS the modelled set, so a country that gains an engine moves on
  its own. **`REGION_ORDER` is untouched and still puts Central Asia first**: it
  groups the world map and the guide's chain geographically, which is not a
  ranking. **Rules,
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
- **Bundle rule (easy to break, and the criterion is SIDE EFFECTS, not size):**
  `key-dates.ts` builds a lookup map over the whole ~2,700-entry catalog at
  module load, so it cannot be tree-shaken and *any* runtime import drags the
  dataset into that route's client bundle. Client components must import
  `formatDate`/`opportunityCost`/`daysBetween` from
  [lib/data/opportunity-format.ts](lib/data/opportunity-format.ts), and anything
  needing catalog-derived data — the three matching views (`OpportunitiesView`,
  `EligibilityChecker`, `FirstWin`) and `RoadmapView` — reaches it through
  [lib/data/use-opportunity-plan.ts](lib/data/use-opportunity-plan.ts), which
  owns the only two dynamic imports of `key-dates`/`roadmap` on the client.
  Type-only imports are free.
  **The load starts on MOUNT, and the date is a separate hook.** All four views
  used to write the same pair by hand: a `useState<Date|null>` set in one effect,
  and a second effect that imported the catalog only once that date existed. The
  second effect cannot run in the first commit, so the largest chunk on the route
  — 120 kB raw, **31.6 kB gzipped** — began downloading a full render cycle after
  it could have, and it depends on `today` in no way at all. The public checker
  was worse: its import was gated on the visitor's ANSWER too, so it started at
  the moment of highest intent. `useToday()` is the date, `useWarmModule()` is a
  mount-only effect that starts the fetch, and `ready` gates the PLAN and never
  the load. Two tests keep it that way, because the old shape reads as perfectly
  ordinary and would be written again by anyone adding a fifth surface.
  **Do not put the load on `requestIdleCallback`.** That was tried and measured:
  the callback did not fire early, it fired at its own 2000 ms ceiling — 2.2s
  after the initial bundle, slower than the waterfall it was meant to fix. The
  `MapView` precedent it was copied from warms a country nobody has clicked yet;
  this chunk *is* the page. A prefetch belongs on idle, the current page's own
  content does not.
  **Reachability, not adjacency.** The rule is about what ends up in a bundle,
  which is transitive, and the guard used to scan for a DIRECT import edge from
  a client component. Two chains slipped through one hop of indirection and cost
  eight routes 27–41 kB each: `RoadmapView → roadmap.ts → key-dates`, and
  `LikelihoodGauge → app-deadlines.ts → key-dates` — the second one for a
  two-line date helper. The test walks the module graph now, stopping at
  `"use server"` files (a server action is an RPC stub, not a dependency).
  **Size alone is not the test:** `world.ts` is 822 lines and shakes clean
  because it is plain consts, which is measurable in `.next/static/chunks`. Do
  not reason about this from line counts — grep the built chunk, or read the
  guard.
- **Never show a countdown for a date we can't stand behind.** A confirmed date renders as a countdown; anything else is "Dates TBA" or "open now". Verify a date against the organiser's own page before setting `dateConfirmed: true`, and read what the page says — `test:links` cannot tell you a contest was discontinued.
- **The catalog's prose has rules, and they live in
  [lib/data/README.md](lib/data/README.md)** under "Adding an opportunity" —
  read them before writing a `blurb`. In short: two sentences of different
  lengths rather than one split by a dash, **no superlatives** (the guide's
  registries are test-banned from them and the catalog is held to the same rule
  by hand), never restate the cost the `CostPill` already shows, and no
  admissions jargon. A blanket find-and-replace is the wrong tool here: the dash
  between two numbers in `eligibility` is read by `parseEligibility`, and one
  between two proper names is a join key.
- **`pinned` is the ONLY editorial override in the ordering, and it reorders
  only.** Everything else about the order is derived from the student's profile
  (fit → confirmed date → days left). A pinned row still has to pass eligibility:
  a card telling a student they can enter something they cannot is the one
  failure this product does not get to make, and "we pinned it" is not a reason
  the student can see. **One at a time** — a list where several rows outrank the
  student's own fit has no order at all. Tests assert all three, and they are
  written against whatever is pinned *today* rather than a named entry, because a
  pinned row is short-lived and a test naming one fails the day it expires.
- **The commitment step lives INSIDE the detail panel, and it must stay
  reachable.** "I'm doing this" → "when will you start?" (`CommitRow`) is the
  product's only behavioural signal and the number `/admin/intents` counts. It
  used to render as the card's footer on the five-row shortlist — so deleting
  that shortlist for the one list deleted its only caller, and
  `saveOpportunityIntent` became **unreachable from the UI for a whole release**
  while still compiling, still exported, still type-checked. It now rides as
  `OpportunityCard`'s `commit` **node** (passed, never imported — the public
  checker has no `DashboardProvider`) and renders in a band of
  `OpportunityDetail` that sits outside the scrolling body. Every row carries
  it, because one tap inside the opportunity you opened is still a decision,
  whereas a hundred of them lying open in the list is the checklist the
  original rule banned. A three-link test pins the chain by name — plus a
  second test proving those patterns BITE on the exact edit that broke it.
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
/guide                    index — the five steps, with counts
/guide/work               1 · areas of work      → /guide/work/[area]
/guide/majors             2 · what you'd study   → /guide/majors/[major]
/guide/places             3 · countries in full  → /guide/places/[place]
/guide/cities             4 · the cities in them → /guide/cities/[hub]
/guide/from-home          5 · routes that need no move
/guide/compare?a=&b=      two countries on the same axes
```

- **The order is a zoom IN, and it shipped backwards once.** Cities came before
  countries, so the guide asked a student to weigh Berlin and then zoomed out to
  Germany a step later. A country contains cities; it comes first.
- **The MAJOR sits between the work and the country, and that placement is the
  argument.** You apply *with* a subject, so choosing a country before you have
  one is the cities-before-countries mistake a layer up. `lib/data/majors.ts`
  holds 44 of them and is held to the same rules as every other prose registry
  — `catch` and `notForYou` mandatory, no prices, rankings, superlatives or
  URLs — plus three fields that exist because nobody else writes them down:
  **`alsoCalled`** (one subject is taught under three names across the countries
  we profile, and a student who does not know that cannot tell they found the
  same door twice), **`firstYear`** (what the year is really made of and what
  makes people leave in it), and **`schoolSubjects`** (the only thing on the
  page that can be started today).
  **The chain is asserted in BOTH directions**: every major leads to at least
  one real area of work, and every one of the 33 areas is reachable from at
  least one major. The reverse edge is the one that protects a student — a kind
  of work nothing leads to is a page whose reader has nowhere to go next, and
  the person most likely to hit it is the one with the least common interest.
- **A major needed no migration.** `planner_path` has no `kind` column — a
  pick's kind is its `ref` prefix — so `major:computer-science` was storable the
  day the registry existed. `PickKind` gained a case, `pickHref` gained a line,
  and the existing test that `pickHref` can only produce `/guide/…` covered it
  for free.
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

- **The five steps are JOINED, and the join is a function**
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
  country we merely NAME is plain text, not a link.
  **A stop's identity is its destination ID, never its printed name.** The walk
  used to match a stop on `s.country === hub.country` while storing
  `destination?.name ?? hub.country` — and the hubs say `UAE` where the profile
  says `United Arab Emirates`, so the stop could never match itself: Dubai and
  Abu Dhabi each opened their own, and the chain listed the same country twice
  with one city in each. `Hong Kong SAR` vs `Hong Kong` was one hub away from
  the same bug. React reported it as duplicate keys; a student saw a duplicated
  country. Compare ids, not prose — a test now walks every field's chain. It is **server-only in
  practice** (five prose registries, ~4,000 lines) and a test fails any client
  component that imports it. The round trip is asserted: a city on a field's
  chain must lead back to that field's areas.
- **An area of work says how to TRY it, and we never build the try ourselves**
  ([lib/data/try-it.ts](lib/data/try-it.ts) → `TryTheWork`, inside "Test it this
  month"). A student weighing investment banking meets the bank's own simulation
  on that page rather than in a catalog of 172 rows — the best-evidenced item on
  the backlog, and free. Three rules, test-enforced:
  **no URLs in the file** (the catalog owns links because `test:links` keeps
  them alive, and the individual company pages sit behind bot protection the
  gate demonstrably cannot pass — so they are NAMED here and LINKED through the
  one catalog row that passes); **we describe the task and the employer, never
  the product title**, because a company is renamed far less often than its
  course listing and the employer is also the search term; and **an area with
  nothing honest to offer renders nothing** — there is no employer simulation
  for treating patients, and a near-miss would cost a reader an evening and
  teach them the wrong thing about a career. Re-verify yearly, same class of
  claim as `englishTaught`.
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

## The companion — the thread, on every screen (read [the spec](docs/superpowers/specs/2026-08-15-guided-thread-design.md) first)

The diagnosis it answers: **we built an excellent library and called it
accompaniment.** A library answers a question that is already formed, and our
student cannot form the question — that is the reason they came. The complaint
was never about the entrance ("I get more confused the more I use the site"), so
a guided route that hands a student to a section and stops is not a fix: it
leaves them alone in the library one step later.

It is mounted once, in [StudentShell](components/student/StudentShell.tsx), and
appears on Opportunities, the whole guide and the plan. It is the compass
needle — not a new thing to learn, the product finally doing what its name says.

- **Its stage is DERIVED, never stored** ([lib/data/thread.ts](lib/data/thread.ts)).
  Seven stations, each reached by a fact that already exists: reactions in
  `beat_reactions`, picks in `planner_path`, commitments in
  `opportunity_intents`. **"Opened the page" is deliberately not a condition** —
  per-student page reads are not recorded (`page_views` is the anonymous traffic
  table and stays that way), and recording them to drive a step counter would be
  a tracking system built for a progress bar.
  Two rules, both tested: the stage is **where they ARE, not the furthest thing
  they have touched** (someone who commits before answering a pair is still at
  the beginning, and taking the maximum would tell a lost student they were
  nearly finished); and **nothing moves it backwards** — an overdue deadline is
  the move ladder's business, and a figure that fell because something lapsed
  would read as punishment.
- **It stops talking when it cannot judge honestly.** From the moment a student
  has committed to something, the next move depends on agenda facts
  `lib/companion/load.ts` does not carry. Handing the ladder zeroes there did
  not produce vaguer copy, it produced a FALSE claim ("nothing you're carrying
  has an announced date yet"). So `move` is `NextMove | "deferred" | null`:
  an object to render, `"deferred"` to hand over to the plan, and `null` where
  **the page owns the move** — the planner renders its own `NextMoveCard`, and
  two ladders reasoning from different inputs on one screen is how a section
  contradicts itself.
- **One ask at a time.** While a reaction pair is on screen the move is not
  rendered at all. It shipped with both, three centimetres apart, pointing
  different ways — the product's own "exactly one move" rule broken by the
  companion against itself.
- **`xl:self-start` is load-bearing.** A grid item stretches to its row, so the
  aside stood 4054px tall and a sticky box spanning the whole scroll range has
  nothing to stick to: it pinned never and left at the first flick. The panel
  is also capped at `calc(100dvh-6rem)` — a sticky element taller than the
  viewport has a bottom that cannot be reached, because scrolling moves the page
  and not the pinned box.
- **Below `xl` it is a 44px dock, and the shell reserves its height**
  (`h-16 xl:hidden`). Without that spacer the fixed dock sits on the last
  control on the page, which on a phone is the one the student was reaching for.
  `xl` and not `lg`, because a guide subject page already carries its own rail
  from `lg` and nesting two left 256px of prose at 1024px.
- **Nothing heavy may reach it.** It renders on every route, so a runtime import
  of `key-dates`, `careers`, `world`, `study-destinations`, `spine` or `majors`
  ships that registry everywhere. Everything is resolved in
  [lib/companion/load.ts](lib/companion/load.ts) and handed down as values and
  pre-rendered nodes. A unit test fails the build on a violation — **and a
  second test proves that guard actually matches a real import**, because the
  first version was written as a template literal, where `\s` is the letter s:
  it compiled to `imports+(?!type\b)[^;]*froms+…`, matched nothing, and was
  cited as a guarantee in a PR description.

### The reaction engine ([lib/data/beats.ts](lib/data/beats.ts), migration 0031)

How the product learns who someone is without asking the question they arrived
unable to answer. Two concrete working days, and which is more like you.

- **Observations, never types.** Never "you are an Investigator" — only "you
  picked the one where the result lands the same evening, twice". A personality
  label is a claim we cannot support, and this product does not assert what it
  does not know.
- **A beat opens with the ACTION, in the second person, in ≤24 words.** The
  first version obeyed "no jargon, no profession named" and overshot into
  riddles: median 29 words, with the verb arriving at word 25. Concrete and
  PLAIN, not concrete and literary. Both rules are test-enforced, and the length
  band is tight on purpose — the old one (60–260 characters) never bit once.
  **Neither did the word count, until 2026-08-19**: it split on `/s+/`, the
  letter s, so it read a maximum of 9 words where the real maximum is 23 and
  would have passed a sixty-word beat. Third guard here to lose its backslashes.
- **A beat is TWO SENTENCES: the situation, then what you do about it** — and
  that rule exists because the three above all passed on copy a reader called
  "unclear and philosophical". Measured over all 24: **23 were one sentence
  averaging 19.2 words**, carrying the situation in a subordinate clause, so
  nothing resolved until the last word. Add 1.25 undefined definite articles per
  beat ("the piece", "the room", "the thing you built") and the reader is asked
  to supply context nobody gave them. The other guards measure length, first
  word and banned nouns; **a riddle satisfies all three**, which is the lesson
  worth keeping. The proof that plain was always possible sat in the same file:
  `plainer` said it in ordinary words, hidden behind a button most readers never
  press. Words per sentence are 10.5 now, and the guard ships with a bite test
  built from the exact beat that shipped.
- **"I don't get it" is a first-class answer.** It swaps that card for
  `plainer` in place, records `unclear`, contributes **no signal**, and **keeps
  the pair open** so the student can still answer once they understand.
  `nextPair` and `pairsAnswered` must agree about that; they did not at first,
  and the pair was silently thrown away.
- **The observation speaks on the pair that earned it, then goes quiet**
  (`SPEAKS_AT`). It is only offered at the first two stations, so `pairsAnswered`
  freezes the moment we stop asking — without the gate the same paragraph
  followed a reader across all 88 guide pages.
- **`beat_reactions` is the ONLY new stored fact.** Everything else — the stage,
  the observation, the move — is computed. Reaction ids are referenced by
  production rows: **never rename a beat id.**

## The planner — ONE route, three lenses (read [docs/PLANNER_PLAN.md](docs/PLANNER_PLAN.md) first)

The student's third section, and it is a single route: **`/planner?view=next |
board | map`**. Private — `robots.ts` blocks it, the sitemap does not list it,
the page calls `requireSession` **carrying the lens**, so a link to the board
survives signing in.

- **`/planner/board` and `/planner/maps` are 308s from
  [next.config.mjs](next.config.mjs), not routes.** They were three pages behind
  a control shaped like a tab strip, which meant "switching view" ran the server
  again and threw away the period you had stepped to. One route means one loader
  and three lenses that cannot disagree.
  [PlannerWindow](components/planner/PlannerWindow.tsx) holds the lens AND the
  period, and writes the URL with **`replaceState`, never `pushState`** — Back
  from a plan should leave the plan, not walk backwards through which lens you
  were looking through. The redirects are **enumerated**: `/planner/maps/<id>`
  is still a real page, because one map is a document a student can send to
  someone, and a pattern would swallow it.
- **`/planner` is the only place the section's guidance lives, and it is exactly
  one sentence.** [nextMove](lib/data/next-move.ts) is pure, ordered, and
  returns ONE move with a mandatory `why`. Three rules, all test-enforced: one
  move (a list of suggestions is the student's confusion handed back with our
  name on it); every move says why (an instruction is not a reason, and the
  missing reason is the whole of "there is no accompaniment"); and it never
  invents a number — where we have nothing honest to say the copy is phrased
  without one. The ladder runs *what has already gone wrong → the question they
  are furthest from answering → what is closest to happening*, and only a closed
  or near date may use the warning tone.
- **The guide→plan join is a table, and it is what the section is built on**
  (`planner_path`, migration **0030**). A student can put a kind of work, a
  country, a city or a route from home onto their plan from the guide page they
  read it on ([AddToPlan](components/guide/AddToPlan.tsx), one quiet control in
  the `DetailShell` rail — a loud one would turn every country profile into a
  page about the plan). The plan then shows them back, grouped **by the guide's
  own step numbers**, each chip opening where it was read
  ([YourPicks](components/planner/YourPicks.tsx)).
  - **No `kind` column.** A pick's kind is the prefix of its `ref`
    (`place:germany`) — same argument as `mapNodeKind`, same argument as the
    spine: a stored type is a second copy that eventually disagrees.
  - **The server action computes the `href` and ignores the caller's.** A server
    action is a public HTTP endpoint; a client-supplied path would let anyone
    store `/admin` under the label "Germany". `pickHref` can only produce
    `/guide/…`, and a test asserts it.
  - [lib/data/plan-picks.ts](lib/data/plan-picks.ts) is **type-only imports**,
    tested — it travels into two client bundles and must not drag 4,000 lines of
    prose with it.
  - **Empty groups are not rendered.** Four headings with nothing under them
    would be a path with the paint changed, and the owner's call was that the
    section gets no path: what is missing is said once, by the move at the top.

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
- **A move lands in the client first, and only then may it be animated.** The
  board holds the presses the student has just made and lays them over the
  server's columns, so an arrow moves a card immediately instead of after a
  server action, a revalidate and a re-render. That is also the ONLY safe way to
  use a view transition here: §5.1 of the backlog is that a
  `startViewTransition` whose promise waits on a round trip freezes the document
  (measured 2130ms), so the callback must be synchronous — hence `flushSync`,
  and hence the server action outside it. Reduced motion **skips** the
  transition rather than shortening it, because a zero-duration transition still
  freezes. `plannerMorph` names the card, and its escape is **injective**: the
  first version swept every illegal character to `-`, which mapped `a:b` and
  `a-b` onto one name — and two elements claiming one name is not a broken
  animation, it is silently no animation.
- **`lib/planner/load.ts` is the ONLY place the planner touches `key-dates` or
  `roadmap`**, it is server-only, and it reaches both through dynamic `import()`.
  `lib/data/planner.ts` takes `PlannerCompetition` — a structural subset of
  `Competition` — so the pure core never imports the catalog at all. Same bundle
  rule as `guide-filter.ts`; `/planner` is 105 kB against an 87.8 kB baseline
  **while carrying all three lenses**, because the two heaviest pieces — the
  next-move card (it uses the shared button system, whose class merging costs
  ~9 kB in a client bundle) and the maps lens (it reaches the map registry) —
  are server-rendered and handed to the window as nodes.
- **No client component in the planner calls `new Date()`.** `todayISO` is
  resolved once in the loader and passed down. That is what makes the three
  lenses agree with each other, survive hydration, and stay unit-testable.
- **Two motions in the whole section, and both carry information**
  (`.lens-in`, `.period-in-forward`/`.period-in-back` in
  [app/globals.css](app/globals.css)). The lens panel replays its entrance on a
  `key` so it says "this region changed and the rest did not"; the agenda's
  period enters **from the side the student travelled**, because direction is
  the one thing an arrow control means and a symmetric fade throws it away.
  Transform and opacity only. **The next-move card has no entrance at all** — a
  fade-up holds its content at `opacity: 0` until the animation finishes, and
  that card is the section's entire guidance.
- **A derived card cannot be deleted, only dropped** — deleting it would delete
  the record of a commitment. Own tasks delete.
- The views are a registry ([lib/data/planner-sections.ts](lib/data/planner-sections.ts)),
  same as the guide's steps. Adding mind maps was one entry, as intended.

### Mind maps (`?view=map` and `/planner/maps/<id>`, migration 0029)

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
- **The bar states its SUBJECT, and that is the fix for "the controls are
  terrible".** It was ten words in a row — Add inside · Add after · Rename ·
  Indent · Outdent · Up · Down · Send to plan · Delete — with nothing on screen
  saying which branch any of them acted on, and half of them named after the
  data structure rather than after the decision. A verb with an invisible object
  cannot be understood. So: "Working on — *Germany*, Country" sits above the
  verbs; the two adds became one control with the choice inside its own form,
  where "inside it" and "beside it" can be sentences; and the four structural
  moves became one labelled group of **arrows** whose accessible name is the
  operation explained ("Move it out one level"), because direction is drawn
  better than it is named. Ten controls, five groups, and every one is 44px.
- **A first map is not blank** (`createMapFromPlan` → `SeedMapFromPlan`). A
  blank canvas asks a student to invent the axes of their own decision before
  they have any, which is the real reason the controls read as incomprehensible.
  Seeded from `planner_path`: the countries they picked as branches, with the
  cities they picked **nested inside the right country** — containment we know,
  never guessed, so a city whose country cannot be resolved stays out rather
  than hanging under the wrong one.
- **`PlacedNode` carries `linkHref` and takes no part in the geometry**, so the
  picture can mark WHAT a branch is. A typed node gets a dot and names its kind
  in the tooltip; an untyped thought gets neither, because marking every box
  would stop the marks meaning anything — the same rule the outline's badges
  follow, off the same derived kind.
- **The diagram is `role="img"`; the outline is the content.** Two
  representations of one tree, and only one of them is authoritative or
  focusable. Two focusable copies is a worse experience, not a more accessible
  one.
- **"Send to plan" writes a `planner_items` row and keeps the node.** Deleting
  the thinking at the moment you act on it is backwards, and a test asserts the
  promote path contains no delete.

## Being findable is a feature (`sitemap.ts`, `robots.ts`, canonicals)

The guide is public on purpose — a family choosing between Germany and Korea
should read it without an account — and for a while nothing told a crawler that
any of it existed. Four things now do, and each has a rule:

The sitemap is **317 URLs** as of 2026-08-24 — 138 guide pages, 172 opportunity
pages, and the public marketing and partner routes, `/about` among them. **Do
not write that number down anywhere it has to be maintained**; it is stated here
only to give a sense of scale, and it is derived at build time from the
registries. Every one of them was fetched on 2026-08-24 and all 317 resolved.

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
- **The link-preview card is a FILE convention, and it runs on the EDGE — the
  only two edge functions in this repo.** [app/opengraph-image.tsx](app/opengraph-image.tsx)
  is the site default and [app/opportunities/[id]/opengraph-image.tsx](app/opportunities/%5Bid%5D/opengraph-image.tsx)
  carries the four facts, resolved through the same `resolveCompetitions` the
  page uses so the preview and the page cannot disagree. A file convention
  overrides `openGraph.images`, which is why `pageMeta` sets the card SHAPE
  (`twitter.card`) and no image path.
  Three things here are load-bearing and each cost a failed build or a failed
  deploy. **Edge is not a preference:** `@vercel/og`'s node build does
  `path.join` on a `file://` URL at module load, which survives on POSIX by
  accident and throws `ERR_INVALID_URL` on Windows — passing your own `fonts`
  does not help, the read is unconditional and runs first. **A Vercel Edge
  Function is capped at 1 MB compressed**, and nothing local enforces it: the
  first attempt measured 1.06 MB gzip while `next build` passed on Windows and
  CI passed on Linux, and only the deploy went red. Gzip the non-`.map` files in
  `.next/server/edge-chunks` before enlarging these routes. **And the fonts are
  subset** ([lib/data/og-glyphs.ts](lib/data/og-glyphs.ts),
  regenerated by `scripts/subset-og-fonts.mjs`), so a character outside the set
  renders as a blank box rather than throwing — a unit test fails the build when
  the catalog grows one, and it is how the Cyrillic in "Турнир городов" was
  caught.
  **KNOWN DIVERGENCE, 2026-08-22: those cards are still set in Inter while the
  site moved to Source Serif / Source Sans.** The subset TTFs are committed at
  `lib/og-fonts/` and are not what `next/font` serves, so changing the site's
  faces does not reach them — a shared link therefore unfurls in a face the page
  it opens does not use. Closing it means committing subset Source Sans TTFs and
  re-running `scripts/subset-og-fonts.mjs`, and it must be re-measured against
  the 1 MB edge cap above, which has already been hit once. Left open
  deliberately rather than half-done.
- **An unknown id must be a real 404.** See the loading-boundary note in the
  guide section above: this was a 200 for months and it is the one status a
  crawler must not see for an address that doesn't exist.
- **Structured data is built by [lib/schema.ts](lib/schema.ts) and written into
  the page by exactly one component** ([components/seo/JsonLd.tsx](components/seo/JsonLd.tsx)).
  `Organization` + `WebSite` on the home page only, `FAQPage` on the landing
  read from the FAQ component's own array, `BreadcrumbList` on the four guide
  subject kinds via `DetailShell` and on every opportunity page. Four rules:
  **`serializeJsonLd` escapes rather than trusts** — a script body is raw text
  until `</script`, and a partner writes their own organisation name and post
  titles, both of which reach a breadcrumb, so this is the `.ics` injection in a
  different costume and is tested with a hostile name; **`breadcrumbSchema`
  strips the query string**, because `crumbHref` routinely carries `?f=` and a
  trail naming a filtered URL contradicts the canonical on its own page;
  `DetailShell` therefore takes a required `path`; and **two types are
  deliberately absent** — no `SearchAction` (the opportunity search is client
  state, so nothing answers `?q=`) and no `Course`/`EducationEvent` (`Event`
  needs a `startDate` and the catalog stores an entry *deadline*, so every row
  would claim a contest begins on the day entry closes). Adding either means
  adding the fields to the catalog first, not adding a builder.
- **A title is a budget, and boilerplate never pushes the subject out of it.**
  `fitTitle` / `fitDescription` in [lib/seo.ts](lib/seo.ts), with
  `fitDescription` applied inside `pageMeta` so all 17 call sites get it without
  remembering. Measured before: 250 of 317 titles ran past 60 characters and 205
  of 317 descriptions past 160, because a fixed explanatory tail was prepended
  to every page — `who can enter, what it costs, when it closes | Compass` is 56
  characters before the name is even considered, so a long opportunity produced
  a 128-character title. `fitTitle` drops the qualifier, then the brand, and
  **never truncates the subject**: a name cut mid-word reads worse in a result
  than a long one, and its opening is what someone searched for. The
  80-character floor in `fitDescription` is measured, not picked — see the note
  in the file. **The home page does not go through `pageMeta`** (the root layout
  sets metadata directly), which is exactly why it was the one page left over;
  a test now pins its length in both directions.
- **Response headers live in [next.config.mjs](next.config.mjs) `headers()`.**
  There were none at all, which is not the neutral state it sounds like: without
  a framing header any site can put the sign-in page in an invisible iframe.
  `nosniff`, `SAMEORIGIN` (not `DENY` — that also breaks Vercel's preview
  overlay), a referrer policy that keeps `?ref=` and `?next=` off other origins,
  and a permissions policy for four APIs nothing here uses. **A CSP is
  deliberately absent** until it can be done with nonces; a permissive one
  shipped to look protected is worse than none.
- **`npm run test:links` fails on two things, and `FAILS_THE_GATE` names them:
  `broken` (a 4xx that is not a bot wall) and `private` (a 401)** — both are the
  far end saying the link we ship does not work for the person we ship it to. A
  5xx, timeout, reset or DNS failure becomes `unreachable`, and 403/406/409/429
  become `blocked`; both are printed in full and fail nothing, because from a
  datacenter IP they mostly mean the host refused *this caller*. **401 was in
  the bot-wall set until 2026-08-24 and splitting it out was the point:** the
  NAO Cup row was a Google Forms `/edit` address carrying an owner-only response
  token, 401 to every student, and the run reported "170/173 healthy · 0 broken"
  with it in. "You are a robot" and "this needs credentials you do not have" are
  different sentences. `classifyStatus` is exported and unit-tested across every
  band so the rule is asserted rather than described. Note the **guide's**
  checker keeps its own set — `scripts/test-guide-links.ts` also treats **412**
  as a bot wall, because government portals answer it. **Before deleting a
  catalog URL, reproduce from an ordinary connection** — three links it called
  dead answer 200 from one, and `globe.gov` really was down for days and came
  back on its own.

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
(`max-w-[54ch]`) regardless of how wide the shell is.

Two things learned by measuring, worth not rediscovering:

- **`ch` is the width of a zero, not of an average letter**, and the multiplier
  **belongs to the typeface, not to the codebase** — which is the part that was
  learned the expensive way. Under Inter the real count ran about **1.3×** the
  number you write, so `54ch` measured 68–72 characters and `60ch` measured
  **79–80**, outside the band; that is why the cap is 54 and not 60. Under
  **Source Sans 3 the same ratio is 1.14×**, measured 2026-08-22 over 54 full
  lines on `/guide/places/germany`: `54ch` now renders **61.5** characters
  (range 52–69). Still inside the 60–75 band, so the cap did not move — but the
  same number bought nine fewer characters the day the font changed. **Re-measure
  this ratio whenever the body face changes; never carry it across one.** Set it
  by measuring, not by reading the number as characters.
  **Measure the way a reader reads: exclude the ragged last line.** The
  earlier note here claimed `60ch` landed at ~72 and the cap stood at 60 for
  several releases on the strength of it. Averaging the final part-line in
  drags the mean down by roughly a whole tier and makes an over-wide column
  look compliant. Count characters per *full* line — walk the text node with a
  `Range` and group by `getBoundingClientRect().top`, which is font-independent
  and cannot be fooled the way a canvas `measureText` can.
- **Density has to be applied at the level that actually repeats.** Making the
  city cards 4-up cut the page by 2%, because the list is grouped by country and
  15 of the 19 groups hold a single city. Flowing the *groups* into columns cut
  it from 4487px to 2047px. Look at what repeats before adding `grid-cols`.
- **A component that renders in two shells needs a CONTAINER query, not a
  breakpoint.** The opportunity list lives in the student's section AND in the
  report's panel, and at the same 1024px viewport it is **924px wide in one and
  652px in the other** — so `lg:grid-cols-2` measured 457px cards in one and
  321px in the other. It is `.opp-list`/`.opp-grid` in
  [globals.css](app/globals.css): two columns once the list itself clears
  800px. State the rule in terms of the thing that actually constrains it.
- **Find the card's cliff before choosing a column count.** Forced through
  exact widths in 20px steps, the opportunity card is flat at 272px tall from
  380px up, jumps to 356px at 340–360 as the title takes a third line, and hits
  421px at 320. A knee like that decides the grid: two columns everywhere, and
  never three, because a third is 320px even at 1536. Don't copy the guide's
  `sm:2 → xl:3 → 2xl:4` onto a denser card — `sm` measured 262px there.
- **The companion is the spare gutter, so a second rail comes out of the
  CONTENT.** A filter rail was specced beside the list and deliberately not
  built: from `xl` the companion takes 20rem, so the student shell's content
  column *drops* from 966px at 1024 to 854px at 1280, and a 256px rail on top
  of that leaves 282px cards at the commonest desktop width. Before adding a
  rail anywhere in the student's section, check what already owns the margin.

`DetailShell`'s `aside` is the same idea at page level: below `lg` the onward
links follow the content as before, from `lg` they become a sticky rail in the
column that was empty anyway. It is pinned at `top-20` because StudentNav is
sticky and ~57px tall.
- Step 4 obeys the world-map rule: every route in [lib/data/from-home.ts](lib/data/from-home.ts) carries its catch and a first move, test-enforced. **No URLs in that file** — the catalog owns links, because `test:links` checks those.

## The landing page: the front door has to be on the front page

[app/(marketing)/page.tsx](app/%28marketing%29/page.tsx) was built end-to-end for
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
    Fixing the hero paragraph left **19 others** on it, including six of this
    page's own body paragraphs at `font-light`; they moved to `ink-soft` on
    2026-08-19 and the landing's faintest text went 4.53 → 4.95:1. Only hover
    states keep an alpha, because an interaction colour is not resting text.
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
- **The phone-only call to action** ([StickyCTA](components/marketing/StickyCTA.tsx))
  covers the stretch of page that has none: it appears once the hero's buttons
  have scrolled away and is gone again from the closing call downwards, so the
  product's "one primary call per view" rule still holds. **The decision is a
  pure function** in [lib/data/sticky-cta.ts](lib/data/sticky-cta.ts) and is
  unit-tested, because an `IntersectionObserver` does not fire at all in a
  throttled or backgrounded pane — a rule written inside the effect would be a
  rule nothing could check. The button is server-rendered and handed down as a
  node, keeping `cn`'s ~9 kB out of a bundle this page worked hard to shrink.

## `/about` — the page that names the people

[app/about/page.tsx](app/about/page.tsx). A product that advises sixteen-year-olds
on where to apply had no page naming a human being, and its only contact was an
address at the bottom of the terms. Compass is built by **Alibek Ussipbayev and
Kirill Kim**, final-year students at NIS Physics and Mathematics in Shymkent, and
the section that says so is in their own words — the questions in it are the ones
they listed, in the order they listed them. **Nothing in that section may be
inferred or filled in; if a detail is added it comes from them.**

- **Every figure is read from the registries at render**, like the landing page,
  so the page cannot quote a number the reader will not then see. One of them was
  rewritten after seeing it render: "12 of 172 entries clear that bar" about
  confirmed dates reads as a 7% verification rate, when most of the remainder
  never had a date to verify. It states the true and more useful fact instead —
  57 of 172 are open whenever you are ready.
- **The eleven parts are ONE array read twice**, by the contents nav and by the
  sections, same rule as a guide subject page: a part cannot exist in the map and
  be missing from the page.
- **Groups are expressed by PROXIMITY, not by labels or cards.** A group opens
  with 112px and a rule; a section inside one follows at 40px with none. All
  eleven used to take the identical 48/40, which is proximity switched off. No
  group headings, because a label above a heading is a kicker; no cards, because
  same-size boxes would restore the uniformity this removed.
- **"Who makes this" is second, not tenth.** It sat 4,800px down a 5,988px page,
  which is the question most people open an About page to answer.
- Prose is `text-base` and `text-ink` — the strongest ink token, not the softer
  one the guide uses for secondary copy, because "dim" was the complaint this
  page answers. Measured on the built page: 99.5% of visible characters at 17px
  or larger, body prose at 17.14 contrast, 62 real characters per full line.
- **It is reached from the landing's "Honest by design" band**, 3,366px earlier
  than the footer. That band is where the question forms: the site has just said
  it is honest and nothing on the page says who is making the claim. The header
  was the other candidate and lost on measurement — it already carries three
  controls beside the logo at 375px.

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
  (`bg-accent-soft/25`, `border-ink/10`). Hex here breaks every one silently.
  Note which examples those are: an alpha on a **fill or a border** is fine, an
  alpha on **text** is a colour nobody has checked — see the `text-ink/60` rule
  in the landing section.
- **`opacity-NN` on a control is the same rule arriving from a direction no
  class-name scan can see, and it had shipped in three places.** Every colour in
  the filter chips was a checked token; an `opacity-50` laid over the button to
  mean "no results here" took the label from **8.78:1 to 3.27:1** and the count
  from **5.48 to 2.41**, measured on the built page at 13px. The existing guards
  look for `text-ink/60`-style names in a class string, and an element opacity is
  not one — it composites afterwards, onto colours that individually pass.
  Everywhere else in this codebase a dimmed control carries **`disabled:`** on
  the opacity, so it only applies where WCAG 1.4.3 exempts it; those three chips
  used the look without the semantic and stayed clickable. **Express "nothing
  here" as a BRANCH of the colour** (`border-line/60 … text-ink-faint`), never as
  an alpha over it — and never as an appended class either, because two utilities
  of the same type at the same specificity are resolved by whichever Tailwind
  emitted last. A test now fails any `<button>` carrying a bare `opacity-` with
  no `disabled` in the same tag. **Audit contrast at the rendered node, not from
  the class names**: verified tokens do not compose into a verified pixel.
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

**The faces are `Source_Serif_4` (display) and `Source_Sans_3` (body)**, wired
once in [app/layout.tsx](app/layout.tsx) and reachable only as `font-display` /
`font-body`. They are one superfamily on purpose — same designer, shared
skeletons and vertical metrics — so headings and body agree at the joints. They
replaced **Space Grotesk + Inter** on 2026-08-22, which is a named tell of a
site assembled in an afternoon and was on every page.

Three things that swap taught, and they generalise to any future change of face:

- **Both subsets must include `cyrillic`.** The catalog holds "Tournament of
  Towns (Турнир городов)", an opportunity's name is the `<h1>` of its own page,
  and `h1..h4` are `font-display` globally. The old pair declared `latin` alone,
  so that heading had been silently falling back to a system face. Next emits one
  `@font-face` per subset behind a `unicode-range`, so pages without Cyrillic
  never fetch the file — there is no reason to leave it out.
- **The fallback must be the same CLASS of face.** `display` is a serif now, and
  `ui-sans-serif` under it meant every heading rendered as a grotesque and then
  changed shape when the webfont landed. `display: "swap"` guarantees that window
  exists.
- **Every measured typographic constant belongs to the old face and has to be
  re-solved.** Two were, both documented where they live: the hero clamp (the
  binding line moved from the rotating phrase to the fixed one — see the comment
  in the landing page) and the `ch` multiplier below. Assume any number in this
  section that came from a measurement is invalid until re-measured.

Colour was already tokenised per theme; type was not, and the gap was the whole
reason the dark theme read as harder work. **Contrast was never the problem** —
every text token on `/opportunities` measured 5.48:1 or better while the
complaint stood.

**That has now been true three times.** "The text is small, dark and dim" came
back on 2026-08-19; measured across three pages in both themes it was again
**zero WCAG failures** and nothing under 11px, and the real defect was that
14px was the body size. So: when someone says the text is hard to read, measure
the SIZE distribution as well as the ratios, and measure it as a share of the
page's characters rather than a count of elements — a page can be 93% 14px and
still show a tidy element histogram. Six rules, all test-enforced:

- **`--type-tracking-body` is a theme token** (`app/globals.css`): 0 in light,
  `0.008em` in dark. Light text on a dark ground **blooms** — glyphs spread into
  the background, counters close, and the space between letters is eaten. The
  value was solved for Inter, whose default fit is tight; the body face is
  **Source Sans 3** now, which is set more openly, so 0.008em is if anything
  generous and was left alone rather than re-solved by eye. Anyone with a dark
  screen in front of them should check it. It is applied
  on `body` so it **inherits**, and so the 73 `tracking-tight` headings and the
  38 tracked labels keep the value they chose. Nothing in the product sets
  tracking on body copy, which is what makes that insertion point clean. Bounded
  at 0.02em by a test: past that it stops being optical compensation and starts
  being letter-spacing a reader can see.
- **12px is the floor, everywhere** (was 11 until 2026-08-19). 69 labels sat at
  10px and four at 9px, across 21 files — the report's programme cards, four
  country breakdowns, the admin tables, the guide's badges, the landing's own
  hero preview. A floor that holds in some components is not a floor, so the
  test walks the whole tree.
  **That test had never fired.** It was written `/text-[(d+(?:.d+)?)px]/`: the
  backslashes were eaten, so `[…]` was a character CLASS, nothing was captured,
  and `NaN < 11` is false. Same failure as the bundle guard written as a
  template literal where `\s` became the letter s — both fail OPEN and both were
  quoted as guarantees. It now covers `rem` as well as `px`, and a second test
  asserts it BITES on `text-[10px]` and `text-[0.7rem]`. Never ship one of these
  without the test that proves it matches.
- **The scale is set in `tailwind.config.ts`, and its small end sits one step
  above Tailwind's stock**: xs 13, sm 15, base 17, lg 19. Measured before the
  change: 93.5% of a country profile's 9,000 characters were at 14px or below,
  81% at exactly 14px; `/opportunities` 52%, `/demo` 81%. Repo-wide there were
  411 `text-sm` and 339 `text-xs` against 100 `text-base`, so **14px was the
  body size and 12px the second voice** — and 118 labels were pinned at exactly
  the old floor, which is "not illegal" rather than "readable".
  One config edit moves everything **because every type test is written against
  Tailwind CLASS names, not pixel values**. Check that still holds before
  reaching for it again.
- **Long-form prose is `text-base`, and `max-w-[54ch]` is what marks it.** A
  measure cap only ever appears on a column of continuous reading; a card
  summary is `line-clamp`ed instead. So the cap decides which columns get the
  step, and a paired heading has to move with its body or the body outgrows its
  own label. Raising the size does **not** change the measure — `ch` scales with
  the font — and it was re-measured at 70.5 real characters per full line after.
- **A card needs a step, and size alone should not carry it.** The two cards
  that carry the product both measured flat: the opportunity card ran title 18 /
  body 15.2 (a step of **1.18**), and the guide card — the navigation for 88
  pages — ran title 14 / body 14, a step of exactly **1.00**. Both are 1.14–1.25
  in size *and* 200 in weight now. No contrast test could ever have caught
  either, which is the point: "everything is nearly the same size, nearly the
  same distance apart" is what a reader means by a wall of text.
  Those pixel figures are what was measured in 2026-08-14 and are one step
  smaller than what renders today; the **ratio** is the rule, and it survived
  the scale change because the test names classes rather than pixels.
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

## Speed: the constant, not the row count (read [docs/PERFORMANCE_2026-08-19.md](docs/PERFORMANCE_2026-08-19.md))

A whole-tree pass on 2026-08-19 measured every hot path. **Not one bottleneck
was an algorithm.** All of them were a formatter or a parser rebuilding an
answer that could not change — and they were invisible precisely because this
file already reasons hard about bundle size and about `O(n)` shape, so nobody
looked at constant factors. A 172-row catalog makes any loop look free, which is
exactly what hid a **90 µs** function.

- **Never call a `toLocale*` method with an options object in a loop or a
  render.** `toLocaleDateString(locale, options)` is specified as constructing
  an `Intl.DateTimeFormat` and discarding it, and it measured **90.76 µs a
  call** against 2.08 for a hoisted one. `formatDate` runs once per opportunity
  card: 3.47 ms for one screen, paid again on every re-render, so it was charged
  to every keystroke in the search box. Build the formatter once at module level
  (`DAY_MONTH_YEAR` in [opportunity-format.ts](lib/data/opportunity-format.ts),
  `MONTH_YEAR` in [roadmap.ts](lib/data/roadmap.ts)).
- **Six caches exist, and every one is keyed on an OBJECT, not on a string.**
  `gateFor` and the search haystack are WeakMaps over the row; `SPINES`,
  `DESTINATION_BY_HUB` and `UNIVERSITIES_BY_HUB` are Maps over closed
  vocabularies; `STAMPS` in [summarize.ts](lib/traffic/summarize.ts) is a
  WeakMap over the view. The rule behind that: **the second input to several of
  these caches is a database.** Keying `gateFor` on the eligibility sentence
  would grow a table nothing ever empties, one entry per distinct string any
  partner has ever posted.
- **A cache that returns the wrong row does not throw — it shows a student
  someone else's opportunity.** So each guard in
  [scripts/test-engine.ts](scripts/test-engine.ts) re-derives the answer the
  SLOW way, with the code that shipped before, and asserts the two agree over
  the real catalog. Never write one of these tests as "is it fast".
- **`parseEligibility` stays pure and uncached.** It is the tested contract, and
  `lib/discovery/screen.ts` calls it on strings that have no row behind them yet.
  `gateFor` is the cached wrapper, and it honours an explicit `gate` first.
- **Typing is deferred, never debounced.** `useDeferredValue` in
  `OpportunitiesView` and `FilterBar` keeps the input exact and immediate while
  the list and the facet counts render at low priority; a timer would arrive
  late even when there is time to do the work. **`activeFilterCount` reads the
  DEFERRED filters too** — it decides whether the shortlist or the browse list
  is on screen, so taking the live value flashes an empty list on the first
  character typed.
- **Before optimising anything here, benchmark the primitives over the real
  registries** — `Intl.*`, `Date.parse`, `new Date()`, `toISOString()`, regex
  parses. Reason about the constant. The §4 list in that doc says what was
  measured and deliberately left alone, so the next pass does not redo it.

## Two sibling functions, one defended and one not

The three defects that pass found were not performance at all, and two of them
share a shape worth naming: **a rule was enforced in one place and its neighbour
never got it.**

- **`subtreeHeight` recursed into cycles while `depthOf`, four lines above it,
  did not.** `buildTree` exists on the stated assumption that
  `planner_map_nodes` can hold a cycle, so the renderer survived what the server
  action did not — a `RangeError` from the indent button, and also from a merely
  long chain. It was fixed **by moving it**: `branchDepth`/`branchHeight` now
  live in [mindmap.ts](lib/data/mindmap.ts) beside `canIndent`/`canOutdent`,
  iterative rather than recursive. That is the root cause, not the symptom — the
  helper had drifted *because* it lived outside the module that owned the
  discipline, and a private function in a `"use server"` file can never be unit
  tested.
- **The `.ics` file escaped `DESCRIPTION` and wrote `URL:` raw.** And
  `z.string().trim().url()` **accepts a CR/LF inside a URL** — the WHATWG parser
  tolerates them — and stores it verbatim, so an approved partner could post a
  link that ends one VEVENT and begins another and write events into the
  calendar of every student who downloaded the file. Trust here is granted once
  per organisation and the safety net is removal, which does not reach a file
  already in someone's calendar. Fixed at **both** ends. Note `URL:` is a URI
  value, not TEXT: a backslash escapes nothing there, so the treatment is to
  REMOVE control characters, not to escape them. Writing the test found a second
  hole — `icsText` escaped newlines and let tabs through — so both value types
  now share one rule, and `buildIcs` is exported purely so the escaping can be
  asserted at all.
- **Write a control-character class as `\u0000`-style escapes, never as literal
  bytes.** A raw NUL or CR in a `.ts` file does not survive an editor or a patch,
  and a mangled character class fails OPEN: it strips the wrong things and still
  looks like a guard. This happened twice while making the fix above.

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
