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
| Competitions, olympiads, programmes | `lib/data/key-dates.ts` |
| Who may enter an opportunity | `lib/data/eligibility.ts` |
| The dated roadmap | `lib/data/roadmap.ts` |
| Adding a whole new destination country | `lib/data/country-content.ts`, `deterministic-countries.ts`, `country-views.tsx` — one entry each, not edits across eight files |
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
| `(marketing)/` | The public landing page |
| `opportunities/` | **Public eligibility checker** — no login, no analysis |
| `onboarding/` | The intake wizard; `actions.ts` holds the Zod schema that is the single source of truth for a valid profile |
| `dashboard/` | The logged-in product. `layout.tsx` loads everything once and hands it to `DashboardContext`; each subroute is a thin view |
| `demo/` | The same dashboard over a sample analysis, no auth |
| `admin/` | Founder metrics and the opportunity-approval queue |
| `ambassador/` | Referral dashboard |
| `api/` | Route handlers, including `api/cron/*` (date sync, discovery) |
| `auth/` | Sign-in, callback, email confirmation |

Server actions live in `actions.ts` next to the route that uses them. Every
export in a `"use server"` file **must be an async function** — a non-function
export crashes the production build (not dev) with an opaque digest error.

### `components/` — grouped by surface, not by type

`dashboard/`, `onboarding/`, `marketing/`, `opportunities/`, `admin/`,
`ambassador/`, `auth/`, `report/`, `charts/`, `legal/`, `ui/`.

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

### `scripts/`

Verification, run directly with `node --import tsx`. `test-session-checks.ts`
is the closest thing to a unit-test suite — pure logic, no key, no network, no
DB. `test-links.ts` checks every catalog URL.

### Elsewhere

`data-pipeline/`, `reasoning-traces/`, `agents/` are research and calibration
work that does not ship in the app.

---

## Rules that are not obvious from the code

- **Prompt caching**: the static system prompt must stay byte-identical across
  requests. Per-user data goes in the user message, never the system block, and
  dataset ordering must stay stable.
- **Unknown facts never exclude.** No country, no graduation year, no fields ⇒
  the student sees more, never less. Exclusion requires knowing both sides.
- **Never show a countdown for a date we cannot stand behind.** An unconfirmed
  date renders as "not yet announced". A wrong one can make a student miss a
  real deadline.
- **Optimistic writes roll back on failure.** The UI must never claim a save
  that did not happen.
- **A live link is not a live programme.** Read what an opportunity's page
  actually says before adding it; `test:links` cannot tell you a contest was
  discontinued.
