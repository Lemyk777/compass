-- 0024_partners.sql
-- Partner organisations that post opportunities under their OWN name.
--
-- WHY:
--   In Kazakhstan the authority is not us — it is Astana Hub, Shymkent Hub and
--   the handful of organisations students already trust. An opportunity carries
--   more weight when it says "posted by Astana Hub" than when it says "found by
--   Compass", and those organisations will only feed us if the credit is
--   visibly theirs. So a partner gets an account, a public profile, a logo on
--   every card it posts, and a verification tick.
--
-- WHAT THE TICK MEANS (it is a factual claim, so it has exactly one meaning):
--   "We confirmed this account belongs to that organisation, and this
--   opportunity was posted from it." Nothing more — it is NOT a quality
--   endorsement of the contest itself, and it never travels to a row we posted
--   on someone's behalf.
--
-- TRUST MODEL:
--   Trust is granted ONCE, at the organisation level: apply → an admin approves
--   and verifies. After that the partner publishes instantly, with no per-post
--   queue — which is the point of a partnership. The safety net is a kill
--   switch rather than a gate: an admin can unpublish a single post
--   (competition_deadlines.published = false) or suspend the whole partner
--   (partners.status = 'suspended'), and both take effect on the next read.
--
-- Apply MANUALLY in the Supabase SQL editor (no migration runner is wired up).

-- ============================================================================
-- 1. partners — one row per organisation
-- ============================================================================

create table if not exists partners (
  -- Slug, and the public URL: /partners/astana-hub. Also the prefix of every
  -- opportunity id this partner posts, so ownership is legible in the data.
  id             text primary key,
  name           text not null,
  -- The account that posts as this organisation. Set at application time; a
  -- deleted user leaves the organisation and its posts intact.
  user_id        uuid unique references auth.users on delete set null,
  -- Either a site-relative path ("/partners/astana-hub.svg", committed to
  -- /public) or an absolute https URL. Absent → the UI renders a monogram, and
  -- never a broken image.
  logo_url       text,
  website        text,
  about          text not null default '',
  -- ISO-2. Defaults the `region` of everything they post, which is what keeps
  -- an Astana hackathon on Kazakh students' lists and off everyone else's.
  country        text,
  city           text,
  contact_email  text,
  -- pending   → applied, cannot post yet
  -- active    → can post, posts go live immediately
  -- suspended → account kept, everything it posted is hidden
  -- rejected  → application declined
  status         text not null default 'pending'
                 check (status in ('pending', 'active', 'suspended', 'rejected')),
  -- The tick. Only ever set by an admin (service role); nothing in the app
  -- writes it from a partner session.
  verified_at    timestamptz,
  verified_by    uuid references auth.users on delete set null,
  -- What the applicant told us (their case for being listed), and what the
  -- reviewing admin wrote back. Both are shown to the applicant.
  applied_note   text not null default '',
  review_note    text not null default '',
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

create index if not exists partners_status_idx on partners (status);

alter table partners enable row level security;

-- Students and anonymous visitors read ACTIVE partners only: a pending
-- applicant is not a partner, and a suspended one must disappear from the
-- cards it posted. Nothing else is public.
drop policy if exists "partners_select_active" on partners;
create policy "partners_select_active" on partners
  for select using (status = 'active');

-- An applicant can always see their own row — that is how they learn whether
-- the application was approved, and read the reviewer's note.
drop policy if exists "partners_select_own" on partners;
create policy "partners_select_own" on partners
  for select using (auth.uid() = user_id);

-- NO insert/update/delete policy on purpose. Every write (apply, approve,
-- verify, suspend, edit profile) goes through a server action that checks the
-- caller first and then writes with the service role, which bypasses RLS.
-- Without a policy, RLS denies client writes outright — so `status` and
-- `verified_at` cannot be set from a browser even with the anon key in hand.
-- (Same reasoning as migration 0008 for profiles.role.)
revoke insert, update, delete on public.partners from anon, authenticated;

-- ============================================================================
-- 2. competition_deadlines — partner attribution + the takedown switch
-- ============================================================================
-- The student-facing pool already merges live rows from this table
-- (resolveCompetitions in lib/data/key-dates.ts), so a partner post is just a
-- row here with a partner_id. No second catalog, no second renderer.

alter table competition_deadlines
  add column if not exists partner_id  text references partners(id) on delete set null,
  -- The kill switch. Existing rows default to visible; false hides a post from
  -- every surface without deleting what the partner wrote.
  add column if not exists published   boolean not null default true,
  -- Cost has been a first-class field on the CARD since the catalog was
  -- curated in code, but never existed as a column — so a live-only row could
  -- only ever render "we haven't verified the cost". A partner knows exactly
  -- what their own event costs, so they state it.
  add column if not exists cost        text,
  add column if not exists cost_detail text,
  -- Rolling / self-paced: there is no deadline to miss, and saying "dates not
  -- announced" about one is not caution, it is false.
  add column if not exists always_open boolean not null default false,
  add column if not exists posted_at   timestamptz;

create index if not exists competition_deadlines_partner_idx
  on competition_deadlines (partner_id);

-- Tighten the public read: an unpublished row (taken down, or from a suspended
-- partner) must not be readable through PostgREST either. The partner console
-- and the admin queue read their own drafts with the service role instead.
drop policy if exists "Public read access on competition_deadlines" on competition_deadlines;
create policy "Public read access on competition_deadlines"
  on competition_deadlines for select
  using (published is not false);

-- Column-level grants: table privileges are locked down (migration 0008), and
-- a missing grant surfaces as a bare 42501 that looks nothing like a
-- permissions problem. Reads only — every partner write is service-role.
grant select on public.partners to anon, authenticated;
