-- 0020_discovery.sql
-- Opportunity discovery pipeline: a moderation queue for auto-discovered
-- competitions + richer columns on competition_deadlines so approved rows
-- carry the full card data (category/tier/eligibility) that until now only
-- existed in the code registry.
--
-- Flow: the weekly /api/cron/discover run finds candidate competitions via
-- web search, verifies their deadline against the official page, and inserts
-- them here as `pending`. An admin reviews them at /admin/opportunities;
-- approving upserts the row into competition_deadlines, where the dashboard's
-- resolveCompetitions() already merges live-only rows into the student pool.
-- Truth-first: nothing reaches students without human approval, and an
-- unconfirmed date renders as "Dates not yet announced", never a countdown.
--
-- Apply manually in the Supabase SQL editor (no migration runner is wired up).

-- ============================================================================
-- 1. Extra card columns on competition_deadlines
-- ============================================================================
-- Nullable on purpose: rows synced from the code registry predate these
-- columns and the dashboard falls back to competitionTier()/Category()
-- defaults when they are absent.

ALTER TABLE competition_deadlines
  ADD COLUMN IF NOT EXISTS category    TEXT,
  ADD COLUMN IF NOT EXISTS tier        TEXT,
  ADD COLUMN IF NOT EXISTS eligibility TEXT,
  -- Geographic scope: NULL = global; an ISO-2 code ("KZ") marks a LOCAL
  -- opportunity, shown only to students whose profile country matches.
  ADD COLUMN IF NOT EXISTS region      TEXT,
  ADD COLUMN IF NOT EXISTS city        TEXT;

-- ============================================================================
-- 2. competition_candidates — the discovery moderation queue
-- ============================================================================

CREATE TABLE competition_candidates (
  id             TEXT         PRIMARY KEY,          -- slug, e.g. "conrad-challenge"
  name           TEXT         NOT NULL,
  url            TEXT         NOT NULL,
  fields         JSONB        NOT NULL,             -- FacultyValue[] or "all"
  level          TEXT         NOT NULL CHECK (level IN ('international', 'national', 'regional')),
  category       TEXT         NOT NULL DEFAULT 'competition',
  tier           TEXT         NOT NULL DEFAULT 'accessible',
  deadline       DATE,                              -- null = not yet announced
  event_window   TEXT         NOT NULL DEFAULT '',
  blurb          TEXT         NOT NULL DEFAULT '',
  eligibility    TEXT,
  -- TRUE only when the deadline was independently re-extracted from the
  -- official page and passed the guardrails (future, in-range).
  date_confirmed BOOLEAN      NOT NULL DEFAULT FALSE,
  -- How/why the date is (or is not) trusted — shown to the reviewing admin.
  date_evidence  TEXT         NOT NULL DEFAULT '',
  -- Where the candidate came from (search query used).
  source         TEXT         NOT NULL DEFAULT '',
  -- NULL = global candidate; ISO-2 code = local to that country (± city).
  region         TEXT,
  city           TEXT,
  status         TEXT         NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  discovered_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  reviewed_at    TIMESTAMPTZ,
  cycle          TEXT         NOT NULL DEFAULT '2026-27'
);

-- Admin-only surface. No public read: candidates are unreviewed and must not
-- leak to students. The cron + admin pages use the service-role client, which
-- bypasses RLS; the admin policy is belt-and-suspenders for direct access.
ALTER TABLE competition_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin access on competition_candidates"
  ON competition_candidates FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');
