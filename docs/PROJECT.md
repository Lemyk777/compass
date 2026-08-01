# Compass — Project Guide (for humans & AI agents)

> Read this first. It's the single orientation doc: what Compass is, how it's
> built, where everything lives, and the rules to follow when changing it.
> Companion docs: [`SETUP.md`](SETUP.md) (how to run it with real keys) and
> [`compass-project-blueprint.md`](compass-project-blueprint.md) (original spec).

---

## 1. What it is

Compass is a web app that helps **internationally-based high-school students
assess and improve their applications to universities abroad (currently US and Italy)**. A student enters
their academic profile and gets a **rich, visual, honest report**: scored profile
factors, an overall competitiveness score (0–100), per-school admission
likelihood *ranges* with a confidence level, benchmark comparisons, a quantified
gap analysis, ranked school recommendations, and an action timeline.

Three roles: **student** (default), **ambassador** (referral hub), **admin**
(founder metrics). Students arrive via ambassador referral links.

**Product principle — honest by design:** numbers describing the *profile* are
confident point values; numbers *predicting admission* are always ranges with a
confidence label. Never imply certainty for hyper-selective schools.

---

## 2. Tech stack

| Area | Choice |
|---|---|
| Framework | **Next.js 14** (App Router) + **TypeScript** |
| Styling | **Tailwind CSS** (custom tokens; no templated look) |
| Charts | **Recharts** (radar, bars, radial gauges) |
| DB + Auth | **Supabase** (`@supabase/supabase-js` + `@supabase/ssr`); email + Google OAuth; **RLS** on every table |
| AI | **Anthropic SDK**, model **`claude-haiku-4-5`**, prompt caching on the static system block |
| i18n | Custom lightweight EN/RU (cookie-driven) — **English default** |
| Deploy | **Vercel** (push to `main` → auto-deploy) |
| Node | 20+ |

---

## 3. Non-negotiable rules

1. **Never hardcode secrets.** All keys via env (`.env.example` committed,
   `.env.local` git-ignored). `.gitignore` excludes `.env*`.
2. **Anthropic key is server-only.** All Claude calls happen in server code.
   Never call Anthropic from the browser or expose `ANTHROPIC_API_KEY` /
   `SUPABASE_SERVICE_ROLE_KEY`.
3. **The AI returns data, never drawings.** The model outputs strict JSON
   (validated with Zod); the frontend renders all charts with Recharts.
4. **Privacy:** no personal data in URLs. RLS so a student reads only their own
   rows. The service-role key bypasses RLS and is used **only** in trusted server
   code (provisioning, analytics, writing the analysis).
5. **Mobile-first**, responsive to ~360px. Visible focus, sufficient contrast,
   `prefers-reduced-motion` honored.
6. **Typed throughout.** Shared types for the profile and analysis live in
   `lib/types.ts` and `lib/ai/schema.ts` — reuse them on client and server.
7. **Multiple Destinations:** The architecture supports multiple countries (`lib/data/destinations.ts`). The US uses an AI-driven pathway, while Italy uses a strict, deterministic code-driven pipeline (`lib/ai/italy-analyze.ts`).

---

## 4. Directory map

```
app/
  (marketing)/page.tsx     Landing (logo wall, flags, demo, CTAs)
  auth/                    login, signup, callback (role-based routing), signout
  onboarding/              multi-step intake (page.tsx + actions.ts server action)
  dashboard/page.tsx       loads latest analysis; renders DashboardClient
  ambassador/page.tsx      referral hub / "pending approval" state
  admin/page.tsx           founder metrics (role-gated)
  api/analyze/route.ts     POST: runs the AI analysis (server-only)
  demo/page.tsx            public preview of the report (sample data)
  error.tsx, global-error.tsx, not-found.tsx   error boundaries
  layout.tsx               fonts + <html lang> + LanguageProvider
  globals.css              Tailwind + CSS tokens + marquee/animation keyframes
components/
  charts/                  RadarScorecard, FactorBars, OverallGauge, LikelihoodGauge, SchoolComparison
  report/                  Report (composer) + Scorecard, Benchmarks, GapAnalysis, Recommendations, Timeline, Section
  onboarding/Onboarding.tsx   the multi-step form
  dashboard/DashboardClient.tsx   analyze flow + loading/empty/error states
  ambassador/, admin/, auth/, marketing/, ui/
lib/
  ai/
    prompt.ts              STATIC_SYSTEM_PROMPT (instructions + rubric + universities) — cached
    schema.ts              Zod schema + types; modelAnalysisSchema (what the model returns)
    analyze.ts             builds request, STREAMS the call, validates JSON, retries once
    assemble.ts            computes overall score + benchmark table in code (deterministic)
    sample.ts              §12 sample student + a hand-authored sample Analysis (for /demo + tests)
  data/universities.ts     ~50+ curated US schools (acceptance_rate, sat_p25/p75, notes)
  rubric.ts                7-factor weights (single source of truth; founder tunes here)
  limits.ts                input size caps (LIMITS) enforced in 3 places
  types.ts                 StudentProfileInput + curricula
  tiers.ts                 tier colors/labels, confidence labels, accent
  i18n/                    config, dictionary (en/ru), server getT(), client provider/useT
  supabase/                client.ts, server.ts, admin.ts (service role), middleware.ts
  auth/                    session.ts (getSession/requireSession/requireRole/landingPathForRole), provision.ts
  site.ts, useCountUp.ts
middleware.ts              refreshes Supabase session + captures ?ref=CODE cookie
supabase/migrations/0001_init.sql   tables + RLS policies + signup_count_for_code()
public/logos/              real university logos used by the marquee
scripts/test-analyze.ts    §12 acceptance test (npm run test:analyze)
```

