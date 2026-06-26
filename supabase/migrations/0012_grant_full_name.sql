-- Compass — let a student save their own full name from onboarding.
-- Migration 0012. Apply MANUALLY in the Supabase SQL editor (no migration runner).
--
-- WHY (regression introduced by 0008 + the onboarding redesign):
--   Migration 0008 revoked the blanket UPDATE on `profiles` from anon/authenticated
--   and granted column-level UPDATE back only on `country` (+ heard_from* if present).
--   At that time saveProfile() wrote only those columns. The redesigned onboarding
--   later added a "Full name" field that saveProfile() now writes to
--   profiles.full_name. Under 0008 that write is rejected with
--   "permission denied for column full_name" (SQLSTATE 42501), which surfaced to
--   students who filled in their name as a permanent
--   "Could not save. Please retry." on the intake form — retrying never helped.
--
-- FIX:
--   Grant authenticated UPDATE on `full_name` only. full_name is the user's own
--   display name on their OWN row (RLS still scopes writes to auth.uid() = id) and
--   carries no privilege — unlike `role` / `referred_by`, which stay locked. The
--   service role keeps bypassing column grants for trusted server-side writes.

grant update (full_name) on public.profiles to authenticated;
