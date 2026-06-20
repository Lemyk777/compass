# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Compass — an AI guidance tool that scores an international student's profile for **US and Italian university** admissions and returns a structured, data-driven report (factor scores, per-school likelihood ranges, benchmarks, gap analysis, ranked recommendations). Three roles share one backend: **student** (core product), **ambassador** (referral growth), **admin/founder** (metrics). Full product spec lives in [compass-project-blueprint.md](compass-project-blueprint.md); setup in [SETUP.md](SETUP.md).

Stack: Next.js 14 (App Router, RSC, server actions) · TypeScript (strict) · Tailwind · Supabase (Postgres + Auth + RLS) · Anthropic `claude-haiku-4-5` · Recharts · Zod · custom EN/RU i18n.

## Commands

```bash
npm run dev            # dev server at http://localhost:3000
npm run build          # production build — also runs ESLint + type-check (use as the main gate)
npm run lint           # ESLint only
npx tsc --noEmit       # type-check only
npm run test:analyze   # run the §12 sample profile through the LIVE analysis engine
```

`test:analyze` needs `.env.local` with a real `ANTHROPIC_API_KEY` (it loads env via `node --env-file`). There is no unit-test runner; `npm run build` + `test:analyze` are the verification path.

## Environment

Five vars (see [.env.example](.env.example)) in `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SITE_URL`. Without them the app still builds and `/demo` renders the full report from a sample; auth and analysis require them.

## The AI analysis pipeline (the heart — read these together)

Spans [lib/ai/prompt.ts](lib/ai/prompt.ts), [lib/ai/analyze.ts](lib/ai/analyze.ts), [lib/ai/schema.ts](lib/ai/schema.ts), [lib/ai/assemble.ts](lib/ai/assemble.ts), [lib/ai/italy-analyze.ts](lib/ai/italy-analyze.ts), [lib/rubric.ts](lib/rubric.ts), [lib/data/universities.ts](lib/data/universities.ts).

- **Multi-Country Architecture:** The US pathway uses the AI model. The Italy pathway (`italy_programs`) is evaluated strictly deterministically in code (`lib/ai/italy-analyze.ts`), bypassing AI generation to avoid hallucinations.
- **The model returns qualitative JSON only.** It does NOT compute the overall score or the benchmark table. The model output is validated against `modelAnalysisSchema` (the full `analysisSchema` minus `overall_score`, `benchmarks`, and Italy data). Then `assembleAnalysis()` computes the **overall score**, **benchmarks**, and **Italy program analyses** deterministically in code, producing the full `Analysis` the dashboard renders. Same profile → same numbers, run to run.
- **Prompt caching:** `STATIC_SYSTEM_PROMPT` (instructions + rubric + ~55 universities) is sent as a cached system block and **must stay byte-identical across requests** — only the per-user profile (the user message) varies. Don't put per-user data in the system block; keep dataset ordering stable.
- **Robustness:** the call is **streamed** (`messages.stream().finalMessage()`), `maxRetries` lets the SDK back off on 429/5xx, and a parse failure retries once. A reply cut off by the token cap (`stop_reason === "max_tokens"`) fails fast with an actionable error. `app/api/analyze/route.ts` sets `maxDuration = 60` and rate-limits to 5 analyses/hour/user.
- The dashboard re-validates the stored analysis with the full `analysisSchema` and renders charts from the JSON — the model never draws.

## Input bounds (single source of truth)

[lib/limits.ts](lib/limits.ts) (`LIMITS`) defines all caps and is enforced in **three places**: the intake Zod schema ([app/onboarding/actions.ts](app/onboarding/actions.ts)), the onboarding UI ([components/onboarding/Onboarding.tsx](components/onboarding/Onboarding.tsx)), and the model-input builder (`buildModelInput` in analyze.ts). Change a limit here and all three follow. This bounds token cost and prevents oversized profiles from timing out the analysis.

## Intake: Common App–style Activities & Honors

The activities and honors sections mirror the Common Application 1:1 (field set, options, char limits). Types and option lists (`ACTIVITY_TYPES`, `GRADE_LEVELS`, `ACTIVITY_TIMING`, `HONOR_LEVELS`) live in [lib/types.ts](lib/types.ts). `normalizeActivities`/`normalizeHonors` there map older `{title, detail}` rows onto the current shape, so existing DB profiles keep working — use them whenever reading `activities`/`honors` from the DB. Activities stay in the `activities` jsonb column; honors are in their own `honors` column (migration `0002`).

## Supabase access model

- [lib/supabase/server.ts](lib/supabase/server.ts) — anon key, respects RLS **as the logged-in user**. Default for server components / route handlers / actions.
- [lib/supabase/admin.ts](lib/supabase/admin.ts) — service role, **bypasses RLS, server-only**. Use only for trusted writes (provisioning, event log, inserting analyses, admin metrics, rate-limit counts).
- [lib/supabase/client.ts](lib/supabase/client.ts) — browser client (auth UI).
- [lib/supabase/middleware.ts](lib/supabase/middleware.ts) — refreshes the auth session on every request AND captures the `?ref=CODE` ambassador code into a long-lived cookie.

RLS gives every table "own rows only"; ambassador signup counts come from the `signup_count_for_code` SECURITY DEFINER function. Inserts that must cross users (events, ambassador counters) go through the service-role client.

## Auth & roles

[lib/auth/session.ts](lib/auth/session.ts): `getSession` / `requireSession` / `requireRole` and `landingPathForRole`. [lib/auth/provision.ts](lib/auth/provision.ts): idempotent post-signup provisioning (profile row + referral attribution + signup event), run with the service role from [app/auth/callback/route.ts](app/auth/callback/route.ts). Roles (`student`/`ambassador`/`admin`) are set **manually in the DB** — there is no UI for promotion (see SETUP.md §7).

## Database migrations

SQL files in [supabase/migrations/](supabase/migrations/). They are applied **manually** in the Supabase SQL editor (no migration runner wired up). After adding a migration, tell the user to run it. `0001_init.sql` = schema + RLS + helper function; `0002_honors.sql` = the `honors` column.

## i18n

[lib/i18n/dictionary.ts](lib/i18n/dictionary.ts) is a flat `key → string` map per language (EN default, RU). Use `getT()` on the server, `useT()` on the client. Add every new UI string to **both** `en` and `ru`. AI-generated prose (factor notes, school reasons, summary) is returned by the model and is intentionally not translated.

## Cost & abuse

The only real financial risk is an uncapped API bill. The code rate-limits per user and caps `max_tokens`, but the **hard spend cap must be set in the Anthropic console** (it cannot be set from code). Keep prompt caching working and input bounded.

## Working agreement: committing

Do **not** create the final `git commit` unless the user's prompt explicitly tells you to (e.g. "commit it yourself", "сделай и закоммить сам"). Otherwise, do all the work — including building and verifying — then stop before the commit and present the result for approval. Everything else may proceed without asking. Never commit secrets; `.env.local` is git-ignored.
