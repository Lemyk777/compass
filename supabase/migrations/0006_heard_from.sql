-- Compass — "How did you hear about us?" attribution survey (non-referral signups)
-- Run in the Supabase SQL editor (migrations are applied manually).

-- Where a non-referral user says they found Compass, and the ambassador code
-- they typed (if any). A valid code is also written to profiles.referred_by by
-- the onboarding action so it counts toward the ambassador, exactly like a
-- referral link.
alter table profiles add column if not exists heard_from text;
alter table profiles add column if not exists heard_from_code text;
