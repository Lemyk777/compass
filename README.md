# Compass

A guidance tool for international students, in three sections that run in one
order.

1. **Opportunities** — the front door, and the thing a student arrives for. A
   curated, link-checked registry of competitions, olympiads, courses,
   programmes, communities and job simulations — **170 entries as of
   2026-08-26** — matched to their field, country, school year and age, with
   honest dates and honest costs. Works signed out, with no analysis: see
   `/opportunities`.

   The number is dated because it moves, and the previous version of this file
   claimed 100 long after it was 173. In the product itself no count is ever
   written down: the landing page and the tabs read the catalog at request time,
   so what a student is told is what a student then sees. **Two counts are both
   true and mean different things** — the catalog's size, and how much of it
   *this* student can actually enter once age, school year, field and country
   have been applied. The tab strip shows the second and says so underneath.
2. **The guide** — where those things lead, in five steps that zoom in. Kinds of
   work → the subject you would apply with → the countries that host that work →
   the cities inside those → what you can enter from home without moving at all.
   33 areas of work, 44 majors, 17 country profiles, 38 cities, 6 routes from
   home, every one stating its catch as well as its appeal. Public on purpose: a
   family choosing between Germany and Korea should be able to read it without
   an account.
3. **The plan** — where what you decided becomes dated work. One private screen
   with three lenses over one list (`/planner?view=next|board|map`): a stepped
   calendar, a board, and mind maps. It is built out of what you took from the
   guide, and it carries one sentence at a time telling you what to do next and
   why.

The **admission analysis** — factor scores, per-school likelihood ranges,
benchmarks, gap analysis and a dated roadmap across the US, Italy, Hong Kong,
the UAE, South Korea and US branch campuses abroad — is still here and still the
deepest thing in the product, but it is now **one opt-in input rather than the
product a student arrives for**. New signups land on Opportunities, not on a
questionnaire.

## Quick start

```bash
npm install
```

```bash
npm run dev
```

The app runs at http://localhost:3000. Without environment variables it still
builds, and `/demo` renders a full sample report; auth and analysis need the
variables in [.env.example](.env.example). Five of the six are needed to run the
app at all; the sixth, `CRON_SECRET`, gates the scheduled jobs and they refuse
to run without it. Setup, including the Supabase project and role assignment, is
in [docs/SETUP.md](docs/SETUP.md).

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build — **also the lint + type-check gate** |
| `npm run lint` | ESLint only |
| `npx tsc --noEmit` | Type-check only |
| `npm run test:unit` | **301 unit tests** over the deterministic core (node:test — no key, no network, no database) |
| `npm run test:onboarding` | **126 tests** over the intake schema and its server action, with the database and auth mocked. Not in CI — it needs `--experimental-test-module-mocks` |
| `npm run db:check` | Read-only: is the database actually what this code assumes? |
| `npm run test:links` | Every catalog URL; fails on a dead link |
| `npm run test:guide-links` | The guide's official sources — ministries, portals, recognition databases |
| `npm run test:analyze` | The sample profile through the live analysis engine |

The verification path is `npm run build` (which is also the lint and type-check
gate), `npm run test:unit`, and the logic checks in
`scripts/test-session-checks.ts`. [CI](.github/workflows/ci.yml) runs those
three on every push and pull request without secrets. `test:analyze` is the only
command needing a real API key.

The link checks are deliberately **not** in that gate — they hit ~200 third-party
sites, and from shared runners the answers differ from what a student gets.
[A weekly job](.github/workflows/link-health.yml) runs `test:links` on Mondays
instead, and **its failures are a "go and look", not a verdict**: reproduce
locally before touching a catalog entry, because two "dead" links have recovered
on their own within the hour. Run them by hand after touching the catalog or the
guide's sources.

Migrations are applied by hand and nothing here runs them for you — after
applying one, `npm run db:check` is how you find out whether it landed. It
reports **33/33** as of 2026-08-17, everything through `0031_beat_reactions.sql`.

> **Never run `npm run build` while `npm run dev` is running.** They share
> `.next/` and the build removes chunks the dev server still holds, producing a
> `Cannot find module './NNNN.js'` that looks like a code bug and is not one.

## Where things are

[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) is the map: what lives where, and
which file to open for a given change. The short version:

| Path | |
| --- | --- |
| `app/` | Next.js App Router — routes, server actions, API handlers. `opportunities/` and `guide/` are public, `planner/` and `dashboard/` are not |
| `components/` | UI, grouped by surface (student, guide, planner, dashboard, onboarding, marketing, …) |
| `lib/ai/` | The analysis pipeline — prompt, schema, assembly, per-country engines |
| `lib/data/` | Deterministic datasets and the logic over them. Almost everything the three sections do is a pure function here, which is why it is testable without a browser |
| `supabase/migrations/` | SQL, **applied by hand** — there is no migration runner |
| `scripts/` | Verification and one-off tooling |
| `docs/` | Product spec, setup, research, working plans |

`lib/data/`, `lib/ai/`, `scripts/` and `supabase/migrations/` each carry their
own README covering the rules that apply inside them — read the one for the
folder you are about to change.

## Contributing

`main` is production and is protected. `develop` is where work lands; branch
from it, open a pull request back into it, and release by merging `develop`
into `main`. The full model — commit style, the verification gate, the
migration policy — is in [CONTRIBUTING.md](CONTRIBUTING.md).
[CLAUDE.md](CLAUDE.md) holds the same rules in the form Claude Code reads.

## Stack

Next.js 14 (App Router, RSC, server actions) · TypeScript (strict) · Tailwind ·
Supabase (Postgres, Auth, RLS) · Anthropic `claude-haiku-4-5` · Recharts · Zod ·
framer-motion.

Colour follows the reader's operating system: two palettes, one set of tokens,
no `dark:` variants anywhere and no toggle. Every colour is defined once per
theme in [app/globals.css](app/globals.css), and contrast is enforced by unit
test in **both** themes — see the colour section of [CLAUDE.md](CLAUDE.md)
before touching a token.
