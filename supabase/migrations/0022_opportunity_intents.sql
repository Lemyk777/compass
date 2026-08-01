-- 0022_opportunity_intents.sql
-- Records that a student decided to enter something, and when they will start.
--
-- WHY (two reasons, both load-bearing):
--
-- 1. Implementation intentions. Asking "when will you start?" the moment
--    someone commits is the best-evidenced cheap intervention there is —
--    d = 0.65 across 94 trials and 8,000+ participants (Gollwitzer & Sheeran).
--    Naming a concrete moment is what turns an intention into a behaviour.
--
-- 2. It is the ONLY behavioural metric this product can obtain. The whole
--    college-access nudge literature has one recurring lesson: engagement
--    metrics moved while behaviour did not. Campaigns reaching 800,000+
--    students produced real click-throughs and zero change in enrollment.
--    Clicks on "Details ↗" are exactly that illusion. Until a student can say
--    "I'm doing this", we cannot tell whether Opportunities has ever caused a
--    single entry — and every design decision downstream is guesswork.
--
-- One row per (student, opportunity). `opportunity_id` is the curated registry
-- id (lib/data/key-dates.ts) or a discovered one — deliberately a plain text
-- key with no foreign key, because the catalog lives in code, not in this DB,
-- and a retired id must not cascade-delete a student's record of what they did.
--
-- Apply manually in the Supabase SQL editor (no migration runner is wired up).

create table if not exists opportunity_intents (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users on delete cascade,
  opportunity_id text not null,
  -- planning → said they would do it | applied → said they actually entered
  -- | dropped → changed their mind. "dropped" is kept rather than deleted:
  -- knowing what students abandon is as informative as knowing what they enter.
  status         text not null default 'planning'
                 check (status in ('planning', 'applied', 'dropped')),
  -- The implementation intention, in the student's own words ("this weekend").
  start_when     text,
  -- Optional "where / how" half of the same intention.
  start_detail   text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now(),
  -- Lets the app upsert on (user, opportunity) instead of read-then-write.
  unique (user_id, opportunity_id)
);

create index if not exists opportunity_intents_user_id_idx
  on opportunity_intents (user_id);
-- Admin/metrics reads: "what is actually being entered, and what is dropped".
create index if not exists opportunity_intents_opportunity_idx
  on opportunity_intents (opportunity_id, status);

alter table opportunity_intents enable row level security;

drop policy if exists "oi_select_own" on opportunity_intents;
create policy "oi_select_own" on opportunity_intents
  for select using (auth.uid() = user_id);

drop policy if exists "oi_insert_own" on opportunity_intents;
create policy "oi_insert_own" on opportunity_intents
  for insert with check (auth.uid() = user_id);

drop policy if exists "oi_update_own" on opportunity_intents;
create policy "oi_update_own" on opportunity_intents
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "oi_delete_own" on opportunity_intents;
create policy "oi_delete_own" on opportunity_intents
  for delete using (auth.uid() = user_id);

-- Column-level grants. Migration 0008 locked table-wide privileges down, and a
-- missing grant here surfaces as a bare 42501 "permission denied for column"
-- that looks nothing like a permissions problem from the UI (see the
-- profiles.full_name incident and migration 0012).
grant select, insert, update, delete on opportunity_intents to authenticated;
