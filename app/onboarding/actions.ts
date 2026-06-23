"use server";

// NOTE: a "use server" file may export ONLY async functions. The intake schema,
// the SaveResult type and the error helper therefore live in ./schema (a plain
// module). Re-exporting or defining the schema object here breaks the production
// build with "A 'use server' file can only export async functions, found object".

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { StudentProfileInput } from "@/lib/types";
import { inputSchema, describeIssue, type SaveResult } from "./schema";

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

  // Keep the origin country on the identity profile.
  const { error: profileErr } = await supabase
    .from("profiles")
    .update({ country: data.country })
    .eq("id", user.id);
  if (profileErr) return { ok: false, error: "Could not save. Please retry." };

  const row = {
    user_id: user.id,
    curriculum: data.curriculum,
    grades: data.grades,
    tests: data.tests,
    activities: data.activities,
    honors: data.honors,
    destinations: data.destinations,
    faculties: data.faculties,
    target_schools: data.target_schools,
    intended_major: data.intended_major,
    citizenship: data.citizenship,
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
    console.warn(
      "student_profiles is missing the Hong Kong columns — saving without them. " +
        "Run supabase/migrations/0005_hong_kong.sql.",
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
