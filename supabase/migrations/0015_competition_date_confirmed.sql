-- 0015_competition_date_confirmed.sql
-- Adds a `date_confirmed` flag to competition_deadlines.
--
-- The dashboard treats the curated code registry (lib/data/key-dates.ts) as the
-- authoritative source for dates and overlays a live DB date ONLY when it is
-- confirmed. The sync-dates cron sets this to TRUE only for a scraped date that
-- passed the guardrail (in the future, near the curated estimate). Until then a
-- row is "unconfirmed" and the UI shows "Dates not yet announced" rather than a
-- countdown we can't stand behind — so a bad auto-date can never make a student
-- miss a real deadline.
--
-- Existing seeded rows default to FALSE (unconfirmed) on purpose: the code-side
-- dates win until the scraper verifies them. Safe to run before deploying the
-- scraper change. Apply manually in the Supabase SQL editor.

ALTER TABLE competition_deadlines
  ADD COLUMN IF NOT EXISTS date_confirmed BOOLEAN NOT NULL DEFAULT FALSE;
