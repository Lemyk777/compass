# `scripts` — verification and tooling

Run directly with `tsx`. Nothing here ships in the app.

## The gate

| Script | Needs | |
| --- | --- | --- |
| `test-session-checks.ts` | nothing | **The closest thing to a unit-test suite.** Pure logic — no API key, no database, no network |
| `test-links.ts` | network | Every catalog URL. Fails only on genuinely dead links |
| `test-scrape-pages.ts` | network | Which linked page each competition resolves to |
| `test-onboarding.ts` | nothing | Intake schema, via `node --test` |

```bash
node --import tsx scripts/test-session-checks.ts
```

```bash
npm run test:links
```

## Costs money / needs a key

| Script | |
| --- | --- |
| `test-analyze.ts` | The sample profile through the live analysis engine |
| `test-discover.ts` | Live opportunity discovery for one faculty or country |
| `trace-reasoning.ts` | Dumps the model's reasoning for calibration work |

These load `.env.local` via `node --env-file` and need a valid
`ANTHROPIC_API_KEY`.

## Adding a check

**If a bug could recur, it gets a check in `test-session-checks.ts` in the same
change.** That file has caught, by assertion rather than by review:

- five duplicate ids and two entries sharing one URL;
- three eligibility rules that silently hid an opportunity from *everyone* —
  including one that hid the AMC from every 11th and 12th grader in production;
- a parser reading "no national selection needed" as *requiring* one.

Keep them pure. The moment a check needs a key or a database it stops being run,
and a check that is not run is not a check.

## Throwaway scripts

Fine to write, not fine to leave. Put them in the scratchpad, or delete them in
the same commit — `_audit-gates.ts` and `_coverage.ts` both did their job and
were removed.
