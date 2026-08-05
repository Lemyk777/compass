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
| "What do you want out of work?" | `lib/data/values.ts` (3 questions + pure scoring) — may only REORDER the areas, never filter or change the fields |
| Where in the world a sphere of work lives | `lib/data/world.ts` — hubs with a catch and a route in, both mandatory |
| A full destination profile (US, UK, HK, …) | `lib/data/study-destinations.ts` → `/guide/[place]`; trade-offs must outnumber strengths, `notForYou` is mandatory, no prices or rankings |
| The student's own shell (Opportunities + Guide) | `components/student/StudentShell.tsx`; the report keeps `components/dashboard/DashboardShell.tsx` |
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
| `(marketing)/` | The public landing page. Session-aware: a signed-in visitor gets "Dashboard", not "Log in"/"Sign up" |
| `opportunities/` | **Public eligibility checker — the guest surface only.** A signed-in student is redirected to `/dashboard/opportunities` so there is one Opportunities experience per state, not two |
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

`dashboard/`, `onboarding/`, `marketing/`, `opportunities/`, `admin/`,
`ambassador/`, `partners/`, `auth/`, `report/`, `charts/`, `legal/`, `ui/`.

`ui/` is the shared primitive layer (Button, Link, Logo, view transitions).
Everything else belongs to one surface and should not be imported across
surfaces — if two surfaces need it, it moves to `ui/`.

### `lib/` — the logic

| | |
| --- | --- |
| `ai/` | The analysis pipeline. Read `prompt.ts`, `analyze.ts`, `schema.ts`, `assemble.ts` together — they only make sense as a set |
| `data/` | Deterministic datasets and the code over them: universities, programmes, deadlines, the opportunity registry, geography, the roadmap |
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
- verify against the live database rather than trusting a note:

  ```sql
  select table_name from information_schema.tables where table_name = 'your_table';
  ```

**This drifts silently — check it, don't assume it.** On 2026-08-05 an audit of
the live database found `0010_graduation_year` had never been applied: every
student's school year silently failed to save (the app degrades rather than
crashing, so nothing surfaced), while every other migration through 0023 *was*
applied. If a feature "doesn't persist" and the code looks right, check the
column exists before debugging the code.

### `scripts/`

Verification, run directly with `node --import tsx`. Two pure suites, both in
the CI gate and neither needing a key, network or DB:

- `test-engine.ts` (`npm run test:unit`, node:test) — the deterministic core:
  rubric/overall scoring, benchmarks, eligibility arithmetic, the interest quiz,
  the careers registry, matching invariants. **Add a case here when you touch
  scoring or eligibility.**
- `test-session-checks.ts` — 60 checks over geography, eligibility gates,
  registry integrity, the commitment vocabulary and cron rotation maths.

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
- **Keep the catalog out of client bundles.** `key-dates.ts` builds a lookup map
  over the whole ~2,700-entry catalog at module load, so *any* runtime import
  pulls the dataset into that route's JS. Client components import
  `formatDate`/`opportunityCost` from `opportunity-format.ts`, and the three
  matching views (`OpportunitiesView`, `EligibilityChecker`, `FirstWin`)
  dynamic-import `buildExtracurriculars` inside an effect. Type-only imports
  from key-dates are free. Reverting any of this to a static import + `useMemo`
  silently adds ~25 kB back to First Load JS.
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
