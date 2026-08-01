# Compass Onboarding E2E Test Infrastructure Guide

This guide describes the end-to-end (E2E) and integration test infrastructure established for the multi-step onboarding questionnaire. It outlines the architecture, features covered, testing tiers, mocking strategies, and commands to run the test suite.

---

## 1. Test Architecture

The testing track exercises the Zod input validation schemas and the server-side action (`saveProfile` in `app/onboarding/actions.ts`) directly. This approach ensures robust validation and persistence checks before code hits production.

### Key Components:
- **Test Runner**: Native Node.js 22 Test Runner (`node:test` and `node:assert`).
- **Loader**: `tsx` for high-performance, on-the-fly TypeScript compilation.
- **Module Mocking**: Native ES module mocking enabled via Node 22's `--experimental-test-module-mocks` flag.

### Mocking Strategy:
Since Next.js Server Actions execute inside request contexts that expect cookies and active router sessions, running them in a standalone Node process would ordinarily fail. We use `mock.module` to dynamically intercept the following dependencies:
1. **`@/lib/supabase/server`**: Mocked to bypass request context cookies, returning a mock Supabase client that implements a configurable, in-memory representation of profiles update/insert operations.
2. **`next/cache`**: Mocked `revalidatePath` to prevent errors from missing Next.js router instances.

---

## 2. Testing Tiers & Scenarios

The test suite is structured into 4 distinct tiers to ensure progressive verification:

### Tier 1: Feature Coverage (Valid Paths)
Tests standard, valid values for all core features, confirming that correct data passes the parser.
- **Feature 1**: Origin Country (5 valid countries tested)
- **Feature 2**: Citizenship (5 valid citizenships tested)
- **Feature 3**: Destinations (5 valid single/multiple destination sets tested)
- **Feature 4**: Fields of Study / Faculties (5 valid single/multiple faculty sets tested)
- **Feature 5**: Intended Major (5 valid major strings/empty tested)
- **Feature 6**: Curriculum (5 valid curricula: IB, A-Level, US-GPA, national, other tested)
- **Feature 7**: Grades (5 valid raw & normalized grade configurations tested)
- **Feature 8**: Standardized Tests (5 valid test score configurations tested)
- **Feature 9**: Extracurricular Activities (5 valid activities sets tested)
- **Feature 10**: Honors & Awards (5 valid honors sets tested)

### Tier 2: Boundaries & Edge Cases (Validations/Errors)
Tests boundary conditions, character limits, invalid data types, and constraint violations for all features (5 scenarios per feature):
- **Origin Country & Citizenship**: Rejects missing/empty inputs, whitespace-only, and names exceeding 80 characters.
- **Destinations**: Rejects empty selections, invalid destination codes, and lists exceeding 6 items.
- **Faculties**: Rejects empty selections, invalid fields, and lists exceeding 3 items.
- **Intended Major**: Rejects specialization strings exceeding 80 characters.
- **Curriculum**: Rejects missing or invalid curriculum choices.
- **Grades**: Rejects missing raw grades, raw grades exceeding 600 characters, and validates normalized out-of-bound indicators.
- **Standardized Tests**: Rejects invalid score structures (e.g. scores passed as strings) and subject strings exceeding 400 characters.
- **Extracurricular Activities**: Rejects lists exceeding 10 items, position strings >50 characters, organizations >100 characters, descriptions >150 characters, and weekly hours >168 or weeks >52.
- **Honors & Awards**: Rejects lists exceeding 5 items, titles >100 characters, grades arrays >5 items, and levels arrays >4 items.

### Tier 3: Combination Check (Cross-Feature logic)
Verifies dependencies between different selections:
- **US pathway check**: Selecting US destination requires `target_schools` to be populated.
- **Italy pathway check**: Selecting Italy destination requires `italy_programs` to be populated.
- **Dual pathways**: Selecting both US and Italy requires both targets to be set.
- **Non-US/IT destinations**: Confirm that no targets are required when selecting CA, UK, etc.

### Tier 4: Real-World Application Profile Scenarios
Validates 5 diverse, full-profile student applications representing realistic backgrounds:
1. **Kazakhstani IB Student**: HL coursework, high IB predicted score, SAT/TOEFL scores, leadership roles in robotics, Olympiad gold honor, applying to US (MIT, Stanford) + Italy.
2. **Russian A-Level Student**: A*A*A HL classes, IELTS 8.5, investing club leader, British Council Economics award, applying to UK + Germany.
3. **US High School Student**: US-GPA 4.0, ACT 35, newspaper editor, National Merit Scholar, applying to US only (Harvard, Yale).
4. **Turkish National Curriculum Student**: 98.4 GPA, IELTS 7.0, hospital volunteer, applying to Italy (medicine) with low family income (scholarship evaluation).
5. **Mongolian Student**: Other curriculum, local GPA, TOEFL 98, hiking club activity, applying to Canada.

---

## 3. Database Failure Simulation

We implement a reactive `dbMockConfig` state to test database and authentication failures:
- **Auth Failure**: Simulates `getUser` failing or returning unauthenticated, verifying that `saveProfile` returns a clean retry prompt.
- **Profile Write Failure**: Simulates Supabase profile table update failure, ensuring transaction rollback messaging.
- **Student Profile Write Failure**: Simulates Supabase student profiles update/insert failure.

---

## 4. How to Run the Tests

To run the full test suite from the repository root:

```bash
# Run onboarding test suite
npm run test:onboarding

# Alternatively, run using raw Node command
node --experimental-test-module-mocks --import tsx --test scripts/test-onboarding.ts
```

All test outcomes are output in standard TAP format. A successful run will produce zero errors with all 118 test cases marked `ok`.
