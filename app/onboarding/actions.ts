"use server";

// NOTE: a "use server" file may export ONLY async functions. The intake schema,
// the SaveResult type and the error helper therefore live in ./schema (a plain
// module). Re-exporting or defining the schema object here breaks the production
// build with "A 'use server' file can only export async functions, found object".

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { StudentProfileInput } from "@/lib/types";
import { creditSurveyReferral } from "@/lib/auth/provision";
import { inputSchema, describeIssue, type SaveResult } from "./schema";

// Valid onboarding step keys — guards the events.type value against junk.
// Redesigned intake sections, plus the legacy keys so historical events stay valid.
const ONBOARDING_STEPS = new Set([
  "general", "academics", "activities", "awards", "budget",
  "origin", "destinations", "faculties", "grades", "tests",
  "honors", "us", "it", "hk", "review",
]);

/**
 * Funnel instrumentation: record that the signed-in user reached an onboarding
 * step, so /admin can see WHERE users drop off (not just that they did). The step
 * is encoded in the event `type` ("onboarding_step:<key>") to avoid a schema
 * migration — events already has a (type, created_at) index. Best-effort: never
 * throws, so a logging hiccup can never break the onboarding flow. Written with
 * the service role, matching how signup / analysis_run events are recorded.
 */
export async function logOnboardingStep(step: string): Promise<void> {
  if (!ONBOARDING_STEPS.has(step)) return;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await createAdminClient()
      .from("events")
      .insert({ user_id: user.id, type: `onboarding_step:${step}` });
  } catch (e) {
    console.error("logOnboardingStep failed", e);
  }
}

export async function saveProfile(
  input: StudentProfileInput
): Promise<SaveResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: describeIssue(parsed.error) };
  }
  const data = parsed.data;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please log in again." };

  // Keep the origin country (+ name + attribution survey) on the identity profile.
  const profileUpdate: Record<string, unknown> = { country: data.country };
  if (data.full_name) profileUpdate.full_name = data.full_name;
  if (data.heard_from) profileUpdate.heard_from = data.heard_from;
  if (data.heard_from_code) profileUpdate.heard_from_code = data.heard_from_code;

  let { error: profileErr } = await supabase
    .from("profiles")
    .update(profileUpdate)
    .eq("id", user.id);
  // Safety net: the broader update can be rejected either because newer columns
  // aren't migrated yet (42703 / PGRST204 — run 0006_heard_from.sql) or because
  // the authenticated role lacks a column-level UPDATE grant on full_name /
  // heard_from* (42501 "permission denied for column" — migration 0008 locked
  // profiles down to country + heard_from*; run 0012_grant_full_name.sql so the
  // student's own name can be saved). Either way, retry with the always-present,
  // always-granted country alone so onboarding can never hard-fail on this drift.
  if (profileErr && ["42703", "PGRST204", "42501"].includes(profileErr.code ?? "")) {
    ({ error: profileErr } = await supabase
      .from("profiles")
      .update({ country: data.country })
      .eq("id", user.id));
  }
  if (profileErr) return { ok: false, error: "Could not save. Please retry." };

  // If they said they heard from an ambassador and gave a code, credit that
  // ambassador the same as a referral link. Best-effort — never block the save.
  if (data.heard_from === "ambassador" && data.heard_from_code) {
    try {
      await creditSurveyReferral(user.id, data.heard_from_code);
    } catch (e) {
      console.error("creditSurveyReferral failed", e);
    }
  }

  const row = {
    user_id: user.id,
    curriculum: data.curriculum,
    grades: data.grades,
    tests: data.tests,
    activities: data.activities,
    honors: data.honors,
    destinations: data.destinations,
    faculties: data.faculties,
    graduation_year: data.graduation_year ?? null,
    target_schools: data.target_schools,
    intended_major: data.intended_major,
    citizenship: data.citizenship,
    school_name: data.school_name ?? null,
    budget_annual_usd: data.budget_annual_usd ?? null,
    needs_aid: data.needs_aid,
    // Keep the legacy include_italy column in sync for any old readers.
    include_italy: data.destinations.includes("IT"),
    italy_programs: data.italy_programs,
    italy_family_income: data.italy_family_income ?? null,
    hk_programs: data.hk_programs,
    hk_grade_status: data.hk_grade_status ?? null,
    updated_at: new Date().toISOString(),
  };

  // One active intake per user: update the existing row, or insert the first.
  const { data: existing } = await supabase
    .from("student_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const write = (r: Record<string, unknown>) =>
    existing
      ? supabase.from("student_profiles").update(r).eq("id", existing.id)
      : supabase.from("student_profiles").insert(r);

  let { error: writeErr } = await write(row);

  // Schema-drift safety net: if the database is missing the Hong Kong columns
  // (migration 0005 not applied yet), Postgres rejects the entire write
  // (42703 / PostgREST PGRST204). Retry without the HK fields so core US/Italy
  // profiles still save instead of the product going down. Apply migration 0005
  // to persist Hong Kong selections.
  if (writeErr && (writeErr.code === "42703" || writeErr.code === "PGRST204")) {
    const safeRow: Record<string, unknown> = { ...row };
    delete safeRow.hk_programs;
    delete safeRow.hk_grade_status;
    // Redesigned-intake columns (migration 0009) may also be missing.
    delete safeRow.school_name;
    delete safeRow.budget_annual_usd;
    // graduation_year (migration 0010) may not be applied yet.
    delete safeRow.graduation_year;
    console.warn(
      "student_profiles is missing newer columns — saving without them. " +
        "Run migrations 0005_hong_kong.sql, 0009_onboarding_extras.sql, 0010_graduation_year.sql.",
      writeErr.message
    );
    ({ error: writeErr } = await write(safeRow));
  }

  if (writeErr) return { ok: false, error: "Could not save your profile." };

  try {
    revalidatePath("/dashboard");
  } catch (e) {
    // Ignore cache revalidation errors during offline CLI tests
  }
  return { ok: true };
}
