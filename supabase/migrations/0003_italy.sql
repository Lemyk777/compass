-- Migration 0003: Italy module fields on student_profiles.
--
-- Run in the Supabase SQL editor (Settings → SQL editor).
-- Existing rows default to Italy disabled (include_italy = false, empty array).

ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS include_italy      boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS italy_programs     text[]      NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS italy_family_income integer;   -- nullable; EUR/year; null = not provided / skipped
