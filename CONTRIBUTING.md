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

> **Resolved as of 2026-08-17: the practice matches this section again.** For a
> while it did not — PRs #107, #108, #114, #115 and #116 all went `feat/…` →
> `main` directly, so `develop` was not the integration point and this section
> described an intention rather than what happened. The question was left open
> here rather than quietly corrected, because which of the two was right was the
> owner's call. It was answered by practice: the last two releases,
> [#117](https://github.com/Lemyk777/compass/pull/117) and
> [#118](https://github.com/Lemyk777/compass/pull/118), both went `develop` →
> `main`, and `develop` now tracks `main` exactly. **Follow this section as
> written.** The failure mode to watch for is the opposite one, and it has bitten
> once: `develop` drifting 75 commits behind `main` with none of its own, so that
> branching from it per this document produced a tree missing whole features.
> Check `git rev-list --count origin/develop..origin/main` before branching.

### Never keep pushing to a branch whose PR has merged

A merged pull request is closed and does not take new commits. Anything pushed
to that branch afterwards **silently accumulates instead of shipping**, and the
branch keeps looking like it is up to date. This has happened here **three
times**: PR #106, PR #107 (leaving ten commits and then two more stranded on
`feat/guide-spine` while the branch name suggested otherwise), and PR #111,
which was merged while its review was still running so that all three of the
resulting fix commits stranded — and `develop` briefly carried a release whose
centrepiece did not work.

The deeper rule the third one taught: **run the whole-branch review BEFORE asking
for the merge.** Checking the PR state before pushing is necessary and not
sufficient, because this owner merges fast, which is fine.

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

## The gate — CI runs these three, and so should you

```bash
npm run build
```

```bash
node --import tsx scripts/test-session-checks.ts
```

```bash
npm run test:unit
```

`npm run build` is the lint and type-check gate, not just a bundler.
`test-session-checks.ts` is pure logic — no API key, no database, no network.
`test:unit` covers the deterministic engine: scoring, eligibility arithmetic,
the filter rules, the guide chain, the planner, and the guards that keep heavy
registries out of client bundles. [CI](.github/workflows/ci.yml) runs all three
on every push and pull request, without secrets.

After touching the catalog or the guide sources, add:

```bash
npm run test:links
```

It is **not** in the main gate — it makes ~200 third-party requests, and shared
CI runners get different answers than a student does. A weekly
[link-health](.github/workflows/link-health.yml) job runs it on Mondays instead,
and a failure there is a "go and look", not a verdict. `test:links` fails only on
genuinely dead links; a bot wall or a one-off 5xx is reported without failing.
**One known hole:** `401` is currently counted as a bot wall, so a private
document or an expired share link is reported healthy. That is open finding A2 in
[docs/AUDIT_2026-08-14.md](docs/AUDIT_2026-08-14.md).

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

`.env.local` is git-ignored and stays that way. The six variables are listed in
[.env.example](.env.example): five are needed to run the app, and the sixth,
`CRON_SECRET`, gates the two cron endpoints. That gate **fails closed** — no
secret means a 503 and the scheduled jobs silently never run, which is the safe
direction, because those routes fetch pages, call the model and write with the
service-role key. The hard spend cap for the Anthropic key can only be set in the
Anthropic console — it cannot be enforced from code.
