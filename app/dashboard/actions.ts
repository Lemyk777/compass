"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { UNIVERSITIES } from "@/lib/data/universities";
import { ITALIAN_PROGRAMS } from "@/lib/data/italian-universities";
import { HK_PROGRAMS } from "@/lib/data/hk-universities";
import { UAE_PROGRAMS } from "@/lib/data/uae-universities";
import { KOREA_PROGRAMS } from "@/lib/data/korea-universities";
import { normalizeDestinations } from "@/lib/types";
import { LIMITS } from "@/lib/limits";
import {
  cleanIntentText,
  isIntentStatus,
  type IntentStatus,
} from "@/lib/data/intents";

export type SaveResult = { ok: true } | { ok: false; error: string };

// Fetch the caller's profile id + current destinations, ensuring `code` is among
// them so the matching analysis pathway runs. Shared by every per-country list
// save below. Returns the row id and the merged destination list, or an error.
async function profileForCountryList(
  code: "US" | "IT" | "HK" | "AE" | "KR"
): Promise<
  | { ok: true; id: string; destinations: string[] }
  | { ok: false; error: string }
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please log in again." };

  const { data: sp } = await supabase
    .from("student_profiles")
    .select("id, destinations, include_italy")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!sp) return { ok: false, error: "Complete your profile first." };

  const destinations = Array.from(
    new Set([...normalizeDestinations(sp.destinations, sp.include_italy), code])
  );
  return { ok: true, id: sp.id as string, destinations };
}

