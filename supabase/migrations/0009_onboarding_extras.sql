-- Redesigned onboarding extras: the student's current school and the family's
-- annual budget (USD). Both optional; the app degrades gracefully (saves without
-- them) until this migration is applied. full_name already lives on `profiles`.

alter table student_profiles
  add column if not exists school_name text,
  add column if not exists budget_annual_usd numeric;
