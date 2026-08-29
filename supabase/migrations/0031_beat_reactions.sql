-- 0031_beat_reactions.sql
-- What a student reacted to — the ONLY new stored fact in this release.
--
-- Apply manually in the Supabase SQL editor (no migration runner is wired up),
-- then run `npm run db:check`.
--
-- WHY THIS IS STORED AND NOTHING ELSE IS. The thread's stage, the observation it
-- makes about a student and the move it offers are all DERIVED — from the
-- profile, from planner_path, from opportunity_intents, and from these rows. A
-- saved stage would be a second copy of something computable and would drift the
-- first time the ladder changed, which is the same argument that keeps the spine
-- a function and keeps `kind` off planner_path.
--
-- A reaction is the exception, and the only one: it is a fact about the person
-- that exists nowhere else and cannot be recomputed from anything.
--
-- WHAT IS NOT HERE, deliberately:
--
--   * No score, no axis, no suggested field. All three are computed by
--     `scoreBeats` from these rows plus the registry in lib/data/beats.ts.
--     Storing a score would freeze a student's result against a registry we
--     fully intend to keep editing.
--   * No pair id. A beat belongs to exactly one pair, in the registry, so a
--     stored pair would be a second copy of that.
--   * No profile, no type, no label. We do not type students. The engine
--     reports what they picked and never what they are — see the header of
--     lib/data/beats.ts for why that is a rule rather than a preference.
create table if not exists beat_reactions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  -- The beat's id from lib/data/beats.ts. Text rather than a foreign key: the
  -- registry is code, and a row whose beat has since been retired should stay
  -- readable rather than block anything.
  beat_id    text not null,
  -- 'picked' | 'passed' | 'unclear'. 'unclear' means "I don't get it" and is a
  -- first-class answer that contributes NO signal to scoring — it is also how
  -- we find out which beats are badly written, which is why it is recorded at
  -- all rather than simply ignored.
  reaction   text not null check (reaction in ('picked', 'passed', 'unclear')),
  created_at timestamptz not null default now(),
  -- Reacting to the same beat twice is a correction, not a second fact. The
  -- upsert in `recordReaction` relies on this.
  unique (user_id, beat_id)
);

create index if not exists beat_reactions_user_idx on beat_reactions (user_id);

alter table beat_reactions enable row level security;

drop policy if exists "br_select_own" on beat_reactions;
create policy "br_select_own" on beat_reactions
  for select using (auth.uid() = user_id);

drop policy if exists "br_insert_own" on beat_reactions;
create policy "br_insert_own" on beat_reactions
  for insert with check (auth.uid() = user_id);

drop policy if exists "br_update_own" on beat_reactions;
create policy "br_update_own" on beat_reactions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "br_delete_own" on beat_reactions;
create policy "br_delete_own" on beat_reactions
  for delete using (auth.uid() = user_id);

-- Column-level grants. Migration 0008 locked table-wide privileges down, and a
-- missing grant here surfaces as a bare 42501 "permission denied for column"
-- that looks nothing like a permissions problem from the UI — that is the
-- profiles.full_name incident and migration 0012, and it is not repeating.
grant select, insert, update, delete on beat_reactions to authenticated;
