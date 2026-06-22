"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { LIMITS } from "@/lib/limits";
import type { StudentProfileInput } from "@/lib/types";

// Bounds (LIMITS) are enforced here so an oversized profile can never be stored
// and later overwhelm the analysis. The UI mirrors these caps for good UX.
export const inputSchema = z.object({
  country: z.string().trim().min(1, "Tell us your country.").max(LIMITS.shortText),
  citizenship: z
    .string()
    .trim()
    .min(1, "Add your citizenship.")
    .max(LIMITS.shortText),
  destinations: z
    .array(z.enum(["US", "IT", "UK", "DE", "NL", "CA"]))
    .min(1, "Pick at least one destination country.")
    .max(LIMITS.destinations),
  faculties: z
    .array(
      z.enum([
        "engineering",
        "computer_science",
        "business_economics",
        "natural_sciences",
        "humanities_social",
        "medicine_health",
        "law",
        "arts_design",
      ])
    )
    .min(1, "Pick at least one field of study.")
    .max(LIMITS.faculties),
  intended_major: z.string().trim().max(LIMITS.shortText).optional().default(""),
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
  needs_aid: z.boolean(),
  italy_programs: z.array(z.string().max(80)).max(8).default([]),
  italy_family_income: z.number().min(0).max(10_000_000).optional(),
}).superRefine((val, ctx) => {
  // Each selected destination needs its own targets (mirrors the per-country
  // step the UI enforces).
  if (val.destinations.includes("US") && val.target_schools.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Add at least one US target school.",
      path: ["target_schools"],
    });
  }
  if (val.destinations.includes("IT") && val.italy_programs.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Add at least one Italian program.",
      path: ["italy_programs"],
    });
  }
});

export type SaveResult =
  | { ok: true }
  | { ok: false; error: string };

// Turn the first Zod issue into a message that points at the offending field —
// e.g. a too-long activity "Position / Leadership" on a returning profile —
// instead of a bare "String must contain at most 50 character(s)".
function describeIssue(err: z.ZodError): string {
  const issue = err.errors[0];
  if (!issue) return "Invalid input.";
  const [section, index, field] = issue.path;
  if (section === "activities" && typeof index === "number") {
    const labels: Record<string, string> = {
      position: "“Position / Leadership” (max 50 characters)",
      organization: "“Organization” (max 100 characters)",
      description: "“Description” (max 150 characters)",
    };
    const label = labels[String(field)] ?? "a field";
    return `Activity #${index + 1}: ${label} is too long. Please shorten it.`;
  }
  if (section === "honors" && typeof index === "number") {
    return `Honor #${index + 1}: “Title” is too long (max 100 characters). Please shorten it.`;
  }
  return issue.message;
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
