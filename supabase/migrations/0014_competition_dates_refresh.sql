-- 0014_competition_dates_refresh.sql
-- Corrects competition deadlines/windows that were hand-verified against the
-- official sources on 2026-06-27 and found to be off in the 0011 seed.
--
-- WHY THIS IS NEEDED: the dashboard treats the code registry (lib/data/key-dates.ts)
-- as the base but overlays the LIVE deadline + event_window from this table by id
-- (resolveCompetitions / mergeCompetitionMeta). So for the 9 originally-seeded
-- rows, the DB value wins over the corrected code value — these UPDATEs bring the
-- DB in line. The 15 newer competitions aren't in the DB yet, so they already
-- render from code; the weekly sync-dates cron will insert + refresh them.
--
-- Apply manually in the Supabase SQL editor (no migration runner is wired up).

-- AMC: early-bird registration is Oct 28; contests are Nov 5 & 13, 2026.
UPDATE competition_deadlines
SET deadline = '2026-10-28', event_window = 'Contests Nov 5 & 13, 2026'
WHERE id = 'amc';

-- USACO: 2026-27 season runs Jan–Mar (first contest Jan 9–12, 2027); no
-- pre-registration. The old 'Dec–Mar' window was a cycle early.
UPDATE competition_deadlines
SET deadline = '2027-01-09', event_window = 'Online contests Jan–Mar (no pre-registration)'
WHERE id = 'usaco';

-- USABO: school registration closes in mid-November; the Open Exam is in
-- February. The old Jan 15 deadline was the exam window, not the cutoff.
UPDATE competition_deadlines
SET deadline = '2026-11-15', event_window = 'Register by mid-Nov; Open Exam in February'
WHERE id = 'usabo';

-- John Locke: the main submission deadline moved to end of May (registration by
-- Mar 31). The old end-of-June date is stale.
UPDATE competition_deadlines
SET deadline = '2027-05-31', event_window = 'Register by Mar 31; submit by end of May'
WHERE id = 'john-locke';

-- Window-only refinements (dates were already correct).
UPDATE competition_deadlines
SET event_window = 'Regional fairs Feb–Mar, finals May 12–18, 2027'
WHERE id = 'isef';

UPDATE competition_deadlines
SET event_window = 'Regionals winter, ICDC Apr 17–20, 2027 (Anaheim)'
WHERE id = 'decca';
