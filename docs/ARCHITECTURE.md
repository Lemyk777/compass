# Architecture — where things are, and which file to open

A map for finding the one file a change belongs in. It answers "I want to
change X, where do I go?" rather than describing the code in general.

---

## The one thing to understand first

**The model writes prose. Code computes every number.**

The AI returns qualitative JSON only — factor notes, school reasons, a summary.
It does not compute the overall score, the benchmark table, or any country's
odds. `assembleAnalysis()` does that deterministically, in code, after the model
replies. Same profile in, same numbers out, run to run.

Everything below follows from that split. If a change affects a *number*, it is
almost never a prompt change.

---

## I want to change…

| …this | Open |
| --- | --- |
| What the model is told | `lib/ai/prompt.ts` |
| What the model is allowed to return | `lib/ai/schema.ts` |
| How scores and benchmarks are computed | `lib/ai/assemble.ts`, `lib/rubric.ts` |
| Odds for Italy / Hong Kong / UAE / Korea | `lib/ai/italy-analyze.ts`, `hk-analyze.ts`, `uae-analyze.ts`, `korea-analyze.ts` |
| The universities and programmes | `lib/data/*-universities.ts` |
| A competition/olympiad/course entry | `lib/data/competitions-data.ts` (the catalog array) |
| How opportunities are matched and ranked | `lib/data/key-dates.ts` (types + logic; re-exports the catalog) |
| Date/cost formatting used by client cards | `lib/data/opportunity-format.ts` — **import these from here, not key-dates** (see the bundle rule below) |
| Who may enter an opportunity | `lib/data/eligibility.ts` |
| The "what do you like?" quiz | `lib/data/interest-quiz.ts` (questions + weights + pure scoring) |
| Where a field can lead (career areas + the jobs in them) | `lib/data/careers.ts` — spheres, never one prescribed profession |
| **What a student actually applies with** (44 subjects) | `lib/data/majors.ts` — guide step 2, between the work and the country. `catch`/`notForYou` mandatory; `alsoCalled`, `firstYear` and `schoolSubjects` are the three fields nobody else writes down |
| **Where the student is on the thread** (the "step 3 of 7") | `lib/data/thread.ts` — pure, seven stations, DERIVED from stored facts. Never store a stage |
| **What the companion asks** (two working days, "which is more like you") | `lib/data/beats.ts` — fixed weights, pure scoring. A beat opens with the ACTION in ≤24 words; never rename a beat id, production rows reference them |
| **What the companion renders** | `lib/companion/load.ts` (server, cached) → `components/companion/Companion.tsx` + `BeatPair.tsx`. Mounted once in `StudentShell` |
| Narrowing a list to what the student actually matches | `matchedOnly` in `lib/data/opportunity-filter.ts` — **mandatory on every surface without a filter panel**; see the rules section |
| "What do you want out of work?" | `lib/data/values.ts` (3 questions + pure scoring) — may only REORDER the areas, never filter or change the fields |
| Where in the world a sphere of work lives | `lib/data/world.ts` — hubs with a catch and a route in, both mandatory |
| A full destination profile (US, UK, HK, …) | `lib/data/study-destinations.ts` → `/guide/places/[place]`; trade-offs must outnumber strengths, `notForYou` is mandatory, no prices or rankings |
| What you can do without leaving home | `lib/data/from-home.ts` — every route carries its catch, a first move, what it costs in time and what it proves; no URLs (the catalog owns those) |
| Sphere names for anything running in the BROWSER | `lib/data/career-titles.ts` — never import `careers.ts` into a client component; it is ~1,100 lines of prose |
| One content container for the student's section | `components/ui/Shell.tsx` — 1024 → 1440; width buys columns, never line length |
| The guide's steps, and what the tabs read | `lib/data/guide-sections.ts` — one registry behind the tabs, the index cards and the "next step" footer |
| The guide's field filter | `lib/data/guide-fields.ts` (pure, `?f=`) + `lib/guide/student-fields.ts` (the profile default) — "not stated" and "explicitly everything" are different states |
| What a student claimed out of the guide | `lib/data/plan-picks.ts` (pure, type-only imports) + `planner_path` (0030). A pick's kind is the prefix of its ref (`place:germany`) — there is no `kind` column, and the server action computes the href so a caller cannot supply one |
| The plan's one sentence of guidance | `lib/data/next-move.ts` — pure and ordered, returns exactly ONE move, and the `why` is not optional |
| Trying a kind of work before choosing it | `lib/data/try-it.ts` → `components/guide/TryTheWork.tsx`. Names the employer and describes the task; **no URLs** (the catalog owns links, and these company pages are behind bot protection the gate cannot pass); an area with no honest answer renders nothing |
| The student's own shell (Opportunities + Guide) | `components/student/StudentShell.tsx`; the guide adds its own frame in `app/guide/layout.tsx`; the report keeps `components/dashboard/DashboardShell.tsx` |
| Loading a signed-in student's facts once | `lib/dashboard/load.ts` — feeds both shells |
| The dated roadmap | `lib/data/roadmap.ts` |
| Adding a whole new destination country | `lib/data/country-content.ts`, `deterministic-countries.ts`, `country-views.tsx` — one entry each, not edits across eight files |
| What a partner organisation may post | `app/partner/actions.ts` (the schema is the contract), `components/partners/OpportunityForm.tsx` |
| Whether a partner's posts are visible | `lib/partners/live.ts` — one filter, both student surfaces |
| Input caps (lengths, counts) | `lib/limits.ts` — enforced in three places, all of which read from it |
| Anything a logged-in student sees | `components/dashboard/views/` |
| The intake form | `components/onboarding/` |
| The public marketing site | `app/(marketing)/`, `components/marketing/` |
| Copy | The component. There is no translation layer — the site is English-only |

