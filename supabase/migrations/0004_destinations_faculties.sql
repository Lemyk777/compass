-- Migration 0004: country-first intake — destinations + faculties.
--
-- Run in the Supabase SQL editor (Settings → SQL editor).
--
-- The intake is no longer US-first: a student chooses which COUNTRIES they are
-- applying to (destinations) and which FIELDS they want to study (faculties),
-- and those drive the rest of the flow and the analysis. We keep the legacy
-- include_italy column (the app now derives Italy from destinations, but old
-- readers and a clean rollback path still rely on it).

ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS destinations text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS faculties    text[] NOT NULL DEFAULT '{}';

-- Backfill existing rows: before this redesign everyone was a US applicant, so
-- legacy rows map to ['US'] plus 'IT' where include_italy was set.
UPDATE student_profiles
  SET destinations = ARRAY['US']
    || CASE WHEN include_italy THEN ARRAY['IT'] ELSE '{}'::text[] END
  WHERE cardinality(destinations) = 0;