---

## 5. Data model (Supabase) — see `supabase/migrations/0001_init.sql`

- **profiles** — one row per user: `role` (student|ambassador|admin), `full_name`,
  `country`, `referred_by` (ambassador code), set at signup.
- **student_profiles** — the intake: `curriculum`, `grades` (jsonb), `tests`
  (jsonb), `activities` (jsonb), `target_schools` (text[]), `intended_major`,
  `citizenship`, `needs_aid`.
- **analyses** — one row per run: `input_snapshot` + validated `output` (the
  analysis JSON). History is kept.
- **ambassadors** — `code` (unique), `country`, `tier`, `signups`, `status`.
- **universities** — optional DB copy of the dataset (app reads from code).
- **events** — lightweight log: `signup | analysis_run | share`, with `ref_code`.

**RLS:** students select/insert/update only `user_id = auth.uid()` rows.
Ambassadors read their own `ambassadors` row + an aggregate signup count via the
`signup_count_for_code()` SECURITY DEFINER function. Admin/server work uses the
service-role key (bypasses RLS) in server code only.

---

## 6. The AI analysis pipeline (the heart)

`POST /api/analyze` ([app/api/analyze/route.ts](app/api/analyze/route.ts)):
1. Auth the user (Supabase server client).
2. Load their `student_profiles` + `profiles.country`.
3. Rate-limit: **max 5 analyses / hour / user** (counts `analyses` rows via the
   service-role client). `// FOUNDER: set a hard spend limit in the Anthropic console`.
4. Call `analyzeProfile(profile)` ([lib/ai/analyze.ts](lib/ai/analyze.ts)):
   - System block = `STATIC_SYSTEM_PROMPT` (rubric + university data), marked
     `cache_control: ephemeral` for prompt caching. Only the size-bounded profile
     varies (sent as the user message).
   - The request is **streamed** (`.stream().finalMessage()`) so long generations
     don't hit the platform response/idle timeout — this was the cause of the old
     non-JSON "An error occurred…" failures.
   - The model returns **only qualitative JSON** (`modelAnalysisSchema`): factors,
     schools, recommended_schools, gap_analysis, timeline, summary.
   - `assembleAnalysis()` ([lib/ai/assemble.ts](lib/ai/assemble.ts)) then computes
     the **overall_score** (rubric-weighted, deterministic) and the **benchmark
     table** (from `lib/data/universities.ts`) in code — the model never does
     arithmetic or repeats dataset numbers.
   - JSON parse failure → retry once with a stricter reminder; if cut off by the
     token cap, fail fast with an actionable message.
5. Persist the run to `analyses` + log an `analysis_run` event (service role).
6. Return `{ analysis, usage }`.

**Input limits** ([lib/limits.ts](lib/limits.ts)) are enforced in 3 places (intake
Zod schema, onboarding UI, model-input builder) so an oversized profile can never
blow up the request.

**Honesty constraints** are baked into the prompt: per-school numbers are always
ranges; sub-15% admit-rate schools forced to `confidence: "low"`.

**Scoring rubric** lives in [lib/rubric.ts](lib/rubric.ts) (7 factors, v1 weights).
The founder tunes weights there without touching prompt logic.

---

## 7. Auth, roles & referral

- **Sign-in:** email/password + Google OAuth (`components/auth/AuthForm.tsx`).
  Both land on `/auth/callback`, which provisions the user once
  ([lib/auth/provision.ts](lib/auth/provision.ts)) and **routes by role**
  (`landingPathForRole`): admin → `/admin`, ambassador → `/ambassador`, student →
  `/onboarding`. An explicit `?next=` (from a gated page) is honored over the role
  default.
- **Referral:** `middleware.ts` captures `?ref=CODE` into a cookie; on first
  provision it writes `profiles.referred_by`, logs a `signup` event, and bumps the
  ambassador's count.
