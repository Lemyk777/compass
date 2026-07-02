-- Migration 0017: South Korea (KR) module fields on student_profiles.
--
-- Run in the Supabase SQL editor (Settings -> SQL editor).
-- Existing rows default to Korea disabled (empty array, nulls).
--
-- Mirrors 0016_uae.sql: student_profiles keeps table-level UPDATE for the
-- authenticated role (RLS scopes writes to the owner), so no column grant is
-- needed here — unlike the `profiles` table, whose grants were locked in 0008.

ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS kr_programs     text[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS kr_grade_status text,     -- nullable; 'predicted' | 'achieved' | null
  ADD COLUMN IF NOT EXISTS kr_topik_level  integer;  -- nullable; TOPIK level 1-6 held, null = none
