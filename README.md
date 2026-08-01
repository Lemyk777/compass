# Compass

An admissions guidance tool for international students. It scores a student's
profile against real admitted-student data and returns a structured report —
factor scores, per-school likelihood ranges, benchmarks, gap analysis, a dated
roadmap — for **six destinations**: the US, Italy, Hong Kong, the UAE, South
Korea, and US branch campuses abroad.

Alongside the report it runs **Opportunities**: a curated, link-checked registry
of 100 competitions, olympiads, summer and research programmes, matched to the
student's field, country, school year and age. That half works without an
account and without an analysis — see `/opportunities`.

## Quick start

```bash
npm install
```

```bash
npm run dev
```

The app runs at http://localhost:3000. Without environment variables it still
builds, and `/demo` renders a full sample report; auth and analysis need the
five vars in [.env.example](.env.example). Setup, including the Supabase
project and role assignment, is in [docs/SETUP.md](docs/SETUP.md).

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build — **also the lint + type-check gate** |
| `npm run lint` | ESLint only |
| `npx tsc --noEmit` | Type-check only |
| `npm run test:links` | Every catalog URL; fails on a dead link |
| `npm run test:analyze` | The sample profile through the live analysis engine |

There is no unit-test runner. The verification path is `npm run build`, the
logic checks in `scripts/test-session-checks.ts`, and `npm run test:links`.

> **Never run `npm run build` while `npm run dev` is running.** They share
> `.next/` and the build removes chunks the dev server still holds, producing a
> `Cannot find module './NNNN.js'` that looks like a code bug and is not one.

## Where things are

[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) is the map: what lives where, and
which file to open for a given change. The short version:

| Path | |
| --- | --- |
| `app/` | Next.js App Router — routes, server actions, API handlers |
| `components/` | UI, grouped by surface (dashboard, onboarding, marketing, …) |
| `lib/ai/` | The analysis pipeline — prompt, schema, assembly, per-country engines |
| `lib/data/` | Deterministic datasets and the logic over them |
| `supabase/migrations/` | SQL, **applied by hand** — there is no migration runner |
| `scripts/` | Verification and one-off tooling |
| `docs/` | Product spec, setup, research, working plans |

## Contributing

Branch naming, commit style, the verification gate and the migration policy are
in [CONTRIBUTING.md](CONTRIBUTING.md). [CLAUDE.md](CLAUDE.md) holds the same
rules in the form Claude Code reads.

## Stack

Next.js 14 (App Router, RSC, server actions) · TypeScript (strict) · Tailwind ·
Supabase (Postgres, Auth, RLS) · Anthropic `claude-haiku-4-5` · Recharts · Zod.
