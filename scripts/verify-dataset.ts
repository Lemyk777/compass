import { UNIVERSITIES, findUniversity } from "../lib/data/universities";
import { ITALIAN_PROGRAMS, findItalianProgram } from "../lib/data/italian-universities";
import { HK_PROGRAMS, findHkProgram } from "../lib/data/hk-universities";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

interface Grade {
  raw: string;
  ib_total: number | null;
  gpa: number | null;
  national_percent: number | null;
}

interface Test {
  SAT: number | null;
  ACT: number | null;
  IELTS: number | null;
  TOEFL: number | null;
  subjects: string | null;
}

interface Profile {
  country: string;
  citizenship: string;
  destinations: string[];
  faculties: string[];
  intended_major: string;
  curriculum: string | null;
  grades: Grade;
  tests: Test;
  activities: any[];
  honors: any[];
  target_schools: string[];
  needs_aid: boolean;
  italy_programs: string[];
  italy_family_income: number | null;
  hk_programs: string[];
  hk_grade_status: string | null;
}

function computeStatHash(profile: Profile): string {
  const curriculum = String(profile.curriculum || "None");
  let grades_normalized = "None";
  if (profile.grades.ib_total !== null && profile.grades.ib_total !== undefined) {
    grades_normalized = `IB_${profile.grades.ib_total}`;
  } else if (profile.grades.gpa !== null && profile.grades.gpa !== undefined) {
    grades_normalized = `GPA_${Number(profile.grades.gpa).toFixed(2)}`;
  } else if (profile.grades.national_percent !== null && profile.grades.national_percent !== undefined) {
    grades_normalized = `NAT_${Number(profile.grades.national_percent).toFixed(1)}`;
  }

  const sat_total = String(profile.tests.SAT);
  const act_composite = String(profile.tests.ACT);
  const ib_total = String(profile.grades.ib_total);

  const dests = [
    ...(profile.target_schools || []),
    ...(profile.italy_programs || []),
    ...(profile.hk_programs || [])
  ].sort();

  const hash_str = `${curriculum}|${grades_normalized}|${sat_total}|${act_composite}|${ib_total}|${dests.join(",")}`;
  return crypto.createHash("md5").update(hash_str, "utf8").digest("hex");
}

function runIntegrityChecks(dataset: Profile[]): { errors: string[]; stats: any } {
  const errors: string[] = [];
  const stats = {
    targetUniIssues: 0,
    italyProgramIssues: 0,
    hkProgramIssues: 0,
    destIssues: 0,
    duplicateHashIssues: 0,
    satIssues: 0,
    actIssues: 0,
    ieltsIssues: 0,
    toeflIssues: 0,
    ibIssues: 0,
    gpaIssues: 0
  };

  // 1. Verify target universities mapping (US)
  dataset.forEach((profile, index) => {
    profile.target_schools.forEach(school => {
      const match = findUniversity(school);
      if (!match) {
        errors.push(`Profile [${index}]: Target school "${school}" is not in the allowed US universities list.`);
        stats.targetUniIssues++;
      }
    });
  });

  // 2. Verify Italy and HK programs mapping
  dataset.forEach((profile, index) => {
    profile.italy_programs.forEach(prog => {
      const match = findItalianProgram(prog);
      if (!match) {
        errors.push(`Profile [${index}]: Italy program "${prog}" is not in the allowed Italian programs list.`);
        stats.italyProgramIssues++;
      }
    });
    profile.hk_programs.forEach(prog => {
      const match = findHkProgram(prog);
      if (!match) {
        errors.push(`Profile [${index}]: HK program "${prog}" is not in the allowed HK programs list.`);
        stats.hkProgramIssues++;
      }
    });
  });

  // 3. Verify Destinations Validity
  const allowedDests = new Set(["US", "IT", "HK"]);
  dataset.forEach((profile, index) => {
    profile.destinations.forEach(dest => {
      if (!allowedDests.has(dest)) {
        errors.push(`Profile [${index}]: Destination "${dest}" is not supported (Allowed: US, IT, HK).`);
        stats.destIssues++;
      }
    });
  });

  // 4. Verify duplicate records by stat hash
  const seenHashes = new Map<string, number[]>();
  dataset.forEach((profile, index) => {
    const hash = computeStatHash(profile);
    if (seenHashes.has(hash)) {
      seenHashes.get(hash)!.push(index);
    } else {
      seenHashes.set(hash, [index]);
    }
  });

  seenHashes.forEach((indices, hash) => {
    if (indices.length > 1) {
      errors.push(`Duplicate stat hash (${hash}) found at profiles: [${indices.join(", ")}]. Academic metrics and destinations are identical.`);
      stats.duplicateHashIssues++;
    }
  });

  // 5. Verify academic fields ranges
  dataset.forEach((profile, index) => {
    const tests = profile.tests;
    const grades = profile.grades;

    // SAT: 400-1600 divisible by 10
    if (tests.SAT !== null && tests.SAT !== undefined) {
      if (tests.SAT < 400 || tests.SAT > 1600 || tests.SAT % 10 !== 0) {
        errors.push(`Profile [${index}]: Invalid SAT score (${tests.SAT}). Must be between 400 and 1600 and divisible by 10.`);
        stats.satIssues++;
      }
    }

    // ACT: 1-36
    if (tests.ACT !== null && tests.ACT !== undefined) {
      if (tests.ACT < 1 || tests.ACT > 36) {
        errors.push(`Profile [${index}]: Invalid ACT score (${tests.ACT}). Must be between 1 and 36.`);
        stats.actIssues++;
      }
    }

    // IELTS: 1.0-9.0 in increments of 0.5
    if (tests.IELTS !== null && tests.IELTS !== undefined) {
      if (tests.IELTS < 1.0 || tests.IELTS > 9.0 || (tests.IELTS * 2) % 1 !== 0) {
        errors.push(`Profile [${index}]: Invalid IELTS score (${tests.IELTS}). Must be between 1.0 and 9.0 in steps of 0.5.`);
        stats.ieltsIssues++;
      }
    }

    // TOEFL: 0-120
    if (tests.TOEFL !== null && tests.TOEFL !== undefined) {
      if (tests.TOEFL < 0 || tests.TOEFL > 120) {
        errors.push(`Profile [${index}]: Invalid TOEFL score (${tests.TOEFL}). Must be between 0 and 120.`);
        stats.toeflIssues++;
      }
    }

    // IB total: ge 12 and le 45 (quarantine gate in pipeline)
    if (grades.ib_total !== null && grades.ib_total !== undefined) {
      if (grades.ib_total < 12 || grades.ib_total > 45) {
        errors.push(`Profile [${index}]: Invalid IB total score (${grades.ib_total}). Must be between 12 and 45.`);
        stats.ibIssues++;
      }
    }

    // GPA: out of 4.0 or 100.0
    if (grades.gpa !== null && grades.gpa !== undefined) {
      if (grades.gpa < 0.0 || (grades.gpa > 4.0 && grades.gpa < 50.0) || grades.gpa > 100.0) {
        errors.push(`Profile [${index}]: GPA (${grades.gpa}) is outside standard range ([0.0, 4.0] or [50.0, 100.0]).`);
        stats.gpaIssues++;
      }
    }

    // National percent: 0-100
    if (grades.national_percent !== null && grades.national_percent !== undefined) {
      if (grades.national_percent < 0.0 || grades.national_percent > 100.0) {
        errors.push(`Profile [${index}]: National percentile (${grades.national_percent}) is outside range [0.0, 100.0].`);
        stats.gpaIssues++;
      }
    }
  });

  return { errors, stats };
}

