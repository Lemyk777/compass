## What changed

<!-- One or two sentences. The diff shows what; say why. -->

## Why

<!-- What problem this solves, and what was ruled out. A future reader needs the
reasoning far more than a restatement of the diff. -->

## Verification

<!-- Delete what doesn't apply. CI runs the first two automatically. -->

- [ ] `npm run build` — clean (lint + types)
- [ ] `node --import tsx scripts/test-session-checks.ts` — all pass
- [ ] `npm run test:links` — only if catalog data changed
- [ ] Checked in a browser, and here is what I saw:

## Database

- [ ] No migration needed
- [ ] Adds migration `supabase/migrations/____.sql` — **must be applied by hand**
      in the Supabase SQL editor. Code degrades with an actionable message until
      it is.

## Anything still unverified

<!-- Say it plainly. "Only tested in demo, which has no session" is far more
useful than silence. -->
