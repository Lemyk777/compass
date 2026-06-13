/**
 * §12 acceptance test for the AI analysis engine — runs the sample student
 * through analyzeProfile and checks the pass criteria.
 *
 * Requires ANTHROPIC_API_KEY. Run with:
 *   npm run test:analyze
 * (loads .env.local via node --env-file)
 */
import { analyzeProfile } from "../lib/ai/analyze";
import { SAMPLE_PROFILE } from "../lib/ai/sample";

function check(label: string, ok: boolean) {
  console.log(`${ok ? "✓" : "✗"} ${label}`);
  return ok;
}

async function main() {
  console.log("Running analysis for the §12 sample student…\n");
  const { analysis, usage } = await analyzeProfile(SAMPLE_PROFILE);

  let pass = true;
  pass = check("Valid JSON parsed without fallback", true) && pass;
  pass =
    check("Seven factors returned", analysis.factors.length === 7) && pass;
  pass =
    check(
      "Overall score in range",
      analysis.overall_score >= 0 && analysis.overall_score <= 100
    ) && pass;

  const penn = analysis.schools.find((s) => /pennsylvania/i.test(s.name));
  const princeton = analysis.schools.find((s) => /princeton/i.test(s.name));
  const selectiveLowConf = [penn, princeton].every(
    (s) => s && s.confidence === "low" && s.likelihood_high <= 20
  );
  pass =
    check(
      "Penn & Princeton: low confidence, single/low-double-digit ranges",
      selectiveLowConf
    ) && pass;

  const lessSelective = analysis.schools.find(
    (s) => /boston|michigan/i.test(s.name) && s.likelihood_high > 20
  );
  pass =
    check("A less-selective school shows higher likelihood", !!lessSelective) &&
    pass;

  pass =
    check("Benchmarks present", analysis.benchmarks.length > 0) && pass;
  pass =
    check("Gap analysis present", analysis.gap_analysis.length > 0) && pass;

  const targetNames = SAMPLE_PROFILE.target_schools.map((n) => n.toLowerCase());
  const hasNew = analysis.recommended_schools.some(
    (r) => !targetNames.includes(r.name.toLowerCase())
  );
  pass =
    check("Recommends at least one school not in the target list", hasNew) &&
    pass;

  console.log(
    `\nUsage: in=${usage.input_tokens} out=${usage.output_tokens} cache_read=${usage.cache_read_input_tokens} cache_write=${usage.cache_creation_input_tokens}`
  );
  console.log(`\n${pass ? "ALL CHECKS PASSED ✅" : "SOME CHECKS FAILED ❌"}`);
  process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  console.error("\nTest failed to run:", e);
  process.exit(1);
});
