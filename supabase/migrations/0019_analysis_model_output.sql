-- Store the RAW model output (the qualitative JSON the AI returned, before the
-- deterministic assemble step) per analysis, so the next run can reuse the
-- sections whose inputs didn't change — implementing "a section only changes when
-- the input it depends on changes" (see lib/ai/section-reuse.ts).
--
-- Nullable + additive: historical rows and any insert made before this runs
-- simply have NULL model_output, so the next run falls back to a full fresh
-- analysis. Safe to apply anytime; never blocks storing an analysis.

alter table public.analyses
  add column if not exists model_output jsonb;
