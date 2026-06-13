-- Compass — initial schema (§6 of the build spec)
-- Run in the Supabase SQL editor or via the Supabase CLI.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- profiles: one row per user (identity-adjacent metadata)
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null default 'student',          -- student | ambassador | admin
  full_name text,
  country text,                                  -- student's country (origin)
  referred_by text,                              -- ambassador code, set at signup
  created_at timestamptz default now()
);

-- student academic profile (the intake)
create table if not exists student_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  curriculum text,                               -- IB | A-Level | national | US-GPA | other
  grades jsonb,                                  -- normalized + raw
  tests jsonb,                                   -- SAT/ACT/IELTS/TOEFL/subjects
  activities jsonb,                              -- ECs, leadership, awards, projects
  target_schools text[],                         -- US school ids/names
  intended_major text,
  citizenship text,
  needs_aid boolean,
  updated_at timestamptz default now()
);
create index if not exists student_profiles_user_id_idx on student_profiles (user_id);

-- AI analyses (one per run; keep history so students see progress)
create table if not exists analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  input_snapshot jsonb not null,
  output jsonb not null,                         -- the validated analysis JSON (§7)
  created_at timestamptz default now()
);
create index if not exists analyses_user_id_idx on analyses (user_id, created_at desc);

-- ambassadors
create table if not exists ambassadors (
  user_id uuid primary key references auth.users on delete cascade,
  code text unique not null,
  country text,
  tier int default 0,
  signups int default 0,
  status text default 'active',
  created_at timestamptz default now()
);
create index if not exists ambassadors_code_idx on ambassadors (code);

-- universities (curated US dataset)
create table if not exists universities (
  id text primary key,
  name text not null,
  acceptance_rate numeric,
  sat_p25 int,
  sat_p75 int,
  notes_international text
);

-- lightweight event log (powers ambassador stats + admin metrics)
create table if not exists events (
  id bigint generated always as identity primary key,
  user_id uuid,
  type text not null,                            -- signup | analysis_run | share
  ref_code text,
  created_at timestamptz default now()
);
create index if not exists events_ref_code_idx on events (ref_code);
create index if not exists events_type_created_idx on events (type, created_at);

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------
alter table profiles          enable row level security;
alter table student_profiles  enable row level security;
alter table analyses          enable row level security;
alter table ambassadors       enable row level security;
alter table universities      enable row level security;
alter table events            enable row level security;

-- profiles: a user can read/insert/update only their own row.
drop policy if exists "profiles_select_own" on profiles;
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on profiles;
create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- student_profiles: own rows only.
drop policy if exists "sp_select_own" on student_profiles;
create policy "sp_select_own" on student_profiles
  for select using (auth.uid() = user_id);
drop policy if exists "sp_insert_own" on student_profiles;
create policy "sp_insert_own" on student_profiles
  for insert with check (auth.uid() = user_id);
drop policy if exists "sp_update_own" on student_profiles;
create policy "sp_update_own" on student_profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- analyses: own rows only. (Inserts happen server-side via service role.)
drop policy if exists "analyses_select_own" on analyses;
create policy "analyses_select_own" on analyses
  for select using (auth.uid() = user_id);
drop policy if exists "analyses_insert_own" on analyses;
create policy "analyses_insert_own" on analyses
  for insert with check (auth.uid() = user_id);

-- ambassadors: a user can read their own ambassador row.
drop policy if exists "amb_select_own" on ambassadors;
create policy "amb_select_own" on ambassadors
  for select using (auth.uid() = user_id);

-- universities: readable by any authenticated user (reference data).
drop policy if exists "uni_select_all" on universities;
create policy "uni_select_all" on universities
  for select using (auth.role() = 'authenticated');

-- events: a user can read events tied to their own user_id.
-- Ambassador aggregate reads + all writes go through the service role (server only),
-- which bypasses RLS. No general client INSERT policy is granted on purpose.
drop policy if exists "events_select_own" on events;
create policy "events_select_own" on events
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Aggregate helper for ambassador stats (signup count by ref_code).
-- SECURITY DEFINER so an ambassador can read just the count for their code
-- without exposing individual event rows.
-- ---------------------------------------------------------------------------
create or replace function signup_count_for_code(p_code text)
returns int
language sql
security definer
set search_path = public
as $$
  select count(*)::int from events where type = 'signup' and ref_code = p_code;
$$;
grant execute on function signup_count_for_code(text) to authenticated;
