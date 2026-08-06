-- Compass — "How did you hear about us?" attribution survey (non-referral signups)
-- Run in the Supabase SQL editor (migrations are applied manually).

-- Where a non-referral user says they found Compass, and the ambassador code
-- they typed (if any). A valid code is also written to profiles.referred_by by
-- the onboarding action so it counts toward the ambassador, exactly like a
-- referral link.
alter table public.profiles add column if not exists heard_from text;
alter table public.profiles add column if not exists heard_from_code text;

-- The grants are part of THIS migration, not optional extras.
--
-- 0008 revoked the blanket UPDATE on profiles from anon/authenticated and grants
-- these two columns back only `if exists` — a guard for the case where 0006 had
-- not been run yet. That is exactly what happened: 0006 was skipped, 0008 ran,
-- the guard found no columns, and no grant was ever issued. Applying 0006 alone
-- afterwards therefore creates columns the app still cannot write: saveProfile()
-- uses the user's own (RLS) client, so it hits 42501 "permission denied for
-- column", falls back to saving country alone, and the survey answer is lost
-- silently — the same failure 0012 had to fix for full_name.
--
-- Neither column carries privilege (unlike role / referred_by, which stay
-- locked), and RLS still scopes the write to the user's own row.
grant update (heard_from) on public.profiles to authenticated;
grant update (heard_from_code) on public.profiles to authenticated;