function runSelfTests() {
  console.log("\n===========================================");
  console.log("RUNNING VERIFICATION SCRIPT SELF-TESTS...");
  console.log("===========================================");

  const baseProfileTemplate: Profile = {
    country: "Kazakhstan",
    citizenship: "Kazakhstan",
    destinations: ["US"],
    faculties: ["computer_science"],
    intended_major: "Computer Science",
    curriculum: "IB",
    grades: {
      raw: "IB 40/45",
      ib_total: 40,
      gpa: null,
      national_percent: null
    },
    tests: {
      SAT: 1500,
      ACT: null,
      IELTS: 7.5,
      TOEFL: null,
      subjects: null
    },
    activities: [],
    honors: [],
    target_schools: ["Harvard University"],
    needs_aid: false,
    italy_programs: [],
    italy_family_income: null,
    hk_programs: [],
    hk_grade_status: "predicted"
  };

  const testCases: { name: string; setup: (p: Profile[]) => void; check: (res: ReturnType<typeof runIntegrityChecks>) => boolean }[] = [
    {
      name: "Catch invalid US target university",
      setup: (dataset) => {
        const p = JSON.parse(JSON.stringify(baseProfileTemplate));
        p.target_schools = ["Hogwarts School of Witchcraft"];
        dataset.push(p);
      },
      check: (res) => res.stats.targetUniIssues === 1
    },
    {
      name: "Catch invalid Italy program",
      setup: (dataset) => {
        const p = JSON.parse(JSON.stringify(baseProfileTemplate));
        p.italy_programs = ["invalid-italy-program"];
        dataset.push(p);
      },
      check: (res) => res.stats.italyProgramIssues === 1
    },
    {
      name: "Catch invalid HK program",
      setup: (dataset) => {
        const p = JSON.parse(JSON.stringify(baseProfileTemplate));
        p.hk_programs = ["invalid-hk-program"];
        dataset.push(p);
      },
      check: (res) => res.stats.hkProgramIssues === 1
    },
    {
      name: "Catch invalid destination code",
      setup: (dataset) => {
        const p = JSON.parse(JSON.stringify(baseProfileTemplate));
        p.destinations = ["FR"];
        dataset.push(p);
      },
      check: (res) => res.stats.destIssues === 1
    },
    {
      name: "Catch invalid SAT score (not divisible by 10)",
      setup: (dataset) => {
        const p = JSON.parse(JSON.stringify(baseProfileTemplate));
        p.tests.SAT = 1505;
        dataset.push(p);
      },
      check: (res) => res.stats.satIssues === 1
    },
    {
      name: "Catch invalid SAT score (out of bounds)",
      setup: (dataset) => {
        const p = JSON.parse(JSON.stringify(baseProfileTemplate));
        p.tests.SAT = 1650;
        dataset.push(p);
      },
      check: (res) => res.stats.satIssues === 1
    },
    {
      name: "Catch invalid ACT score (out of bounds)",
      setup: (dataset) => {
        const p = JSON.parse(JSON.stringify(baseProfileTemplate));
        p.tests.ACT = 38;
        dataset.push(p);
      },
      check: (res) => res.stats.actIssues === 1
    },
    {
      name: "Catch invalid IELTS score (step size issue)",
      setup: (dataset) => {
        const p = JSON.parse(JSON.stringify(baseProfileTemplate));
        p.tests.IELTS = 7.3;
        dataset.push(p);
      },
      check: (res) => res.stats.ieltsIssues === 1
    },
    {
      name: "Catch invalid TOEFL score (out of bounds)",
      setup: (dataset) => {
        const p = JSON.parse(JSON.stringify(baseProfileTemplate));
        p.tests.TOEFL = 130;
        dataset.push(p);
      },
      check: (res) => res.stats.toeflIssues === 1
    },
    {
      name: "Catch invalid IB score (out of bounds)",
      setup: (dataset) => {
        const p = JSON.parse(JSON.stringify(baseProfileTemplate));
        p.grades.ib_total = 11;
        dataset.push(p);
      },
      check: (res) => res.stats.ibIssues === 1
    },
    {
      name: "Catch invalid GPA (out of bounds)",
      setup: (dataset) => {
        const p = JSON.parse(JSON.stringify(baseProfileTemplate));
        p.grades.gpa = 4.5;
        dataset.push(p);
      },
      check: (res) => res.stats.gpaIssues === 1
    },
    {
      name: "Catch duplicate stat-hash records",
      setup: (dataset) => {
        const p1 = JSON.parse(JSON.stringify(baseProfileTemplate));
        const p2 = JSON.parse(JSON.stringify(baseProfileTemplate));
        dataset.push(p1);
        dataset.push(p2);
      },
      check: (res) => res.stats.duplicateHashIssues === 1
    }
  ];

  let failedTests = 0;
  testCases.forEach((tc) => {
    const mockDataset: Profile[] = [];
    tc.setup(mockDataset);
    const result = runIntegrityChecks(mockDataset);
    const ok = tc.check(result);
    console.log(`${ok ? "✓" : "✗"} Self-test: "${tc.name}"`);
    if (!ok) {
      failedTests++;
      console.log("  Expected error not caught or caught incorrectly. Errors output:", result.errors);
    }
  });

  if (failedTests > 0) {
    console.error(`\nSelf-tests failed: ${failedTests} test(s) failed.`);
    process.exit(1);
  } else {
    console.log("All verification script self-tests passed successfully! ✅");
  }
}