---

## Layout

### `app/` — routes, server actions, API

| | |
| --- | --- |
| `(marketing)/` | The public landing page, told in the product's own order: Opportunities → the guide → the report. Session-aware: a signed-in visitor gets "Dashboard", not "Log in"/"Sign up". Every count on it is read from the catalog and the guide registries at request time, so the page cannot claim a number the student won't see |
| `opportunities/` | **Public.** `page.tsx` renders the guest eligibility checker, and a signed-in student gets the full list in the same route rather than a second address. `[id]/page.tsx` is one opportunity at its own URL — server-rendered, public, in the sitemap, with Open Graph tags carrying the four facts a card carries. That route exists because a modal has no URL, so sharing a contest was impossible |
| `planner/` | **Private, and ONE route**: `page.tsx` serves `/planner?view=next\|board\|map` — the agenda (everything with a date), the board (everything with a state they own) and the mind maps are three lenses over one loader, not three pages. `/planner/board` and `/planner/maps` are enumerated 308s in `next.config.mjs`; `maps/[id]/` is still a real page, because one map is a document a student can send to someone. `lib/planner/load.ts` is the only place the planner touches the catalog or the roadmap, and it does so through dynamic `import()` |
| `guide/` | **Public**: the five-step guide (work → majors → places → cities → from-home), its own route per step and per subject. The list routes sit in `(index)`/`(list)` groups so their loading skeleton does not become a Suspense boundary over the subject pages — that made every unknown id answer 200 instead of 404 |
| `onboarding/` | The full intake wizard — now **opt-in** (the analysis path), no longer where signups land; `actions.ts` holds the Zod schema that is the single source of truth for a valid profile |
| `dashboard/` | The logged-in product. `layout.tsx` loads everything once and hands it to `DashboardContext`; each subroute is a thin view |
| `demo/` | The same dashboard over a sample analysis, no auth |
| `admin/` | Founder metrics, the opportunity-approval queue, and partner review |
| `ambassador/` | Referral dashboard |
| `partners/` | **Public**: the list of partner organisations, one page each, and the application form |
| `partner/` | **Private**: one organisation's console — post, edit, take down |
| `api/` | Route handlers, including `api/cron/*` (date sync, discovery) |
| `auth/` | Sign-in, callback, email confirmation |

Server actions live in `actions.ts` next to the route that uses them. Every
export in a `"use server"` file **must be an async function** — a non-function
export crashes the production build (not dev) with an opaque digest error.

### `components/` — grouped by surface, not by type

The student sections: `opportunities/`, `guide/`, `planner/`, `companion/`, and
`student/` (the shell the first three share). The report and its neighbours:
`dashboard/`, `report/`, `charts/`, `onboarding/`. The rest: `marketing/`,
`admin/`, `ambassador/`, `partners/`, `auth/`, `analytics/`, `legal/`, `ui/`.

`ui/` is the shared primitive layer (Button, Link, Logo, view transitions).
Everything else belongs to one surface and should not be imported across
surfaces — if two surfaces need it, it moves to `ui/`.

