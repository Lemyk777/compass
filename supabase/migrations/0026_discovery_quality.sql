-- 0026_discovery_quality.sql
-- Screening findings on a discovered candidate.
--
-- WHY: discovery's bottleneck was never finding names — it was that every found
-- name arrived as an unverified claim, so a human had to open the page, read
-- it, and decide. That review is the expensive step. lib/discovery/screen.ts
-- now reads the candidate's own page for the failure modes the catalog has
-- actually been burned by (a programme whose page says it ended, a listing site
-- posing as the organiser, an eligibility rule no student passes, whatever the
-- page says about money) and quotes the evidence. This column is where that
-- evidence is kept, so /admin/opportunities can show it and the decision costs
-- seconds instead of a research session.
--
-- Shape: a JSON array of { code, severity, detail }. `severity` is always
-- "flag" here — a "drop" never reaches this table, by design.
--
-- Degradation: lib/discovery/run.ts retries the insert without this column on
-- 42703/PGRST204, so a deploy that lands before this migration is applied keeps
-- queueing candidates (just without their warnings). Applying it turns the
-- evidence back on with no code change.
--
-- Apply manually in the Supabase SQL editor (no migration runner is wired up).

ALTER TABLE competition_candidates
  ADD COLUMN IF NOT EXISTS warnings JSONB NOT NULL DEFAULT '[]'::jsonb;
