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
    country: z.string().trim().min(1, "Tell us your country.").max(LIMITS.shortText),
    citizenship: z
      .string()
      .trim()
      .min(1, "Add your citizenship.")
      .max(LIMITS.shortText),
    destinations: z
      .array(z.enum(["US", "IT", "HK", "UK", "DE", "NL", "CA"]))
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
    hk_programs: z.array(z.string().max(80)).max(6).default([]),
    hk_grade_status: z.enum(["predicted", "achieved"]).optional(),
  })
  .superRefine((val, ctx) => {
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
    if (val.destinations.includes("HK") && val.hk_programs.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add at least one Hong Kong program.",
        path: ["hk_programs"],
      });
    }
  });

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
