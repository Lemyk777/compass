# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Compass — a guidance tool for international students. **Opportunities is the front door**: what competitions, olympiads, courses and programmes a student can actually enter, at their age, with honest dates and costs. The admission analysis (factor scores, per-school likelihood ranges, benchmarks, gap analysis, recommendations across **US · Italy · Hong Kong · UAE · Korea**) is now one opt-in input, not the product a student arrives for. Three roles share one backend: **student** (core product), **ambassador** (referral growth), **admin/founder** (metrics). Full product spec lives in [docs/compass-project-blueprint.md](docs/compass-project-blueprint.md); setup in [docs/SETUP.md](docs/SETUP.md); a map of the codebase in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md); the plan of record for the front door in [docs/OPPORTUNITIES_PLAN.md](docs/OPPORTUNITIES_PLAN.md).

Stack: Next.js 14 (App Router, RSC, server actions) · TypeScript (strict) · Tailwind · Supabase (Postgres + Auth + RLS) · Anthropic `claude-haiku-4-5` · Recharts · Zod · framer-motion.

## Commands

```bash
npm run dev            # dev server at http://localhost:3000
npm run build          # production build — also runs ESLint + type-check (use as the main gate)
npm run lint           # ESLint only
npx tsc --noEmit       # type-check only
npm run test:unit      # unit tests for the deterministic engine (node:test, no key/network)
npm run test:links     # every catalog URL; non-zero exit if any is DEAD
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

- **The student's section** — `/opportunities` (what you can enter) and `/guide`
  (where it leads). Frame: [components/student/StudentShell.tsx](components/student/StudentShell.tsx)
  — one narrow column, two destinations, the report a link away. Both routes are
  session-aware and work signed out; `/opportunities` shows the guest
  eligibility checker, `/guide` opens on every field instead of the student's.
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
- **The catalog is split by concern**: entries live in [lib/data/competitions-data.ts](lib/data/competitions-data.ts), matching logic in [lib/data/key-dates.ts](lib/data/key-dates.ts) (which re-exports the data, so existing imports still work), and the careers layer in [lib/data/careers.ts](lib/data/careers.ts). The careers
  layer moved to the **`/guide` page** ([components/guide/GuideView.tsx](components/guide/GuideView.tsx)),
  which runs interest → field → sphere of work → the cities that work lives in
  ([lib/data/world.ts](lib/data/world.ts)) → what to enter from home. Every hub
  there must carry BOTH its catch and a real route in — a city with only good
  news listed is an advert, and a test enforces it. The deep layer is
  [lib/data/study-destinations.ts](lib/data/study-destinations.ts) → `/guide/[place]`:
  11 full country profiles (money, admissions, after-study, cities). **Rules,
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

## The AI analysis pipeline (the heart — read these together)

Spans [lib/ai/prompt.ts](lib/ai/prompt.ts), [lib/ai/analyze.ts](lib/ai/analyze.ts), [lib/ai/schema.ts](lib/ai/schema.ts), [lib/ai/assemble.ts](lib/ai/assemble.ts), [lib/ai/italy-analyze.ts](lib/ai/italy-analyze.ts), [lib/rubric.ts](lib/rubric.ts), [lib/data/universities.ts](lib/data/universities.ts).

- **Multi-Country Architecture:** The US pathway uses the AI model. The Italy pathway (`italy_programs`) is evaluated strictly deterministically in code (`lib/ai/italy-analyze.ts`), bypassing AI generation to avoid hallucinations.
- **The model returns qualitative JSON only.** It does NOT compute the overall score or the benchmark table. The model output is validated against `modelAnalysisSchema` (the full `analysisSchema` minus `overall_score`, `benchmarks`, and Italy data). Then `assembleAnalysis()` computes the **overall score**, **benchmarks**, and **Italy program analyses** deterministically in code, producing the full `Analysis` the dashboard renders. Same profile → same numbers, run to run.
- **Prompt caching:** `STATIC_SYSTEM_PROMPT` (instructions + rubric + ~55 universities) is sent as a cached system block and **must stay byte-identical across requests** — only the per-user profile (the user message) varies. Don't put per-user data in the system block; keep dataset ordering stable.
- **Robustness:** the call is **streamed** (`messages.stream().finalMessage()`), `maxRetries` lets the SDK back off on 429/5xx, and a parse failure retries once. A reply cut off by the token cap (`stop_reason === "max_tokens"`) fails fast with an actionable error. `app/api/analyze/route.ts` sets `maxDuration = 60` and rate-limits to 5 analyses/hour/user.
- The dashboard re-validates the stored analysis with the full `analysisSchema` and renders charts from the JSON — the model never draws.

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
