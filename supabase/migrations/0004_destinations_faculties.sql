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
-- legacy rows map to ['US'] plus 'IT' where the older include_italy flag was set.
--
-- Column-safe: if migration 0003 (include_italy) was never applied to this
-- database, there can be no Italy selections anyway, so legacy rows just map to
-- ['US']. The PL/pgSQL block plans each UPDATE lazily, so the include_italy
-- branch is never parsed when that column is absent.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'student_profiles' AND column_name = 'include_italy'
  ) THEN
    UPDATE student_profiles
      SET destinations = ARRAY['US']
        || CASE WHEN include_italy THEN ARRAY['IT'] ELSE '{}'::text[] END
      WHERE cardinality(destinations) = 0;
  ELSE
    UPDATE student_profiles
      SET destinations = ARRAY['US']
      WHERE cardinality(destinations) = 0;
  END IF;
END $$;
