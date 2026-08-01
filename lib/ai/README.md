# `lib/ai` — the analysis pipeline

## The one rule

**The model returns qualitative JSON only. Code computes every number.**

The reply is validated against `modelAnalysisSchema` — the full analysis schema
*minus* `overall_score`, `benchmarks`, and the per-country data. Then
`assembleAnalysis()` computes those deterministically. Same profile in, same
numbers out, run to run, and the model can never invent a score.

If a change affects a number, it almost certainly does not belong in
`prompt.ts`.

## Read these together

| File | |
| --- | --- |
| `prompt.ts` | The cached system block: instructions, rubric, ~55 universities |
| `analyze.ts` | The call itself — streaming, retries, `buildModelInput` |
| `schema.ts` | What the model may return, and the full analysis shape |
| `assemble.ts` | Where the score, benchmarks and country analyses are computed |
| `italy-analyze.ts`, `hk-analyze.ts`, `uae-analyze.ts`, `korea-analyze.ts` | Per-country engines — **fully deterministic, no model involved** |
| `section-reuse.ts` | Diffs the profile by input group; skips the model entirely when nothing model-relevant changed |
| `sample.ts` | The sample analysis behind `/demo` |

## Prompt caching — do not break it

`STATIC_SYSTEM_PROMPT` is sent as a cached block and **must stay byte-identical
across requests**. That means:

- per-user data goes in the user message, never the system block;
- dataset ordering must be stable;
- an incidental edit to a university row invalidates the cache for everyone.

The cache is the difference between a couple of cents per analysis and an
uncapped bill. The hard spend cap can only be set in the Anthropic console — it
cannot be enforced from code.

## Bounds

`lib/limits.ts` is the single source of truth for input caps, enforced in three
places: the intake Zod schema, the onboarding UI, and `buildModelInput`. Change
it there and all three follow.

## Testing it for real

```bash
npm run test:analyze
```

Needs a valid `ANTHROPIC_API_KEY` in `.env.local` and costs a real (small)
amount. The deterministic country engines need neither, and are covered by the
logic checks.