`companion/` is mounted **once**, in `student/StudentShell.tsx`, so it renders on
Opportunities, the whole guide and the plan. That is why nothing heavy may reach
it: a runtime import of a registry there ships that registry on every route. It
takes values and pre-rendered nodes from `lib/companion/load.ts`, and a unit test
fails the build on a violation.

### `lib/` — the logic

| | |
| --- | --- |
| `ai/` | The analysis pipeline. Read `prompt.ts`, `analyze.ts`, `schema.ts`, `assemble.ts` together — they only make sense as a set |
| `data/` | Deterministic datasets and the code over them: universities, programmes, deadlines, the opportunity registry, geography, the roadmap |
| `planner/` | `load.ts` — the planner's one loader. Server-only, and the boundary that keeps the catalog out of the section's client bundle; the pure core is `data/planner.ts`, which imports no dataset at all. `maps-load.ts` does the same for mind maps over `data/mindmap.ts`, which stores structure and computes the picture. `picks.ts` reads what the student claimed out of the guide (`planner_path`, 0030) — split out because the GUIDE needs it too, and a country page must not reach the planner's loader to answer one boolean |
| `guide/` | `student-fields.ts` (the reader, and their fields, read once per request) and `plan-state.ts` — the only thing the guide asks the planner: is this subject already on your plan, and which maps could it go on |
| `companion/` | `load.ts` — resolves the thread on the server and hands the client values and pre-rendered nodes. The one place allowed to touch the heavy registries on the companion path |
| `traffic/` | `track.ts` (`cleanPath` is the privacy boundary — path only, never the query string) and `summarize.ts` (every metric definition, pure and unit-tested) |
| `partners/` | `live.ts` — the single mapping from live rows to `Competition` for both student surfaces, and the filter that drops rows whose partner is not `active` |
| `cron/` | `auth.ts` — the gate in front of both cron endpoints. **Fails closed**: no `CRON_SECRET` means 503 |
| `dashboard/` | `load.ts` — the one loader feeding both the report shell and the student shell |
| `calendar/`, `seo.ts`, `site.ts`, `limits.ts`, `tiers.ts`, `utils.ts` | ICS export, canonical/metadata helpers, the canonical host, input caps, tier colours, and `cn` (clsx + tailwind-merge) |
| `auth/` | Session, roles, post-signup provisioning |
| `supabase/` | Three clients — `server.ts` (respects RLS, the default), `admin.ts` (service role, bypasses RLS, server-only), `client.ts` (browser) |
| `discovery/`, `scraper/` | Finding new opportunities and refreshing their dates |
| `i18n/` | A flat key→string map. English only |

### `supabase/migrations/`

Numbered SQL, **applied by hand in the Supabase SQL editor**. There is no
migration runner and no state table, so:

- after adding one, say so explicitly — it will not run itself;
- write it idempotently (`if not exists`, `drop policy if exists`);
- include column-level grants — table privileges are locked down, and a missing
  grant surfaces as a bare `42501` that looks nothing like a permissions bug;
- **add the expected columns to `scripts/check-schema.ts` in the same commit**,
  which is what lets `npm run db:check` answer "is the database actually what
  this code assumes?" in a couple of seconds — read-only, one probe per table.
  It reports **33/33 as of 2026-08-17**, everything through `beat_reactions`
  (0031) included.

**This drifts silently — check it, don't assume it.** On 2026-08-05 an audit of
the live database found `0010_graduation_year` had never been applied: every
student's school year silently failed to save (the app degrades rather than
crashing, so nothing surfaced), while every other migration through 0023 *was*
applied. If a feature "doesn't persist" and the code looks right, run
`npm run db:check` before debugging the code — that script exists because of
this incident, and it is the only note here that cannot go stale.

### `scripts/`

Verification, run directly with `node --import tsx`. Two pure suites, both in
the CI gate and neither needing a key, network or DB:

- `test-engine.ts` (`npm run test:unit`, node:test) — **268 tests** over the
  deterministic core: rubric/overall scoring, benchmarks, eligibility
  arithmetic, the interest quiz, the careers registry, matching invariants, the
  guide's chain, and the whole of the planner. **Add a case here when you touch
  scoring or eligibility** — and when you touch the planner, because that
  section sits behind a session and cannot be opened in a browser by an agent,
  so a pure test is the only verification available to it.
- `test-session-checks.ts` — 61 checks over geography, eligibility gates,
  registry integrity, the commitment vocabulary and cron rotation maths.
