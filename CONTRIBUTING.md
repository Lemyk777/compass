# Contributing

Conventions for this repository. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
says where code goes; this says how a change gets in.

## Branches

`main` is the trunk and **deploys to production**. Nothing lands there without
passing the gate below.

Work on a branch named `<type>/<short-subject>`:

```
feat/opportunities-eligibility-first
fix/onboarding-country-grant
docs/architecture-map
chore/upgrade-next
```

Merge with a fast-forward when the branch is a clean line of work, and delete
the branch afterwards. Long-lived side branches rot — the repo has already
carried two.

## Commits

Conventional-commit prefixes, with the affected area in parentheses:

```
feat(opportunities): grow the catalog 86 -> 100, aimed at grades 5-9
fix(dashboard): stop hiding AMC from 11th and 12th graders
docs: record why nudges without eligibility certainty measure zero
```

The subject line says what changed. **The body says why, and what it cost** —
what broke, what was ruled out, what is still not verified. A future reader
needs the reasoning far more than a restatement of the diff.

## The gate — run all three before merging

```bash
npm run build
```

```bash
node --import tsx scripts/test-session-checks.ts
```

```bash
npm run test:links
```

`npm run build` is the lint and type-check gate, not just a bundler.
`test-session-checks.ts` is pure logic — no API key, no database, no network.
`test:links` fails only on genuinely dead links; a bot wall or a one-off 5xx is
reported without failing.

**Stop the dev server before running the build.** They share `.next/`, and the
build removes chunks the running dev server still references — the resulting
`Cannot find module './NNNN.js'` looks like a code bug and is not one. Recover
with `rm -rf .next` and restart.

## Adding a check

If a bug could recur, it gets a check in `scripts/test-session-checks.ts` in the
same change. That file has caught five duplicate ids, two duplicate URLs, and
three eligibility rules that silently hid an opportunity from everyone — every
one of them found by an assertion, not by reading the diff.

## Database changes

Migrations are numbered SQL in `supabase/migrations/` and are **applied by hand**
in the Supabase SQL editor. There is no runner. So:

- write them idempotently (`create table if not exists`, `drop policy if exists`);
- include the column-level grants — privileges are locked down, and a missing
  grant appears as a bare `42501` that reads like anything but a permissions bug;
- handle the not-yet-applied case in code with an actionable message naming the
  migration, so an un-migrated database degrades instead of crashing;
- say clearly in the PR that a migration needs applying, and verify it landed
  against `information_schema` rather than trusting a note.

## Data in `lib/data/`

The registries are shipped data, so the bar is the same as for code:

- verify a URL **and read the page** before adding an entry — a discontinued
  contest can still answer HTTP 200;
- run the integrity checks; they will tell you about duplicate ids, duplicate
  URLs, and unreachable entries;
- an eligibility sentence that names two ranges needs an explicit `gate` — the
  parser takes the first match and will silently hide the entry.

## Secrets

`.env.local` is git-ignored and stays that way. The five required variables are
listed in [.env.example](.env.example). The hard spend cap for the Anthropic key
can only be set in the Anthropic console — it cannot be enforced from code.
