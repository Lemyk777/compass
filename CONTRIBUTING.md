# Contributing

Conventions for this repository. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
says where code goes; this says how a change gets in.

## Branches

Two long-lived branches, and short-lived work branches off `develop`.

| Branch | |
| --- | --- |
| `main` | **Production.** Vercel deploys it. Protected: CI must pass, and it is only ever updated by merging `develop` or a hotfix |
| `develop` | Integration. Everything lands here first, and gets its own Vercel preview URL |
| `feat/…` `fix/…` `docs/…` `chore/…` | One line of work each. Branch from `develop`, PR back into `develop`, delete after merge |

```
develop ──┬── feat/public-checker ──┐
          │                         ├──> develop ──> main  (release)
          └── fix/amc-grade-gate ───┘
```

Why two and not one: `main` deploys the moment it changes, so making it the
working trunk means every intermediate state is production. This repository
pushed 1,350 lines straight to a deploying branch once already. `develop` is
what stops that being normal.

### Starting work

```bash
git checkout develop
```

```bash
git pull
```

```bash
git checkout -b feat/short-subject
```

On Windows PowerShell `&&` is not a statement separator — run these one at a
time, or chain with `;` and `if ($?) { … }`.

### Releasing

A release is a pull request from `develop` into `main`. Nothing else touches
`main`.

```bash
gh pr create --base main --head develop --title "release: what is going out"
```

The body lists what a user will notice and anything that must be done by hand —
a migration to apply, an environment variable to set.

> **What is actually happening, as of 2026-08-14.** The last several releases
> have gone `feat/…` → `main` directly — PR #107 and PR #108 both did — so
> `develop` has not been the integration point for a while and this section
> describes an intention rather than the practice. That is written down here
> rather than quietly corrected, because which of the two is right is the
> owner's call and not a documentation edit: either `develop` starts being used
> again, or this section should say "a feature branch, PRed into `main`, one
> release at a time". Until it is decided, **the rule that matters is the one
> below it** — never push to `main`, and open the PR.

### Never keep pushing to a branch whose PR has merged

A merged pull request is closed and does not take new commits. Anything pushed
to that branch afterwards **silently accumulates instead of shipping**, and the
branch keeps looking like it is up to date. This has happened here twice: PR
#106 and again PR #107, the second time leaving ten commits and then two more
stranded on `feat/guide-spine` while the branch name suggested otherwise.

So, before pushing to a branch that has a PR:

```bash
gh pr view <number> --json state,mergedAt
```

If it is `MERGED`, cut a fresh branch and open a new PR. And never edit a merged
PR's title or body to describe work that was not in it — that destroys the only
record of what actually shipped.

### Hotfixes

A production bug that cannot wait branches from `main`, PRs into `main`, and is
then merged back into `develop` so the fix is not lost at the next release.

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

Pull requests are the way in. `main` deploys to production, so pushing straight
to it means shipping unreviewed — the [CI workflow](.github/workflows/ci.yml)
runs the gate on every pull request, and that signal is the point.

## The gate — CI runs the first two, run all three before merging

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
