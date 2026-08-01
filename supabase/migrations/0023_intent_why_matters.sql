-- 0023_intent_why_matters.sql
-- Adds the student's own one-line answer to "why does this matter to you?" on a
-- committed opportunity.
--
-- WHY: self-generated relevance beats told relevance. Our card blurbs currently
-- tell the student why a competition matters; the utility-value literature
-- (Hulleman & Harackiewicz and its randomized field replications) finds that the
-- student writing the reason themselves is what moves interest — largest for
-- exactly the weak-profile students Compass serves. It sits on top of the
-- implementation-intention already collected in 0022: first "when will you
-- start?", then, in their own words, "why".
--
-- Treated as a hypothesis to MEASURE, not a certainty — at least one online
-- replication found nothing. It is one nullable column precisely so it costs
-- almost nothing to add and can be read against `status = 'applied'` later.
--
-- Additive and safe to apply while the app is live: existing rows get null, and
-- the app already tolerates the column being absent (the read selects *, and the
-- write only touches this column when a student actually fills it in, falling
-- back cleanly on undefined_column if this migration has not run yet).
--
-- Apply manually in the Supabase SQL editor (no migration runner is wired up).

alter table opportunity_intents
  add column if not exists why_matters text;

-- Re-grant, same reasoning as 0022: a missing grant surfaces as a bare 42501
-- "permission denied for column" that looks nothing like a permissions bug from
-- the UI. `opportunity_intents` carries table-level grants from 0022 (which
-- cover columns added later), so this is idempotent belt-and-braces rather than
-- strictly required — kept because the profiles.full_name incident (0012) is
-- exactly what happens when this line is assumed unnecessary and skipped.
grant select, insert, update on opportunity_intents to authenticated;
