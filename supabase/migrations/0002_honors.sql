-- Compass — add the Common App "honors / awards" section.
-- Run in the Supabase SQL editor (or via the Supabase CLI) on existing projects.
--
-- Activities stay in the existing `activities` jsonb column (their richer
-- Common App shape fits without a schema change). Honors get their own column.

alter table student_profiles
  add column if not exists honors jsonb not null default '[]'::jsonb;
