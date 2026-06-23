-- Migration 0005: Hong Kong module fields on student_profiles.
--
-- Run in the Supabase SQL editor (Settings -> SQL editor).
-- Existing rows default to HK disabled (empty array, null status).

ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS hk_programs     text[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hk_grade_status text;   -- nullable; 'predicted' | 'achieved' | null
