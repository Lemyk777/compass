# Project: Hong Kong Onboarding & Save-Analyze Bugfix

## Architecture
- **Onboarding Wizard**: Client-side form wizard managed by `useOnboardingWizard.ts`, validated using Zod schemas in `schemas.ts` and saved via a Next.js Server Action in `actions.ts`.
- **Analysis Backend**: Triggered by `/api/analyze` POST route. Integrates Claude Haiku model for qualitative analysis and combines it with deterministic country-specific evaluators (e.g. `lib/ai/hk-analyze.ts` for HK).
- **Dashboard / Report Components**: Renders overall scorecard, factor breakdown, timeline, recommendations, and country-specific breakdowns (`ItalyBreakdown.tsx` and the new `HkBreakdown.tsx`).

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Setup & Initial Audit | Run lint, build, and onboarding test script to locate current baseline. Explorer audit to locate the root cause of the server component render error. | None | PLANNED |
| 2 | Implementation: HK Support & Dashboard Bugfix | Add `HkBreakdown.tsx`, update `Report.tsx`, `CostBreakdown.tsx`, and translations. Fix dashboard page `hasProfile` loading logic. | M1 | PLANNED |
| 3 | Implementation: Onboarding UI/UX Polish | Improve wizard UI (typography, spacing, interactive states, transitions) using `ui-ux-pro-max` guidelines. | M2 | PLANNED |
| 4 | QA & E2E Testing | Write new tests for HK inside `scripts/test-onboarding.ts`. Run the E2E browser test flow to walk through onboarding and verify successful analyze rendering. | M2, M3 | PLANNED |
| 5 | Courtroom Debate & Review | Adversarial review between Implementation and QA teams. Line-by-line cross examination to verify premium quality. | M4 | PLANNED |
| 6 | Forensic Audit & Validation | Run forensic auditor to verify that the implementation is genuine and meets all standards. | M5 | PLANNED |

## Interface Contracts
### `student_profiles` Database Schema (from `supabase/migrations/0005_hong_kong.sql`)
- `hk_programs`: `text[] NOT NULL DEFAULT '{}'`
- `hk_grade_status`: `text` (predicted | achieved | null)

### `hkProgramSchema` (from `lib/ai/schema.ts`)
- Mapped in `Analysis` under `hk_programs?: HkProgramAnalysis[]`

## Code Layout
- `app/onboarding/actions.ts`: Server action for saving onboarding profile
- `app/dashboard/page.tsx`: Server component for loading dashboard data
- `components/dashboard/DashboardClient.tsx`: Client dashboard and analysis trigger
- `components/report/Report.tsx`: Renders the tabs and selects country breakdown
- `components/report/HkBreakdown.tsx`: New component to render HK programs breakdown
- `components/report/CostBreakdown.tsx`: Renders cost breakdown for active country
- `lib/data/hk-universities.ts`: Contains HK programs dataset
- `lib/ai/hk-analyze.ts`: Deterministic evaluation engine for HK admissions
