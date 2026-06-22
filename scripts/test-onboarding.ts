import { saveProfile } from "../app/onboarding/actions";
import type { StudentProfileInput } from "../lib/types";

// Setup basic mocks for Supabase client
let mockUser: { id: string } | null = { id: "test-student-123" };
let mockProfileUpdateError: any = null;
let mockStudentProfileWriteError: any = null;
let mockExistingProfile: any = null;

(global as any).mockSupabaseClient = () => {
  return {
    auth: {
      getUser: async () => {
        if (!mockUser) {
          return { data: { user: null }, error: new Error("Unauthorized") };
        }
        return { data: { user: mockUser }, error: null };
      }
    },
    from: (table: string) => {
      return {
        update: (row: any) => ({
          eq: (field: string, val: any) => {
            if (table === "profiles") {
              return { error: mockProfileUpdateError };
            }
            if (table === "student_profiles") {
              return { error: mockStudentProfileWriteError };
            }
            return { error: null };
          }
        }),
        insert: (row: any) => {
          if (table === "student_profiles") {
            return { error: mockStudentProfileWriteError };
          }
          return { error: null };
        },
        select: (fields: string) => ({
          eq: (field: string, val: any) => ({
            maybeSingle: async () => {
              return { data: mockExistingProfile, error: null };
            }
          })
        })
      };
    }
  };
};

const VALID_BASE_PROFILE: StudentProfileInput = {
  country: "United States",
  citizenship: "US",
  destinations: ["US"],
  faculties: ["computer_science"],
  intended_major: "Software Engineering",
  curriculum: "US-GPA",
  grades: {
    raw: "3.9 UW GPA",
    gpa: 3.9
  },
  tests: {
    SAT: 1540
  },
  activities: [],
  honors: [],
  target_schools: ["Stanford University"],
  needs_aid: false,
  italy_programs: [],
  italy_family_income: undefined
};

async function main() {
  console.log("Invoking saveProfile with valid base profile...");
  const res = await saveProfile(VALID_BASE_PROFILE);
  console.log("Result:", res);
}

main().catch(err => {
  console.error("Failed to run test:", err);
  process.exit(1);
});
