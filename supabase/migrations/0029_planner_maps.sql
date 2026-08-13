-- 0029_planner_maps.sql
-- Mind maps — the planner's third view, and the rest of backlog #17.
--
-- Apply manually in the Supabase SQL editor (no migration runner is wired up),
-- then run `npm run db:check`. Requires 0028 (planner_items) to be applied
-- first: "Send to plan" writes into that table.
--
-- WHAT IS NOT HERE, deliberately: x/y coordinates. We store the STRUCTURE — a
-- parent and a position among siblings — and compute the picture from it, so
-- one tree always draws one map. The value of a student's map is the branching,
-- not where a box sits; coordinates are the part that would rot, that would cost
-- a drag implementation the keyboard cannot use, and that would be unusable on
-- the phone most of our students are on. If placement is ever genuinely wanted,
-- the additive answer is two nullable OFFSET columns on top of the computed
-- position, not a switch to stored coordinates.

create table if not exists planner_map_nodes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  -- Every node of one map carries the same map_id, denormalised on purpose:
  -- with it, loading a whole map is one flat select; without it, the same read
  -- is a recursive CTE for no gain. The root is the node whose parent_id is null
  -- and whose map_id equals its own id, which makes "list my maps" a plain
  -- `where parent_id is null` rather than a second table.
  map_id     uuid not null,
  -- Self-referencing, and the cascade is load-bearing: deleting a branch is the
  -- database's job, not a recursive delete in application code that will one day
  -- be interrupted halfway and leave orphans.
  parent_id  uuid references planner_map_nodes (id) on delete cascade,
  label      text not null,
  note       text,
  -- An IN-APP path this node is about ('/guide/places/germany'), or null. Never
  -- an external URL: the catalog owns those, because `npm run test:links` is
  -- what keeps them alive and it only knows about the catalog.
  link_href  text,
  -- Order among siblings. There is no global ordering: a tree's shape is
  -- parent + position, and nothing else.
  position   int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- The two reads this table has: "all my maps" and "this whole map".
create index if not exists planner_map_nodes_map_idx
  on planner_map_nodes (user_id, map_id);
create index if not exists planner_map_nodes_roots_idx
  on planner_map_nodes (user_id)
  where parent_id is null;

alter table planner_map_nodes enable row level security;

drop policy if exists "pmn_select_own" on planner_map_nodes;
create policy "pmn_select_own" on planner_map_nodes
  for select using (auth.uid() = user_id);

drop policy if exists "pmn_insert_own" on planner_map_nodes;
create policy "pmn_insert_own" on planner_map_nodes
  for insert with check (auth.uid() = user_id);

drop policy if exists "pmn_update_own" on planner_map_nodes;
create policy "pmn_update_own" on planner_map_nodes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "pmn_delete_own" on planner_map_nodes;
create policy "pmn_delete_own" on planner_map_nodes
  for delete using (auth.uid() = user_id);

-- Column-level grants. Migration 0008 locked table-wide privileges down, and a
-- missing grant here surfaces as a bare 42501 "permission denied for column"
-- that looks nothing like a permissions problem from the UI — the
-- profiles.full_name incident and migration 0012.
grant select, insert, update, delete on planner_map_nodes to authenticated;