// Persist the student's US college list (target_schools). Validates names against
// our dataset, caps the count, and ensures "US" is in the destinations so the
// analysis produces US odds. The actual analysis is triggered separately by the
// client (POST /api/analyze) right after this resolves.
export async function saveCollegeList(schools: string[]): Promise<SaveResult> {
  const valid = new Set(UNIVERSITIES.map((u) => u.name));
  const cleaned = Array.from(
    new Set((schools ?? []).filter((s) => valid.has(s)))
  ).slice(0, LIMITS.targetSchools);

  if (cleaned.length === 0) {
    return { ok: false, error: "Pick at least one university." };
  }

  const prof = await profileForCountryList("US");
  if (!prof.ok) return prof;

  const supabase = createClient();
  const { error } = await supabase
    .from("student_profiles")
    .update({
      target_schools: cleaned,
      destinations: prof.destinations,
      include_italy: prof.destinations.includes("IT"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", prof.id);

  if (error) return { ok: false, error: "Could not save your college list." };

  try {
    revalidatePath("/dashboard");
  } catch {
    // ignore cache revalidation errors
  }
  return { ok: true };
}

// Persist the student's Italy program list (italy_programs) plus the optional
// family income the DSU aid estimate uses. Validates ids against our dataset,
// caps the count, and ensures "IT" is in the destinations so the analysis runs
// the Italian pathway. Re-analysis is triggered by the client afterwards.
export async function saveItalyList(
  programIds: string[],
  familyIncome?: number
): Promise<SaveResult> {
  const valid = new Set(ITALIAN_PROGRAMS.map((p) => p.id));
  const cleaned = Array.from(
    new Set((programIds ?? []).filter((id) => valid.has(id)))
  ).slice(0, LIMITS.italyPrograms);

  if (cleaned.length === 0) {
    return { ok: false, error: "Pick at least one program." };
  }

  const prof = await profileForCountryList("IT");
  if (!prof.ok) return prof;

  const income =
    typeof familyIncome === "number" && Number.isFinite(familyIncome) && familyIncome >= 0
      ? Math.round(familyIncome)
      : null;

  const supabase = createClient();
  const { error } = await supabase
    .from("student_profiles")
    .update({
      italy_programs: cleaned,
      italy_family_income: income,
      destinations: prof.destinations,
      include_italy: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", prof.id);

  if (error) return { ok: false, error: "Could not save your Italy list." };

  try {
    revalidatePath("/dashboard");
  } catch {
    // ignore cache revalidation errors
  }
  return { ok: true };
}

// Persist the student's Hong Kong program list (hk_programs) plus whether their
// grades are predicted or achieved (drives the conditional-offer logic).
// Validates ids, caps the count, and ensures "HK" is in the destinations.
export async function saveHkList(
  programIds: string[],
  gradeStatus: "predicted" | "achieved"
): Promise<SaveResult> {
  const valid = new Set(HK_PROGRAMS.map((p) => p.id));
  const cleaned = Array.from(
    new Set((programIds ?? []).filter((id) => valid.has(id)))
  ).slice(0, LIMITS.hkPrograms);

  if (cleaned.length === 0) {
    return { ok: false, error: "Pick at least one program." };
  }

  const prof = await profileForCountryList("HK");
  if (!prof.ok) return prof;

  const supabase = createClient();
  const { error } = await supabase
    .from("student_profiles")
    .update({
      hk_programs: cleaned,
      hk_grade_status: gradeStatus === "achieved" ? "achieved" : "predicted",
      destinations: prof.destinations,
      updated_at: new Date().toISOString(),
    })
    .eq("id", prof.id);

  if (error) {
    // The Hong Kong columns ship in migration 0005 — surface an actionable
    // message instead of a generic failure if the DB hasn't been migrated.
    if (error.code === "42703" || error.code === "PGRST204") {
      return {
        ok: false,
        error: "Hong Kong isn't enabled on this database yet. Apply migration 0005_hong_kong.sql.",
      };
    }
    return { ok: false, error: "Could not save your Hong Kong list." };
  }

  try {
    revalidatePath("/dashboard");
  } catch {
    // ignore cache revalidation errors
  }
  return { ok: true };
}

// Persist the student's UAE program list (uae_programs) plus whether their grades
// are predicted or achieved (drives the conditional-offer logic). Validates ids,
// caps the count, and ensures "AE" is in the destinations so the UAE pathway runs.
export async function saveUaeList(
  programIds: string[],
  gradeStatus: "predicted" | "achieved"
): Promise<SaveResult> {
  const valid = new Set(UAE_PROGRAMS.map((p) => p.id));
  const cleaned = Array.from(
    new Set((programIds ?? []).filter((id) => valid.has(id)))
  ).slice(0, LIMITS.uaePrograms);

  if (cleaned.length === 0) {
    return { ok: false, error: "Pick at least one program." };
  }

  const prof = await profileForCountryList("AE");
  if (!prof.ok) return prof;

  const supabase = createClient();
  const { error } = await supabase
    .from("student_profiles")
    .update({
      uae_programs: cleaned,
      uae_grade_status: gradeStatus === "achieved" ? "achieved" : "predicted",
      destinations: prof.destinations,
      updated_at: new Date().toISOString(),
    })
    .eq("id", prof.id);

  if (error) {
    // The UAE columns ship in migration 0016 — surface an actionable message
    // instead of a generic failure if the DB hasn't been migrated.
    if (error.code === "42703" || error.code === "PGRST204") {
      return {
        ok: false,
        error: "UAE isn't enabled on this database yet. Apply migration 0016_uae.sql.",
      };
    }
    return { ok: false, error: "Could not save your UAE list." };
  }

  try {
    revalidatePath("/dashboard");
  } catch {
    // ignore cache revalidation errors
  }
  return { ok: true };
}

// Persist the student's Korea program list (kr_programs) plus whether their
// grades are predicted or achieved (drives the conditional-offer logic) and the
// TOPIK level they hold (the decisive language gate for Korean-taught programs).
// Validates ids, caps the count, and ensures "KR" is in the destinations so the
// Korea pathway runs.
export async function saveKoreaList(
  programIds: string[],
  gradeStatus: "predicted" | "achieved",
  topikLevel?: number
): Promise<SaveResult> {
  const valid = new Set(KOREA_PROGRAMS.map((p) => p.id));
  const cleaned = Array.from(
    new Set((programIds ?? []).filter((id) => valid.has(id)))
  ).slice(0, LIMITS.krPrograms);

  if (cleaned.length === 0) {
    return { ok: false, error: "Pick at least one program." };
  }

  const topik =
    topikLevel != null && Number.isInteger(topikLevel) && topikLevel >= 1 && topikLevel <= 6
      ? topikLevel
      : null;

  const prof = await profileForCountryList("KR");
  if (!prof.ok) return prof;

  const supabase = createClient();
  const { error } = await supabase
    .from("student_profiles")
    .update({
      kr_programs: cleaned,
      kr_grade_status: gradeStatus === "achieved" ? "achieved" : "predicted",
      kr_topik_level: topik,
      destinations: prof.destinations,
      updated_at: new Date().toISOString(),
    })
    .eq("id", prof.id);

  if (error) {
    // The Korea columns ship in migration 0017 — surface an actionable message
    // instead of a generic failure if the DB hasn't been migrated.
    if (error.code === "42703" || error.code === "PGRST204") {
      return {
        ok: false,
        error: "South Korea isn't enabled on this database yet. Apply migration 0017_korea.sql.",
      };
    }
    return { ok: false, error: "Could not save your Korea list." };
  }

  try {
    revalidatePath("/dashboard");
  } catch {
    // ignore cache revalidation errors
  }
  return { ok: true };
}

/**
 * Save just the student's graduation year.
 *
 * 44% of signups completed no part of the intake, and every one of them also
 * never ran an analysis — they hit the seven-screen form and left. Without a
 * graduation year we cannot apply a single age or grade rule, so those users
 * were being shown the whole catalog with no filtering at all: the worst
 * possible screen given to the people who trusted us least.
 *
 * This is the one-question version. Asked inline, answered in a tap, saved
 * without ever opening the intake — the evidence on hassle costs is consistent
 * that the form itself is the thing standing between them and any value.
 */
export async function saveGraduationYear(year: number): Promise<SaveResult> {
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return { ok: false, error: "That doesn't look like a graduation year." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please log in again." };

  // student_profiles has no unique constraint on user_id, so upsert() can't be
  // used — look the row up and insert or update explicitly.
  const { data: existing } = await supabase
    .from("student_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = existing
    ? await supabase
        .from("student_profiles")
        .update({ graduation_year: year })
        .eq("id", existing.id)
    : await supabase
        .from("student_profiles")
        .insert({ user_id: user.id, graduation_year: year });

  if (error) {
    if (error.code === "42703" || error.code === "PGRST204") {
      return {
        ok: false,
        error: "Graduation year isn't enabled on this database yet. Apply migration 0010_graduation_year.sql.",
      };
    }
    return { ok: false, error: "Could not save your year." };
  }

  try {
    revalidatePath("/dashboard");
  } catch {
    // ignore cache revalidation errors
  }
  return { ok: true };
}

// ── Opportunity intents ──────────────────────────────────────────────────────
// "I'm doing this" plus the moment they'll start. See migration 0022 for why
// this exists: it is both the implementation-intention mechanic (d = 0.65) and
// the only behavioural signal this product can collect. Everything else we
// measure is a click, and clicks are what convinced an entire research
// literature that nudges worked when they did not.

function intentTableMissing(code?: string): boolean {
  // 42P01 = undefined_table, PGRST205 = PostgREST can't find it in the schema
  // cache. Both mean migration 0022 has not been applied yet.
  return code === "42P01" || code === "PGRST205";
}

const INTENT_MIGRATION_HINT =
  "Saving your plans isn't enabled on this database yet. Apply migration 0022_opportunity_intents.sql.";

/**
 * Record (or update) that the student intends to enter an opportunity, with the
 * concrete moment they said they'd start. Upserts on (user, opportunity), so
 * changing your mind about the timing is the same call.
 */
export async function saveOpportunityIntent(input: {
  opportunityId: string;
  status?: IntentStatus;
  startWhen?: string | null;
  startDetail?: string | null;
}): Promise<SaveResult> {
  const opportunityId = input.opportunityId?.trim();
  if (!opportunityId || opportunityId.length > 120) {
    return { ok: false, error: "Unknown opportunity." };
  }
  const status: IntentStatus = isIntentStatus(input.status)
    ? input.status
    : "planning";

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please log in again." };

  const { error } = await supabase.from("opportunity_intents").upsert(
    {
      user_id: user.id,
      opportunity_id: opportunityId,
      status,
      start_when: cleanIntentText(input.startWhen),
      start_detail: cleanIntentText(input.startDetail),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,opportunity_id" }
  );

  if (error) {
    if (intentTableMissing(error.code)) {
      return { ok: false, error: INTENT_MIGRATION_HINT };
    }
    return { ok: false, error: "Could not save that. Try again." };
  }

  try {
    revalidatePath("/dashboard/opportunities");
  } catch {
    // ignore cache revalidation errors
  }
  return { ok: true };
}

/** Remove an intent entirely (the student never meant to commit). */
export async function clearOpportunityIntent(
  opportunityId: string
): Promise<SaveResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please log in again." };

  const { error } = await supabase
    .from("opportunity_intents")
    .delete()
    .eq("user_id", user.id)
    .eq("opportunity_id", opportunityId);

  if (error) {
    if (intentTableMissing(error.code)) {
      return { ok: false, error: INTENT_MIGRATION_HINT };
    }
    return { ok: false, error: "Could not update that. Try again." };
  }

  try {
    revalidatePath("/dashboard/opportunities");
  } catch {
    // ignore cache revalidation errors
  }
  return { ok: true };
}
