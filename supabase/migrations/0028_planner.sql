-- 0028_planner.sql
-- The planner (backlog #17): the student's own tasks, and the one new state
-- that lets a commitment be observed between "said they would" and "did".
--
-- Apply manually in the Supabase SQL editor (no migration runner is wired up),
-- then run `npm run db:check`.

-- ── 1. `doing` ────────────────────────────────────────────────────────────────
--
-- opportunity_intents.status was planning | applied | dropped. The gap is the
-- one thing migration 0022 most wanted to see: we ask "when will you start?" —
-- the implementation-intention mechanic that whole table exists for — and then
-- had no way to record whether they started. On an olympiad with a three-month
-- deadline that is three months of silence between the intention and the act.
--
-- `applied` keeps its exact previous meaning, so every existing count on
-- /admin/intents is unchanged. This only adds a state between the two.
--
-- The constraint is dropped by its default Postgres name (<table>_<column>_check
-- for an inline column check in CREATE TABLE). If a database somehow carries it
-- under another name the DROP is a no-op and writes of 'doing' are rejected at
-- runtime — the app turns that into a readable error naming this migration
-- rather than a 500, and the board degrades to three columns.
alter table opportunity_intents
  drop constraint if exists opportunity_intents_status_check;

alter table opportunity_intents
  add constraint opportunity_intents_status_check
  check (status in ('planning', 'doing', 'applied', 'dropped'));

comment on column opportunity_intents.status is
  'planning = said they would | doing = started | applied = entered | dropped = changed their mind. Behavioural metrics read ''applied''.';

-- ── 2. The student's own tasks ────────────────────────────────────────────────
--
-- Deliberately NOT a copy of anything. A committed opportunity keeps its state
-- in opportunity_intents and its date in the catalog; this table holds only what
-- the student typed themselves. Two homes for one fact is how a card ends up
-- showing a deadline that was corrected months ago.
create table if not exists planner_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  title      text not null,
  note       text,
  -- Nullable on purpose: "write the personal statement" is a real task with no
  -- date, and forcing one would make the student invent a deadline that we would
  -- then render as though we stood behind it.
  due_date   date,
  status     text not null default 'todo'
             check (status in ('todo', 'doing', 'done', 'dropped')),
  -- An IN-APP path this task is about ('/guide/places/germany'), or null.
  -- Never an external URL: the catalog owns those, because `npm run test:links`
  -- is what keeps them alive and it only knows about the catalog.
  link_href  text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists planner_items_user_idx on planner_items (user_id);

alter table planner_items enable row level security;

drop policy if exists "pi_select_own" on planner_items;
create policy "pi_select_own" on planner_items
  for select using (auth.uid() = user_id);

drop policy if exists "pi_insert_own" on planner_items;
create policy "pi_insert_own" on planner_items
  for insert with check (auth.uid() = user_id);

drop policy if exists "pi_update_own" on planner_items;
create policy "pi_update_own" on planner_items
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "pi_delete_own" on planner_items;
create policy "pi_delete_own" on planner_items
  for delete using (auth.uid() = user_id);

-- Column-level grants. Migration 0008 locked table-wide privileges down, and a
-- missing grant here surfaces as a bare 42501 "permission denied for column"
-- that looks nothing like a permissions problem from the UI — that is the
-- profiles.full_name incident and migration 0012, and it is not repeating.
grant select, insert, update, delete on planner_items to authenticated;
