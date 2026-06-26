-- High-school graduation year. Anchors the date-based timeline (which SAT sitting
-- to target, application-deadline window, days remaining). Optional; the app
-- degrades gracefully (saves without it) until this migration is applied.

alter table student_profiles
  add column if not exists graduation_year integer;