- `check-schema.ts` (`npm run db:check`) — read-only, needs `.env.local`.
  **Add a migration's expected columns here in the same commit as the
  migration**; that is what lets defensive scaffolding be deleted instead of
  accumulating, because the schema becomes checkable.

`test-links.ts` checks every catalog URL (weekly job, deliberately outside the
gate — datacenter IPs get bot-walled differently than a student's browser).

### Elsewhere

`data-pipeline/`, `reasoning-traces/`, `agents/` are research and calibration
work that does not ship in the app.

---

## Rules that are not obvious from the code

- **Prompt caching**: the static system prompt must stay byte-identical across
  requests. Per-user data goes in the user message, never the system block, and
  dataset ordering must stay stable.
- **Keep the catalog out of client bundles, and the test is REACHABILITY, not
  adjacency.** `key-dates.ts` builds a lookup map over the whole ~2,700-entry
  catalog at module load, so it cannot be tree-shaken and *any* runtime import
  pulls the dataset into that route's JS. Client components import
  `formatDate`/`opportunityCost`/`daysBetween` from `opportunity-format.ts`, and
  the surfaces needing catalog-derived data — `OpportunitiesView`,
  `EligibilityChecker`, `FirstWin` and `RoadmapView` — dynamic-import it.
  Type-only imports are free.

  **The guard used to check for a DIRECT import edge, and two chains slipped
  through one hop of indirection**, costing eight routes 27–41 kB each:
  `RoadmapView → roadmap.ts → key-dates`, and `LikelihoodGauge →
  app-deadlines.ts → key-dates`, the second for a two-line date helper. It walks
  the module graph now, stopping at `"use server"` files, because a server action
  is an RPC stub and not a dependency. **Size alone is not the test:**
  `world.ts` is 822 lines and shakes clean, because it is plain consts. Do not
  reason about this from line counts — grep the built chunk in
  `.next/static/chunks`, or read the guard.
- **Matching annotates; it does not hide — so `matchedOnly` is mandatory on any
  surface with no filter panel.** `buildExtracurriculars` returns the whole
  catalog carrying `offField`/`offRegion`, and the filter panel does the
  narrowing. Three surfaces have no panel — the guest `EligibilityChecker`,
  onboarding's `FirstWin`, and `lib/planner/load.ts` — and without
  `matchedOnly` each silently shows a student other people's opportunities. The
  leak is invisible: nothing looks broken, there are just more rows. A unit test
  pins all three files by name.
- **A hand-built regex needs a second test proving it BITES.** The companion's
  bundle guard was written as a template literal, where `\s` is the letter s and
  `\b` is a backspace — it compiled to `imports+(?!type\b)[^;]*froms+…`, matched
  nothing, and passed against a clean codebase exactly as it would have passed
  against the bug it existed to catch. Assemble patterns from RegExp literals
  via `.source` so the parser owns the escaping.
- **Some faults are only visible by opening the page.** Three review passes on
  the companion found six real bugs by reading code and none of the three that
  mattered most: it was never sticky (a grid item stretches to its row, so a
  4054px "sticky" box has nothing to stick to), its bottom sat below the fold
  and could not be scrolled to, and it asked two things at once. When a surface
  is session-gated, a temporary local fixture in its loader is the honest way to
  look — patch, measure in the browser, revert before committing.
- **Only two questions are ever mandatory** (school year, field), both answered
  inline on Opportunities. Everything else — the quiz, careers, the full
  analysis intake — is optional and dismissible.
- **Unknown facts never exclude.** No country, no graduation year, no fields ⇒
  the student sees more, never less. Exclusion requires knowing both sides.
- **The verification tick is a claim about authorship, not quality.** It means
  "we confirmed this account belongs to that organisation, and they posted
  this" — nothing else. It never goes on a row we posted for someone, and an
  unverified partner shows its name with no tick rather than a weaker one.
- **A partner post is only as live as its partner.** Posts publish instantly
  (trust is granted once, per organisation, at `/admin/partners`), so the safety
  net is removal, not review: `lib/partners/live.ts` drops any row whose partner
  is not `active`. Suspending an organisation must take its opportunities down
  with it, or the switch is decorative.
- **Never show a countdown for a date we cannot stand behind.** An unconfirmed
  date renders as "not yet announced". A wrong one can make a student miss a
  real deadline.
- **Optimistic writes roll back on failure.** The UI must never claim a save
  that did not happen.
- **A live link is not a live programme.** Read what an opportunity's page
  actually says before adding it; `test:links` cannot tell you a contest was
  discontinued.
