import { z } from "zod";
import { LIMITS } from "@/lib/limits";

export const originSchema = z.object({
  country: z
    .string()
    .trim()
    .min(1, "ob.errCountry")
    .max(LIMITS.shortText, "Country must be at most 80 characters."),
  citizenship: z
    .string()
    .trim()
    .min(1, "ob.errCitizenship")
    .max(LIMITS.shortText, "Citizenship must be at most 80 characters."),
});

export const destinationsSchema = z.object({
  destinations: z
    .array(z.enum(["US", "IT", "HK", "UK", "DE", "NL", "CA"]))
    .min(1, "ob.errDest")
    .max(LIMITS.destinations, "Up to 6 destinations allowed."),
});

export const facultiesSchema = z.object({
  faculties: z
    .array(z.enum([
      "engineering", "computer_science", "business_economics", "natural_sciences",
      "humanities_social", "medicine_health", "law", "arts_design",
    ]))
    .min(1, "ob.errFac")
    .max(LIMITS.faculties, "Up to 3 fields allowed."),
  intended_major: z
    .string()
    .trim()
    .max(LIMITS.shortText, "Intended major must be at most 80 characters.")
    .optional()
    .default(""),
});

export const gradesSchema = z
  .object({
    curriculum: z.enum(["IB", "A-Level", "national", "US-GPA", "other"], {
      errorMap: () => ({ message: "ob.errCurriculum" }),
    }),
    grades: z.object({
      raw: z
        .string()
        .trim()
        .min(1, "ob.errGrades")
        .max(LIMITS.grades, "Grades detail must be at most 600 characters."),
      ib_total: z
        .number()
        .min(1, "IB score must be at least 1.")
        .max(45, "IB score must be at most 45.")
        .optional(),
      gpa: z
        .number()
        .min(0, "GPA must be at least 0.")
        .max(4, "GPA must be at most 4.0.")
        .optional(),
      national_percent: z
        .number()
        .min(0, "Percentage must be at least 0.")
        .max(100, "Percentage must be at most 100.")
        .optional(),
    }),
  })
  .superRefine((val, ctx) => {
    if (val.curriculum === "IB" && val.grades.ib_total === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please enter your IB score.", path: ["grades", "ib_total"] });
    }
    if (val.curriculum === "US-GPA" && val.grades.gpa === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please enter your GPA.", path: ["grades", "gpa"] });
    }
    if (val.curriculum === "national" && val.grades.national_percent === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please enter your national percentage.", path: ["grades", "national_percent"] });
    }
  });

export const testsSchema = z.object({
  tests: z.object({
    SAT: z.number().min(400).max(1600).optional(),
    ACT: z.number().min(1).max(36).optional(),
    IELTS: z.number().min(0).max(9).optional(),
    TOEFL: z.number().min(0).max(120).optional(),
    subjects: z
      .string()
      .max(LIMITS.subjects, "Subjects detail must be at most 400 characters.")
      .optional(),
  }),
});

export const activitiesSchema = z.object({
  activities: z
    .array(
      z.object({
        type: z.string().max(60).optional(),
        position: z
          .string()
          .trim()
          .max(LIMITS.activityPosition, "Position/Leadership must be at most 50 characters."),
        organization: z
          .string()
          .trim()
          .max(LIMITS.activityOrganization, "Organization must be at most 100 characters.")
          .optional(),
        description: z
          .string()
          .trim()
          .max(LIMITS.activityDescription, "Description must be at most 150 characters.")
          .optional(),
        grades: z.array(z.string().max(4)).max(5).optional(),
        timing: z.array(z.string().max(20)).max(3).optional(),
        hours_per_week: z
          .number()
          .min(0, "Hours/week must be non-negative.")
          .max(LIMITS.hoursPerWeek, "Hours/week cannot exceed 168 hours.")
          .optional(),
        weeks_per_year: z
          .number()
          .min(0, "Weeks/year must be non-negative.")
          .max(LIMITS.weeksPerYear, "Weeks/year cannot exceed 52 weeks.")
          .optional(),
        continue_in_college: z.boolean().optional(),
      })
    )
    .max(LIMITS.activities, "Up to 10 activities allowed.")
    .transform((a) => a.filter((x) => x.position.trim().length > 0)),
});

export const honorsSchema = z.object({
  honors: z
    .array(
      z.object({
        title: z
          .string()
          .trim()
          .max(LIMITS.honorTitle, "Honor title must be at most 100 characters."),
        grades: z.array(z.string().max(4)).max(5).optional(),
        levels: z.array(z.string().max(20)).max(4).optional(),
      })
    )
    .max(LIMITS.honors, "Up to 5 honors allowed.")
    .transform((h) => h.filter((x) => x.title.trim().length > 0)),
});

export const usSchema = z.object({
  target_schools: z
    .array(z.string())
    .min(1, "ob.errSchools")
    .max(LIMITS.targetSchools, "Up to 12 US target schools allowed."),
  needs_aid: z.boolean(),
});

export const italySchema = z.object({
  italy_programs: z
    .array(z.string().max(80))
    .min(1, "ob.errItalyPrograms")
    .max(8, "Up to 8 Italian programs allowed."),
  italy_family_income: z
    .number()
    .min(0, "Income must be at least 0.")
    .max(10_000_000, "Income is out of bounds.")
    .optional(),
});

export const reviewSchema = z.any();

export const stepSchemas = {
  origin: originSchema,
  destinations: destinationsSchema,
  faculties: facultiesSchema,
  grades: gradesSchema,
  tests: testsSchema,
  activities: activitiesSchema,
  honors: honorsSchema,
  us: usSchema,
  it: italySchema,
  review: reviewSchema,
} as const;
