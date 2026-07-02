-- Migration 0018: total grades in the student's school system.
--
-- Run in the Supabase SQL editor (Settings -> SQL editor).
--
-- School systems differ in length (11 grades in Kazakhstan/Russia, 12 in the
-- US, 13 in Italy/Germany), so "grade 10" means a different distance from
-- graduation depending on the system. Collected on the onboarding General step
-- (replacing the unused full-name/school-name fields) and passed to the
-- analysis as context.

ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS school_years integer;  -- nullable; typically 10-13
