-- Compass — lock down privilege-bearing columns on `profiles`
-- Migration 0008. Apply MANUALLY in the Supabase SQL editor (no migration runner).
--
-- WHY (privilege escalation):
--   RLS lets a user UPDATE their own `profiles` row, but RLS is ROW-level, not
--   COLUMN-level. With the default table-wide UPDATE grant, an authenticated
--   user can call the public PostgREST API directly (the anon key ships in the
--   browser bundle) and set `role = 'admin'` — or rewrite `referred_by` — on
--   their OWN row. RLS allows it because `auth.uid() = id`. Promoting yourself
--   to admin then unlocks the admin dashboard, which reads EVERY user's data via
--   the service role. That breaks per-user data isolation.
--
-- FIX:
--   Strip the blanket INSERT/UPDATE privilege from the public-facing roles
--   (`anon`, `authenticated`) and grant UPDATE back only on the columns the app
--   legitimately lets a user edit. `role`, `referred_by`, `full_name`, etc. are
--   no longer client-writable. The service role (server-side provisioning and
--   admin writes) BYPASSES column grants, so role assignment keeps working from
--   trusted server code / the SQL editor only.
--
-- SAFE: the app's saveProfile() updates only country/heard_from* (granted
--   below); profile rows are created exclusively by the service role in
--   provisionUser(), so removing client INSERT changes no real app flow.

-- 1) Remove blanket write privileges from the public-facing roles.
revoke insert, update on public.profiles from anon, authenticated;

-- 2) Allow authenticated users to edit ONLY the self-service profile fields.
grant update (country) on public.profiles to authenticated;

-- heard_from columns are added by 0006; guard so this migration still applies
-- cleanly even if 0006 has not been run yet.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
      and column_name = 'heard_from'
  ) then
    execute 'grant update (heard_from) on public.profiles to authenticated';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
      and column_name = 'heard_from_code'
  ) then
    execute 'grant update (heard_from_code) on public.profiles to authenticated';
  end if;
end $$;

-- Note: SELECT is intentionally left untouched (the app reads the user's own
-- profile; RLS still restricts it to their own row). DELETE is also unchanged.
