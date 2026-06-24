-- Store token usage per analysis so the admin dashboard can show REAL API cost
-- (total + per-analysis) instead of a flat estimate.
--
-- Nullable + additive: historical rows and any insert made before this runs
-- simply have NULL usage and fall back to the estimate on the dashboard, so
-- applying this is safe and never blocks storing an analysis.

alter table public.analyses
  add column if not exists usage jsonb;
