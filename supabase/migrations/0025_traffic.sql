-- 0025_traffic.sql
-- Site traffic: who arrives, how long they stay, whether they come back.
--
-- WHY THIS TABLE AND NOT `events`:
--
-- `events` (0001) is a log of things a SIGNED-IN user did — it is keyed by
-- user_id and every row it holds is about someone who already has an account.
-- That answers "what did our students do" and cannot answer the question the
-- admin page actually needs: how many people reached the site at all, and how
-- many of those never became a row in `profiles`. With ~180 signups and no idea
-- what the denominator is, every conversion number on /admin is a ratio with an
-- unknown bottom half. This table is the bottom half.
--
-- WHAT IS AND ISN'T STORED:
--
--   visitor_id   a random uuid in a first-party cookie. Not derived from an IP,
--                a fingerprint, or anything about the person. Clearing cookies
--                makes someone a new visitor, and that is the intended
--                trade-off — we would rather undercount returns than identify
--                anyone.
--   path         pathname ONLY. The query string is dropped before the row is
--                written (app/api/track/route.ts), so a token, an email in a
--                magic link, or a `?ref=` code can never land here.
--   referrer     the external hostname, never the full URL.
--   country      the 2-letter code the CDN already attached to the request. No
--                IP is stored anywhere, at any point.
--
-- Apply manually in the Supabase SQL editor (no migration runner is wired up),
-- then run `npm run db:check`.

create table if not exists page_views (
  id          bigint generated always as identity primary key,

  -- Stable per browser (1 year cookie) — this is what makes "returned" answerable.
  visitor_id  uuid not null,
  -- Rolls over after 30 minutes of inactivity — this is what makes "a visit" a
  -- thing with a duration rather than a pile of disconnected page loads.
  session_id  uuid not null,

  -- Set only when the view happened while signed in. `on delete set null`, not
  -- cascade: deleting an account must not silently rewrite history and make
  -- past traffic disappear from the totals.
  user_id     uuid references auth.users on delete set null,

  path        text not null,
  referrer    text,                -- external hostname; null = direct/internal
  country     text,                -- 2-letter, from the CDN header
  device      text check (device in ('mobile', 'tablet', 'desktop')),

  -- Milliseconds the page was actually open, sent by a beacon when the visitor
  -- leaves. Nullable on purpose: a row is written the moment a page opens, so
  -- the view is never lost if the beacon is blocked or the tab is killed. A
  -- null here means "unknown", not "zero" — the summary treats it that way.
  dwell_ms    int,

  created_at  timestamptz not null default now()
);

-- The three shapes every query on /admin/traffic takes.
create index if not exists page_views_created_idx
  on page_views (created_at desc);
create index if not exists page_views_visitor_idx
  on page_views (visitor_id, created_at);
create index if not exists page_views_session_idx
  on page_views (session_id);

-- ---------------------------------------------------------------------------
-- Access: nobody but the service role. RLS on with NO policies means every
-- anon/authenticated read and write is denied by default; the service-role
-- client (lib/supabase/admin.ts) bypasses RLS and is the only writer (the
-- /api/track handler) and the only reader (/admin/traffic).
--
-- This is deliberately stricter than the other tables. There is no "own rows"
-- policy because a visitor has no account, so "own" has no meaning — and a
-- readable traffic log would let any logged-in user enumerate what everyone
-- else looks at.
-- ---------------------------------------------------------------------------
alter table page_views enable row level security;

revoke all on page_views from anon, authenticated;

-- Housekeeping: raw rows accumulate forever otherwise. Nothing on this schedule
-- is wired up — run it by hand, or add it to a cron route, once the table has
-- enough history to be worth trimming:
--
--   delete from page_views where created_at < now() - interval '180 days';
