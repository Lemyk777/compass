-- Migration 0016: United Arab Emirates (UAE) module fields on student_profiles.
--
-- Run in the Supabase SQL editor (Settings -> SQL editor).
-- Existing rows default to UAE disabled (empty array, null status).
--
-- Mirrors 0005_hong_kong.sql: student_profiles keeps table-level UPDATE for the
-- authenticated role (RLS scopes writes to the owner), so no column grant is
-- needed here — unlike the `profiles` table, whose grants were locked in 0008.

ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS uae_programs     text[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS uae_grade_status text;   -- nullable; 'predicted' | 'achieved' | null
