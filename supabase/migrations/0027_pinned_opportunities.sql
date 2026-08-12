-- Pinning: one opportunity above everything else on a student's list.
--
-- The matching engine derives its whole order from the student's own profile
-- (fit, then whether the date is confirmed, then how soon it closes). This is
-- the single editorial override on top of that, for the case the ordering
-- cannot express: something happening imminently that we want seen the moment
-- the page opens, usually because we know about it before any signal does.
--
-- It reorders only. Eligibility still decides whether a row is on the list at
-- all — a pinned opportunity a student cannot enter is filtered out exactly like
-- any other, because "pinned" is about order and eligibility is about truth.
--
-- The curated catalog carries the same flag in TypeScript (Competition.pinned),
-- so a live row and a curated row sort identically and nothing has to know which
-- one it is looking at.

alter table public.competition_deadlines
  add column if not exists pinned boolean not null default false;

-- Partial: almost every row is false, and the only query that reads this wants
-- the handful that are true.
create index if not exists competition_deadlines_pinned_idx
  on public.competition_deadlines (pinned)
  where pinned;

comment on column public.competition_deadlines.pinned is
  'Editorial override — sorts above fit and deadline. Reorders only; never bypasses eligibility. Keep to one at a time.';