function main() {
  // First run self-tests
  runSelfTests();

  const datasetPath = path.resolve(__dirname, "../data-pipeline/dataset.json");
  console.log(`\n===========================================`);
  console.log(`RUNNING INTEGRITY CHECKS ON REAL DATASET...`);
  console.log(`Loading dataset from: ${datasetPath}`);

  if (!fs.existsSync(datasetPath)) {
    console.error(`Error: Dataset file not found at ${datasetPath}`);
    process.exit(1);
  }

  const datasetRaw = fs.readFileSync(datasetPath, "utf8");
  const dataset: Profile[] = JSON.parse(datasetRaw);
  console.log(`Successfully loaded ${dataset.length} student profiles.`);

  const { errors, stats } = runIntegrityChecks(dataset);

  console.log(`\nIntegrity Check Report:`);
  console.log(`  - Target US University mapping errors: ${stats.targetUniIssues}`);
  console.log(`  - Italian Program mapping errors: ${stats.italyProgramIssues}`);
  console.log(`  - HK Program mapping errors: ${stats.hkProgramIssues}`);
  console.log(`  - Destination support errors: ${stats.destIssues}`);
  console.log(`  - Duplicate stat hash records: ${stats.duplicateHashIssues}`);
  console.log(`  - SAT range/divisibility errors: ${stats.satIssues}`);
  console.log(`  - ACT range errors: ${stats.actIssues}`);
  console.log(`  - IELTS range/step errors: ${stats.ieltsIssues}`);
  console.log(`  - TOEFL range errors: ${stats.toeflIssues}`);
  console.log(`  - IB range errors: ${stats.ibIssues}`);
  console.log(`  - GPA/Percentile range errors: ${stats.gpaIssues}`);

  console.log(`\n===========================================`);
  console.log(`SUMMARY: Found ${errors.length} data integrity errors.`);
  console.log(`===========================================`);

  if (errors.length > 0) {
    console.log("\nError Details:");
    errors.forEach(err => console.log(`- ${err}`));
    process.exit(1);
  } else {
    console.log("\nAll data integrity checks passed successfully! ✅");
    process.exit(0);
  }
}

main();
