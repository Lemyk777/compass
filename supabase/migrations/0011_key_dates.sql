-- 0011_key_dates.sql
-- Creates reference tables for SAT test dates and competition/olympiad deadlines.
-- These power the Key Dates timeline on the student dashboard.
-- Seed data covers the 2026-27 admissions cycle.

-- ============================================================================
-- 1. sat_sittings — SAT test dates and registration deadlines
-- ============================================================================

CREATE TABLE sat_sittings (
  id            UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  test_date     DATE         NOT NULL,
  reg_deadline  DATE         NOT NULL,
  cycle         TEXT         NOT NULL DEFAULT '2026-27',
  created_at    TIMESTAMPTZ  DEFAULT now(),
  UNIQUE (test_date)
);

ALTER TABLE sat_sittings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access on sat_sittings"
  ON sat_sittings FOR SELECT
  USING (true);

CREATE POLICY "Admin write access on sat_sittings"
  ON sat_sittings FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================================================
-- 2. competition_deadlines — competition / olympiad metadata
-- ============================================================================

CREATE TABLE competition_deadlines (
  id            TEXT         PRIMARY KEY,
  name          TEXT         NOT NULL,
  fields        JSONB        NOT NULL,
  deadline      DATE         NOT NULL,
  event_window  TEXT         NOT NULL,
  level         TEXT         NOT NULL CHECK (level IN ('international', 'national', 'regional')),
  url           TEXT         NOT NULL,
  blurb         TEXT         NOT NULL,
  cycle         TEXT         NOT NULL DEFAULT '2026-27',
  updated_at    TIMESTAMPTZ  DEFAULT now()
);

ALTER TABLE competition_deadlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access on competition_deadlines"
  ON competition_deadlines FOR SELECT
  USING (true);

CREATE POLICY "Admin write access on competition_deadlines"
  ON competition_deadlines FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================================================
-- 3. Seed data — SAT sittings (2026-27 cycle, College Board verified)
-- ============================================================================

INSERT INTO sat_sittings (test_date, reg_deadline) VALUES
  ('2026-08-22', '2026-08-07'),
  ('2026-09-12', '2026-08-28'),
  ('2026-10-03', '2026-09-18'),
  ('2026-11-07', '2026-10-23'),
  ('2026-12-05', '2026-11-20'),
  ('2027-03-06', '2027-02-19'),
  ('2027-05-01', '2027-04-16'),
  ('2027-06-05', '2027-05-21');

-- ============================================================================
-- 4. Seed data — Competitions & olympiads (2026-27 cycle)
-- ============================================================================

INSERT INTO competition_deadlines (id, name, fields, deadline, event_window, level, url, blurb) VALUES
  (
    'amc',
    'AMC 10/12 (math)',
    '["computer_science", "engineering", "natural_sciences"]'::jsonb,
    '2026-10-28',
    'Contests Nov 5 & 13, 2026',
    'national',
    'https://maa.org/maa-invitational-competitions/',
    'Gateway to AIME/USAMO — the standard math-talent signal for STEM.'
  ),
  (
    'usaco',
    'USACO (competitive programming)',
    '["computer_science", "engineering"]'::jsonb,
    '2027-01-09',
    'Online contests Jan–Mar (no pre-registration)',
    'national',
    'https://usaco.org/',
    'Promote through Bronze→Silver→Gold to prove real CS ability.'
  ),
  (
    'isef',
    'Regeneron ISEF (research)',
    '["natural_sciences", "engineering", "medicine_health", "computer_science"]'::jsonb,
    '2027-02-01',
    'Regional fairs Feb–Mar, finals May 12–18, 2027',
    'international',
    'https://www.societyforscience.org/isef/',
    'Original research project — the strongest STEM spike you can build.'
  ),
  (
    'usabo',
    'USABO (biology olympiad)',
    '["medicine_health", "natural_sciences"]'::jsonb,
    '2026-11-15',
    'Register by mid-Nov; Open Exam in February',
    'national',
    'https://www.usabo-trc.org/',
    'Top biology signal for pre-med / life-science applicants.'
  ),
  (
    'decca',
    'DECA (business & marketing)',
    '["business_economics"]'::jsonb,
    '2026-11-15',
    'Regionals winter, ICDC Apr 17–20, 2027 (Anaheim)',
    'international',
    'https://www.deca.org/',
    'Case-based business competition — leadership + commercial sense.'
  ),
  (
    'econ-challenge',
    'National Economics Challenge',
    '["business_economics", "humanities_social"]'::jsonb,
    '2027-02-15',
    'State rounds spring',
    'national',
    'https://www.councilforeconed.org/national-economics-challenge/',
    'Team econ contest — a sharp signal for economics applicants.'
  ),
  (
    'john-locke',
    'John Locke Essay Prize',
    '["humanities_social", "law", "business_economics"]'::jsonb,
    '2027-05-31',
    'Register by Mar 31; submit by end of May',
    'international',
    'https://www.johnlockeinstitute.com/essay-competition',
    'Flagship essay prize for humanities, law, philosophy and econ.'
  ),
  (
    'scholastic',
    'Scholastic Art & Writing Awards',
    '["arts_design", "humanities_social"]'::jsonb,
    '2026-12-01',
    'Deadlines Dec–Jan by region',
    'national',
    'https://www.artandwriting.org/',
    'The most recognized awards for creative arts and writing.'
  ),
  (
    'mun',
    'Model UN conference',
    '["humanities_social", "law", "business_economics"]'::jsonb,
    '2026-10-01',
    'Conferences run year-round',
    'regional',
    'https://www.nmun.org/',
    'Diplomacy, public speaking and current-affairs depth.'
  );
