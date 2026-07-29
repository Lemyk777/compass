-- 0021_link_health.sql
-- Records whether each opportunity's official link actually loads.
--
-- WHY: a dead link is the most visible quality failure in the product — the
-- student clicks "Details" and gets a browser error (conradchallenge.org had
-- died of a TLS failure and we kept shipping it). The weekly sync-dates cron
-- already fetches every competition's page, so it can record link health for
-- free; the admin Opportunities page surfaces it so a rotted link is noticed
-- by us, not by a student.
--
-- Apply manually in the Supabase SQL editor (no migration runner is wired up).

ALTER TABLE competition_deadlines
  -- NULL = never checked yet.
  ADD COLUMN IF NOT EXISTS link_ok         BOOLEAN,
  ADD COLUMN IF NOT EXISTS link_checked_at TIMESTAMPTZ,
  -- Short reason when link_ok is false ("HTTP 404", "fetch failed", …).
  ADD COLUMN IF NOT EXISTS link_detail     TEXT;
