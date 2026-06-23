import { analyzeProfile } from "../lib/ai/analyze";
import type { StudentProfileInput } from "../lib/types";

const HK_TEST_PROFILE: StudentProfileInput = {
  country: "Kazakhstan",
  citizenship: "Kazakhstan",
  destinations: ["HK", "US"],
  faculties: ["computer_science", "business_economics"],
  intended_major: "Computer Science",
  curriculum: "IB",
  grades: { raw: "Predicted 41/45", ib_total: 41 },
  tests: { SAT: 1510, IELTS: 7.5 },
  activities: [
    {
      type: "Academic",
      position: "Founder / President",
      organization: "Computer Club",
      description: "Taught programming to 40+ junior students.",
      grades: ["11", "12"],
      timing: ["School year"],
      hours_per_week: 4,
      weeks_per_year: 30,
      continue_in_college: true,
    },
  ],
  honors: [
    {
      title: "Olympiad Winner",
      grades: ["11"],
      levels: ["National"],
    },
  ],
  target_schools: ["Boston University"],
  needs_aid: false,
  italy_programs: [],
  italy_family_income: undefined,
  hk_programs: ["hku-bba", "ust-cs"],
  hk_grade_status: "predicted",
};

async function runHkFlowTest() {
  console.log("Starting Hong Kong Flow E2E Walkthrough...");

  try {
    // 1. Verify schema parsing works for the inputs
    console.log("1. Parsing Zod Input Schema...");
    const { inputSchema } = await import("../app/onboarding/schema");
    const parsed = inputSchema.parse(HK_TEST_PROFILE);
    console.log("✓ Zod input schema parsed successfully.");

    // 2. Verify analyzeProfile runs successfully
    console.log("2. Running analyzeProfile...");
    const result = await analyzeProfile(HK_TEST_PROFILE);
    const analysis = result.analysis;
    console.log("✓ analyzeProfile completed successfully.");

    // 3. Verify the analysis output is valid and structured correctly
    console.log("3. Validating Analysis Structure...");
    if (!analysis.hk_programs || analysis.hk_programs.length !== 2) {
      throw new Error(`Expected 2 HK programs, got ${analysis.hk_programs?.length}`);
    }

    const hku = analysis.hk_programs.find((p) => p.program_id === "hku-bba");
    if (!hku) {
      throw new Error("Missing hku-bba program in analysis.");
    }
    console.log(`✓ Program: ${hku.university} ${hku.program_name}`);
    console.log(`  - Status: ${hku.status}`);
    console.log(`  - User Index: ${hku.user_index}`);
    console.log(`  - Conditional Offer: ${hku.conditional_offer}`);
    console.log(`  - Reasoning: ${hku.reasoning.substring(0, 100)}...`);

    const ust = analysis.hk_programs.find((p) => p.program_id === "ust-cs");
    if (!ust) {
      throw new Error("Missing ust-cs program in analysis.");
    }
    console.log(`✓ Program: ${ust.university} ${ust.program_name}`);
    console.log(`  - Status: ${ust.status}`);
    console.log(`  - User Index: ${ust.user_index}`);
    console.log(`  - Conditional Offer: ${ust.conditional_offer}`);
    console.log(`  - Reasoning: ${ust.reasoning.substring(0, 100)}...`);

    console.log("\nALL HONG KONG E2E FLOW CHECKS PASSED ✅");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Hong Kong Flow E2E Walkthrough Failed:", error);
    process.exit(1);
  }
}

runHkFlowTest();
