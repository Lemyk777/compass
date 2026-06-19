"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { LIMITS } from "@/lib/limits";
import type { StudentProfileInput } from "@/lib/types";

// Bounds (LIMITS) are enforced here so an oversized profile can never be stored
// and later overwhelm the analysis. The UI mirrors these caps for good UX.
const inputSchema = z.object({
  country: z.string().trim().min(1, "Tell us your country.").max(LIMITS.shortText),
  curriculum: z.enum(["IB", "A-Level", "national", "US-GPA", "other"], {
    errorMap: () => ({ message: "Pick your curriculum." }),
  }),
  grades: z.object({
    raw: z.string().trim().min(1, "Add your grades.").max(LIMITS.grades),
    ib_total: z.number().optional(),
    gpa: z.number().optional(),
    national_percent: z.number().optional(),
  }),
  tests: z.object({
    SAT: z.number().optional(),
    ACT: z.number().optional(),
    IELTS: z.number().optional(),
    TOEFL: z.number().optional(),
    subjects: z.string().max(LIMITS.subjects).optional(),
  }),
  // Common App activities (up to 10), validated against the same caps the UI uses.
  activities: z
    .array(
      z.object({
        type: z.string().max(60).optional(),
        position: z.string().trim().max(LIMITS.activityPosition),
        organization: z.string().trim().max(LIMITS.activityOrganization).optional(),
        description: z.string().trim().max(LIMITS.activityDescription).optional(),
        grades: z.array(z.string().max(4)).max(5).optional(),
        timing: z.array(z.string().max(20)).max(3).optional(),
        hours_per_week: z.number().min(0).max(LIMITS.hoursPerWeek).optional(),
        weeks_per_year: z.number().min(0).max(LIMITS.weeksPerYear).optional(),
        continue_in_college: z.boolean().optional(),
      })
    )
    .max(LIMITS.activities, "Up to 10 activities, like the Common App.")
    .transform((a) => a.filter((x) => x.position.trim().length > 0)),
  // Common App honors / awards (up to 5).
  honors: z
    .array(
      z.object({
        title: z.string().trim().max(LIMITS.honorTitle),
        grades: z.array(z.string().max(4)).max(5).optional(),
        levels: z.array(z.string().max(20)).max(4).optional(),
      })
    )
    .max(LIMITS.honors, "Up to 5 honors, like the Common App.")
    .transform((h) => h.filter((x) => x.title.trim().length > 0)),
  target_schools: z.array(z.string()).max(LIMITS.targetSchools),
  intended_major: z
    .string()
    .trim()
    .min(1, "Add your intended major.")
    .max(LIMITS.shortText),
  citizenship: z
    .string()
    .trim()
    .min(1, "Add your citizenship.")
    .max(LIMITS.shortText),
  needs_aid: z.boolean(),
  include_italy: z.boolean().default(false),
  italy_programs: z.array(z.string().max(80)).max(8).default([]),
  italy_family_income: z.number().min(0).max(10_000_000).optional(),
});

export type SaveResult =
  | { ok: true }
  | { ok: false; error: string };

export async function saveProfile(
  input: StudentProfileInput
): Promise<SaveResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input." };
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
    target_schools: data.target_schools,
    intended_major: data.intended_major,
    citizenship: data.citizenship,
    needs_aid: data.needs_aid,
    include_italy: data.include_italy,
    italy_programs: data.italy_programs,
    italy_family_income: data.italy_family_income ?? null,
    updated_at: new Date().toISOString(),
  };

  // One active intake per user: update the existing row, or insert the first.
  const { data: existing } = await supabase
    .from("student_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const writeErr = existing
    ? (await supabase.from("student_profiles").update(row).eq("id", existing.id))
        .error
    : (await supabase.from("student_profiles").insert(row)).error;

  if (writeErr) return { ok: false, error: "Could not save your profile." };

  revalidatePath("/dashboard");
  return { ok: true };
}
