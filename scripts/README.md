# `scripts` — verification and tooling

Run directly with `tsx`. Nothing here ships in the app.

## The gate — CI runs these three on every push and PR

| Script | npm | Needs | |
| --- | --- | --- | --- |
| `test-engine.ts` | `test:unit` | nothing | **The main suite — 268 tests** over the deterministic engine, via `node --test`. Scoring, benchmarks, eligibility arithmetic, the filter rules, the guide's chain, the planner, the colour and typography invariants, and the guards that keep heavy registries out of client bundles |
| `test-session-checks.ts` | — | nothing | **61 checks.** Pure logic, and deliberately a different shape: geography, eligibility gates, registry integrity, the commitment vocabulary, cron rotation maths |
| — | `build` | nothing | `next build` is the lint and type-check gate, not just a bundler |

```bash
npm run test:unit
```

```bash
node --import tsx scripts/test-session-checks.ts
```

**Add a case to `test-engine.ts` when you touch scoring, eligibility or the
planner** — that last one because the planner sits behind a session and cannot
be opened in a browser by an agent, so a pure test is the only verification
available to it.

## Run by hand — network, no key

| Script | npm | |
| --- | --- | --- |
| `test-links.ts` | `test:links` | Every catalog URL. Fails only on genuinely dead links; a bot wall or a one-off 5xx is reported without failing. **Known hole: `401` is still counted as a bot wall**, so a private document reads as healthy — audit finding A2 |
| `test-guide-links.ts` | `test:guide-links` | The guide's official sources — ministries, portals, recognition databases. A 403/429/412 is a bot wall and still ships; a **timeout does not**, because it proves nothing |
| `test-scrape-pages.ts` | `test:scrape` | Which linked page each competition resolves to, without calling the model |

Neither link check is in CI. They make ~200 third-party requests, and from shared
runners the answers differ from what a student gets — the first run reported NYU
Shanghai broken when it answered 200 from an ordinary connection. A weekly
[link-health](../.github/workflows/link-health.yml) job carries `test:links`
instead, and **a failure there is a "go and look", not a verdict.** Run them
locally after any catalog or guide-sources edit.

## Run by hand — database or key

| Script | npm | |
| --- | --- | --- |
| `check-schema.ts` | `db:check` | **Read-only: is the database actually what this code assumes?** One probe per table, a couple of seconds. Reports 33/33 today. Run it after applying a migration, and before believing any note about what is applied — the first run found `profiles.heard_from` missing, which had silently discarded every "how did you hear about us?" answer |
| `test-analyze.ts` | `test:analyze` | The sample profile through the live analysis engine |
| `test-discover.ts` | `test:discover` | Live opportunity discovery for one faculty or country |
| `trace-reasoning.ts` | `trace:reasoning` | Dumps the model's reasoning for calibration work |
| `create-test-user.ts` | `create:test-user` | Creates or resets a pre-confirmed account so you can log in on localhost without the email step |

The last four load `.env.local` via `node --env-file` and need a valid
`ANTHROPIC_API_KEY` (or, for the user script, the service-role key).

**Add a new migration's expected columns to `check-schema.ts` in the same commit
as the migration.** That is what lets defensive scaffolding be deleted instead of
accumulating: code no longer has to survive an unknown schema, because the schema
is checkable.

## Other suites and tooling

| Script | npm | |
| --- | --- | --- |
| `test-onboarding.ts` | `test:onboarding` | **126 tests** over the intake schema and its server action, with the database and auth mocked. Not in CI — it needs `--experimental-test-module-mocks` |
| `test-korea.ts`, `test-hk-flow.ts`, `test-hk-achievements.ts` | — | Deterministic smoke tests for the per-country engines. No key needed: those pathways never call the model |
| `check-scoring.ts`, `sim-scorecard.ts`, `verify-dataset.ts` | — | Calibration and dataset work, not part of any gate |
| `diag-date-ceiling.ts` | `diag:dates` | Measures the deterministic ceiling on confirmed dates without calling the model |
| `build-map-outlines.ts` | `map:outlines` | Regenerates `lib/data/map-outlines.ts` after touching `public/data`. A unit test diffs the committed file against this generator, so a stale commit fails rather than drawing an old coastline |

## Adding a check

**If a bug could recur, it gets a check in the same change** — `test-engine.ts`
for anything the engine computes, `test-session-checks.ts` for registry and
geography invariants. Between them they have caught, by assertion rather than by
review:

- five duplicate ids and two entries sharing one URL;
- three eligibility rules that silently hid an opportunity from *everyone* —
  including one that hid the AMC from every 11th and 12th grader in production;
- a parser reading "no national selection needed" as *requiring* one;
- a whole matching guarantee that had been quietly lost, because a deleted
  component was the only caller of the control that recorded it.

Keep them pure. The moment a check needs a key or a database it stops being run,
and a check that is not run is not a check.

**A hand-built regex needs a second test proving it BITES on a known-bad input.**
One guard here was written as a template literal, where `\s` is the letter s and
`\b` is a backspace: it matched nothing, passed against a clean codebase exactly
as it would have passed against the bug it existed to catch, and was cited as a
guarantee in a PR description. Assemble patterns from RegExp literals via
`.source` so the parser owns the escaping.

**And check what the detector actually detects.** In five of nine findings from
the 2026-08-16 audit the root cause was the guard, not the code: the bundle guard
looked for a *direct* import edge, so one hop of indirection was invisible to it.
It walks the module graph now, stopping at `"use server"` files.

## Throwaway scripts

Fine to write, not fine to leave. Put them in the scratchpad, or delete them in
the same commit — `_audit-gates.ts` and `_coverage.ts` both did their job and
were removed.
