// Intake validation + helpers for the onboarding save.
//
// This is a PLAIN module (no "use server"): a "use server" file may only export
// async functions, so the Zod schema and the helpers below must live outside
// app/onboarding/actions.ts. Exporting a non-function (the schema object) from
// the action file crashes the production build with
// "A 'use server' file can only export async functions, found object",
// which surfaced as the generic Server Components render error on every save.

import { z } from "zod";
import { LIMITS } from "@/lib/limits";

// Bounds (LIMITS) are enforced here so an oversized profile can never be stored
// and later overwhelm the analysis. The UI mirrors these caps for good UX.
export const inputSchema = z
  .object({
    // Redesigned intake extras (optional so older clients still validate).
    full_name: z.string().trim().max(LIMITS.shortText).optional(),
    school_name: z.string().trim().max(120).optional(),
    budget_annual_usd: z.number().min(0).max(10_000_000).optional(),
    country: z.string().trim().min(1, "Tell us your country.").max(LIMITS.shortText),
    citizenship: z
      .string()
      .trim()
      .min(1, "Add your citizenship.")
      .max(LIMITS.shortText),
    destinations: z
      .array(z.enum(["US", "IT", "HK", "KR", "CN", "CA"]))
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
    // Year they finish high school — anchors the date-based timeline. Bounded
    // loosely so the schema doesn't need touching each year.
    graduation_year: z.number().int().min(2000).max(2100).optional(),
    curriculum: z.enum(["IB", "A-Level", "national", "US-GPA", "other"], {
      errorMap: () => ({ message: "Pick your curriculum." }),
    }),
    grades: z.object({
      raw: z.string().trim().min(1, "Add your grades.").max(LIMITS.grades),
      ib_total: z.number().optional(),
      gpa: z.number().optional(),
      gpa_scale: z.number().optional(),
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
    hk_programs: z.array(z.string().max(80)).max(6).default([]),
    hk_grade_status: z.enum(["predicted", "achieved"]).optional(),
    uae_programs: z.array(z.string().max(80)).max(6).default([]),
    uae_grade_status: z.enum(["predicted", "achieved"]).optional(),
    // Attribution survey (non-referral signups). Optional so a referral user —
    // who never sees the step — always saves cleanly.
    heard_from: z.string().trim().max(40).optional().default(""),
    heard_from_code: z.string().trim().max(64).optional().default(""),
  });
  // Target schools/programs are NO LONGER required at intake. The redesigned
  // onboarding collects only the student's own data; the analysis produces the
  // standing/scorecard from that. Admission odds & application costs unlock
  // later, once the student adds a college list (see the locked sections on the
  // dashboard). So no per-destination target requirement here.

export type SaveResult = { ok: true } | { ok: false; error: string };

// Turn the first Zod issue into a message that points at the offending field —
// e.g. a too-long activity "Position / Leadership" on a returning profile —
// instead of a bare "String must contain at most 50 character(s)".
export function describeIssue(err: z.ZodError): string {
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