- **Guards:** `requireSession()` / `requireRole()` in
  [lib/auth/session.ts](lib/auth/session.ts).
- **Roles are set manually in the DB** (v1; no UI). See SETUP.md §7:
  `update profiles set role='admin' where id='<uuid>';` and insert an
  `ambassadors` row for ambassadors.

---

## 8. Design system

Tokens in [tailwind.config.ts](tailwind.config.ts) + [app/globals.css](app/globals.css):
- **Palette:** deep navy ink `#10192B`, warm surface `#F5F3EF`, white cards,
  **one accent** `#2F6FED` (azure) reserved for the user's own scores.
- **Tier scale (used everywhere):** Reach `#E0664F`, Target `#D98A2B`, Likely
  `#3F9B6E` — see [lib/tiers.ts](lib/tiers.ts).
- **Type:** Space Grotesk (display + tabular figures) + Inter (body). Numbers use
  `tabular-nums` (`data-num` / `.tnum`).
- **Signature element:** the Scorecard (gauge + radar + factor bars) — the hero,
  the thing students screenshot.
- Motion is minimal (gauge counts up once; marquee scrolls; reduced-motion honored).

---

## 9. Internationalization (EN/RU)

- **English is the default.** Toggle (EN/RU) in headers persists the choice in a
  cookie; switching calls `router.refresh()` so server components re-render.
- Server components: `getT()` from [lib/i18n/server.ts](lib/i18n/server.ts).
  Client components: `useT()` from [lib/i18n/client.tsx](lib/i18n/client.tsx).
- All UI strings live in [lib/i18n/dictionary.ts](lib/i18n/dictionary.ts)
  (flat keys, `en` + `ru`). **Add new copy as keys there, never hardcode strings.**
- **AI-generated prose** (factor notes, school reasons, summary) is **not**
  translated — it comes from the model in English. (Making it RU = a prompt
  change, not done yet.)

---

## 10. Run, verify, deploy

```bash
npm install
npm run dev            # http://localhost:3000
npm run build          # production build (also typechecks + lints)
npm run test:analyze   # §12 acceptance test against the real AI (needs ANTHROPIC_API_KEY)
```

- **No keys?** `http://localhost:3000/demo` renders the full report with sample
  data (auth pages will error without Supabase keys — expected).
- Env vars (`.env.local`, see `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
  `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SITE_URL`.
- **First-time setup** (migration, auth providers, Google OAuth, roles, deploy):
  follow [SETUP.md](SETUP.md).
- **Deploy:** push to `main` → Vercel auto-deploys. Set the same env vars in
  Vercel; set Supabase **Site URL** + **Redirect URLs** to the production domain.

**Verifying UI changes:** prefer the preview tooling / a dev server over guessing.
The repo's "no live keys here" workflow is recorded in the project memory.

---

## 11. Conventions for changing the code

- **Match the surrounding style** (Tailwind utility classes, small focused
  components, server vs. client split). Components that use hooks need
  `"use client"`.
- **Strings → i18n.** Any user-visible text goes through `t(...)` with keys in the
  dictionary (both `en` and `ru`).
- **Charts render from the analysis JSON only.** Don't ask the model to produce
  layout/markup. If you add a report section, extend `schema.ts` (and
  `modelAnalysisSchema` if the model should produce it) + the prompt + a renderer.
- **Tier/confidence/effort labels** come from `lib/tiers.ts` + i18n, not inline.
- **Server-only secrets** stay server-only. The browser Supabase client uses the
  anon key; `createAdminClient()` (service role) is server-only.
- **Commit + push to `main`** to deploy. End commit messages with the
  `Co-Authored-By` trailer if you're an agent. Run `npm run build` before pushing.

---

## 12. Known gotchas

- **Recharts + ResponsiveContainer:** the radar's enter-animation can collapse the
  polygon to the origin; `RadarScorecard` uses `isAnimationActive={false}`.
- **Dev-server staleness:** after many edits the Next dev server can 404 routes or
  show "missing required error components" — `rm -rf .next && npm run dev` + a hard
  browser refresh fixes it.
- **Analysis non-JSON errors** were caused by platform timeouts; fixed by streaming
  the Anthropic call + the client reading the response as text before JSON-parsing.
- **University logos:** Clearbit's free logo API is dead. Real logos live in
  `public/logos/`; the marquee falls back to an academic seal for any school
  without a file. Country flags use flagcdn.com.
- **Layout reads a cookie** (`lang`), so most routes render dynamically (`ƒ`) —
  expected.

---

## 13. Out of scope (v1) / open threads

- Deferred: automated leaderboard/tier unlocks, transactional email, a premium
  Sonnet "deep analysis" tier, essay-angle generation, payments.
- **Other Countries:** UK, DE, NL, CA are placeholders in `destinations.ts` and not yet active.
- **AI report in Russian** when RU is selected: not done (prompt change needed).
