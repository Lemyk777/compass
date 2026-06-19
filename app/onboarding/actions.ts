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
  activities: z
    .array(
      z.object({
        title: z.string().trim().max(LIMITS.activityTitle),
        detail: z.string().trim().max(LIMITS.activityDetail).optional(),
      })
    )
    .max(LIMITS.activities, "Please keep it to your most meaningful activities.")
    .transform((a) => a.filter((x) => x.title.length > 0)),
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
    target_schools: data.target_schools,
    intended_major: data.intended_major,
    citizenship: data.citizenship,
    needs_aid: data.needs_aid,
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
