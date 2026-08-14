-- 0030_planner_path.sql
-- The guide → plan join: what a student picked out of the guide.
--
-- Apply manually in the Supabase SQL editor (no migration runner is wired up),
-- then run `npm run db:check`.
--
-- WHY A TABLE AT ALL. The guide answered four questions about the world and the
-- plan held things with a date — and nothing in between recorded which of those
-- answers were the student's own. So the plan could not say "you were reading
-- about Germany", the guide could not say "this is already in your plan", and
-- the two read as separate products. `profiles.faculties` holds the eight
-- fields; there was no home for an area of work, a country, a city or a route
-- from home.
--
-- WHAT IS NOT HERE, deliberately:
--
--   * No `kind` column. A pick's kind is the prefix of its `ref`
--     ("place:germany"), the same argument as `mapNodeKind` deriving a node's
--     type from where it points and as the spine deriving the whole chain from
--     `FacultyValue`: a stored type is a second copy that can disagree with the
--     first.
--   * No rank, no score, no "why". A pick is a fact — you put this on your
--     plan — and everything else about it is derivable from the registries the
--     guide already owns. Anything stored here would be a snapshot of prose
--     that gets revised, which is the drift the planner refuses everywhere else.
--   * No status. What a student DOES about a pick lives in planner_items or
--     opportunity_intents. One fact, one home.
create table if not exists planner_path (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users on delete cascade,
  -- "<kind>:<id>" — 'work:data-and-ai', 'place:germany', 'hub:berlin',
  -- 'route:remote-work'. Composite on purpose: an area slug and a country id
  -- live in different registries and could collide, and the kind is the thing
  -- every reader needs first.
  ref      text not null,
  -- What the student saw when they picked it. Stored, unlike the kind, because
  -- it is what the plan renders before any registry is loaded — and because a
  -- row whose registry entry has since been removed should still read as
  -- something rather than as an id.
  label    text not null,
  -- The IN-APP page this pick is about. Never an external URL: the catalog owns
  -- those, because `npm run test:links` is what keeps them alive and it only
  -- knows about the catalog.
  href     text not null,
  added_at timestamptz not null default now(),
  -- Picking the same thing twice is not a second fact. The upsert in
  -- `addPick` relies on this, so re-adding is idempotent rather than an error.
  unique (user_id, ref)
);

create index if not exists planner_path_user_idx on planner_path (user_id);

alter table planner_path enable row level security;

drop policy if exists "pp_select_own" on planner_path;
create policy "pp_select_own" on planner_path
  for select using (auth.uid() = user_id);

drop policy if exists "pp_insert_own" on planner_path;
create policy "pp_insert_own" on planner_path
  for insert with check (auth.uid() = user_id);

drop policy if exists "pp_update_own" on planner_path;
create policy "pp_update_own" on planner_path
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "pp_delete_own" on planner_path;
create policy "pp_delete_own" on planner_path
  for delete using (auth.uid() = user_id);

-- Column-level grants. Migration 0008 locked table-wide privileges down, and a
-- missing grant here surfaces as a bare 42501 "permission denied for column"
-- that looks nothing like a permissions problem from the UI — that is the
-- profiles.full_name incident and migration 0012, and it is not repeating.
grant select, insert, update, delete on planner_path to authenticated;
