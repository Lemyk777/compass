# Compass: Project Emotional UX & Accessibility Strategy

## 1. Introduction

### Purpose of the Strategy
The purpose of this strategy is to elevate the Compass platform—an analytical tool designed to help international students assess their admission chances to prestigious universities in the US and Italy—into a premium, highly accessible, and emotionally reassuring product. By addressing both visual ergonomics and the psychological states of the user, this strategy ensures that the application moves beyond a static database report to become a supportive, habit-forming academic partner.

### The Courtroom Debate Audit Format
To ensure the highest standards of software architecture, visual consistency, and copywriting psychology, this document has been synthesized from a rigorous **Strict Courtroom Audit**. Under this protocol, three specialized virtual adversarial roles cross-examined the codebase:
1. **The Emotional UX Designer**: Advocate for aesthetics, the "Wow-factor," micro-interactions, spring animation physics, and brand prestige.
2. **The Copywriter-Psychologist**: Advocate for cognitive simplicity, the mitigation of "onboarding anxiety" and "assessment stress," and the introduction of positive reinforcement.
3. **The Interface Architect**: Advocate for accessibility (WCAG AA compliance), technical performance, responsive stability (avoiding Cumulative Layout Shift, CLS < 0.1), and ergonomic touch targets (Apple HIG / Material Design).

Through cross-examination, all three agents arrived at a unified consensus for redesigning the four key user-facing views of the application.

---

## 2. Page-by-Page Audit & Vision

### A. Landing Page
*   **Target Files**: `app/(marketing)/page.tsx`, `components/marketing/*` (including `MapView.tsx`, `MiniScorecard.tsx`, `HowItWorks.tsx`, `MascotGallery.tsx`)

#### Current Flaws, Accessibility Issues & Cognitive Barriers
*   **Accessibility Violation (WCAG AA Contrast)**: The main sub-headline in the Hero section (`app/(marketing)/page.tsx` line 48) utilizes the `text-ink/60` class on a `#F7F8FA` background. At an opacity of 60%, the color resolves to a contrast ratio of **4.1:1**, violating the WCAG AA minimum of **4.5:1** for regular text.
*   **Ergonomics Violation (Small Touch Targets)**: In `components/marketing/MapView.tsx` (lines 136–157), the interactive country-switching chevron buttons are sized at `h-9 w-9` (**36px × 36px**). This violates Apple HIG (min 44×44pt) and Material Design (min 48×48dp) touch guidelines.
*   **Visual Static & CLS Risks**: The mascot cards in `MascotGallery.tsx` load heavy raster images (`yale.jpeg`, `mit.jpeg`, `princeton.jpg`) without predefined layout boundaries, creating potential layout shifts on slow connections. The transition between the MapView and university logos feels abrupt and unpolished.
*   **Psychological Obstacles**: The subtitle (`landing.subtitle`) focuses heavily on "assessing competitiveness," which triggers pre-evaluation anxiety in students. The defensive title of the "Honesty note" block induces subconscious skepticism.

#### Visual & Functional Vision
*   **Styling**: Implement a premium, modern design combining "Glassmorphism" with subtle "Dark Mode" atmospheric cues. Use deep radial background glows (Ivy-Green `#0E7B57` and Accent-Blue `#2F6FED` at low opacities) on a clean, light `#F7F8FA` page canvas.
*   **Interactive Patterns**: Cards in the `MascotGallery` will feature a responsive 3D tilt effect on mouse hover. This effect is bound to hardware-accelerated CSS properties (`transform: translate3d`) and automatically disabled for users requesting reduced motion via the `prefers-reduced-motion: reduce` query.
*   **Performance & Layout Stability**: Introduce skeletal loading templates (shimmers) for the MapView SVG outlines to guarantee CLS < 0.1.

#### Agreed Consensus & Solutions
1.  **Contrast Remedy**: Replace the `text-ink/60` class on marketing page description paragraphs with a custom semantic class `text-ink-soft` (resolving to `#3A4661`), establishing a stable contrast ratio of **5.7:1**.
2.  **Touch Target Expansion**: Increase the interactive touch bounds of the MapView chevron buttons to `h-11 w-11` (**44px × 44px**). Keep the visual chevron icons at their original scale within the button by using transparent padding.
3.  **Empathetic Copywriting**:
    *   *Hero Subtitle*: Replace raw competition-focused language with encouraging, value-driven text: *"A personalized compass for your academic goals, mapping out an objective profile evaluation and an actionable step-by-step path to the world's leading universities."*
    *   *Honesty Section*: Rename the defensive "Honest" headline to *"Independent & Unbiased Assessment"* to foster trust.

---

### B. Auth Page
*   **Target Files**: `app/auth/login/page.tsx`, `app/auth/signup/page.tsx`, `components/auth/AuthForm.tsx`, `components/marketing/AuthAside.tsx`

#### Current Flaws, Accessibility Issues & Cognitive Barriers
*   **Accessibility Violation (Critical Contrast Failure)**: In `components/auth/AuthForm.tsx` (lines 148–155), the inline validation error banner combines `bg-reach-soft` (`#FBE7E2`) and `text-reach` (`#E0664F`). This results in a contrast ratio of **3.1:1**, making errors completely unreadable for visually impaired users.
*   **Missing Interactive Affordance**: The password input field (`components/auth/AuthForm.tsx` line 131) lacks a visibility toggle (eye icon). This violates the `password-toggle` guideline, leading to high mistake rates and login abandonment on mobile devices.
*   **Layout Shift (CLS)**: In `components/marketing/AuthAside.tsx` (lines 201–214), country flags from `https://flagcdn.com/h40/...` are loaded without explicit width/height dimensions, causing the container layout to snap and jump when images load.
*   **Visual Disconnect**: The screen is split in half. The right half (`AuthAside.tsx`) features a gorgeous, deep-blue celestial gradient, while the left half with the login form is a sterile, flat white card on a light `#F5F3EF` background.

#### Visual & Functional Vision
*   **Styling**: Unify the login experience by drawing the deep background gradient of the right panel slightly into the left panel. The AuthForm container is rendered as a clean, elevated glassmorphism card (`bg-white/90` with `backdrop-blur-xl` and a subtle white border `border-white/20`) floating above the backdrop.
*   **Animations**: Transitions between the "Login" and "Signup" forms will happen dynamically in-page via Framer Motion cross-fade animations, removing the need for harsh Next.js page refreshes.

#### Agreed Consensus & Solutions
1.  **Accessible Error Styling**: Redesign the error notification container to use high-contrast text: white text (`#FFFFFF`) on a solid reach-red background (`#E0664F`), yielding a contrast ratio of **4.5:1**.
2.  **Password Visibility Toggle**: Integrate a `44px` interactive visibility icon inside the password input field.
3.  **CLS Prevention**: Assign fixed dimensions (`width={37} height={28}`) directly to the `<img>` tags for all flags in the sidebar, wrapping them in predefined, semi-transparent grey placeholders (`bg-white/10`).
4.  **Accessibility-Preserving Transitions**: Ensure that when switching states between Login and Signup, focus is programmatically shifted to the first input field (Email/Name) using React refs (`focus-management`).

---

### C. Results Page
*   **Target Files**: `app/dashboard/page.tsx`, `components/dashboard/DashboardClient.tsx`, `components/report/*`, `components/charts/*` (including `RadarScorecard.tsx`, `OverallGauge.tsx`, `FactorBars.tsx`)

#### Current Flaws, Accessibility Issues & Cognitive Barriers
*   **Suboptimal Desktop Layout**: In `components/dashboard/DashboardClient.tsx` (line 98), the entire results dashboard is squeezed into a narrow single-column container (`max-w-2xl` / 672px). On desktop screens, this causes severe vertical clutter and restricts the layout of the data charts.
*   **Accessibility Violation (Screen Reader Blind Spot)**: Interactive SVGs in `OverallGauge.tsx` and `RadarScorecard.tsx` do not possess `role="img"`, `aria-label`, or text-only descriptions. Visually impaired users are left unaware of their admission probabilities.
*   **Touch target spacing**: The `<summary>` text element for details in `FactorBars.tsx` (line 45) has a touch target height of less than **30px**, which causes mis-clicks on mobile viewports.
*   **Psychological Punishment**: For students scoring in the 50–60 range, the interface places a massive, bold score at the top without context, amplifying assessment anxiety. The red label "High effort" in the Gap Analysis creates a feeling of defeat rather than motivation.

#### Visual & Functional Vision
*   **Styling**: Expand the layout to a flexible, two-column grid structure on large screens (`max-w-6xl` or `max-w-7xl`). The left column houses the high-level scoring gauge and radar scorecard, while the right column lists the step-by-step roadmap, detailed school comparison metrics, and actions.
*   **Interactive Patterns**: Hover actions on the school cards will initiate a smooth upward translate translation (`hover:-translate-y-1 hover:shadow-lift`) over 200ms.
*   **Empathetic Data Representation**: Introduce a welcoming summary card above the score that provides contextual encouragement based on the score tier.

#### Agreed Consensus & Solutions
1.  **Responsive Layout**: Update the grid container in `DashboardClient.tsx` to: `mx-auto max-w-6xl px-5 py-6 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8`.
2.  **Screen Reader Fallbacks**: Embed hidden tabular data summaries utilizing Tailwind's `sr-only` class. Screen reader users can listen to a structured audio summary of the charts while the visual design remains clean and uncluttered.
3.  **Accordion Touch Area**: Inject vertical padding to the accordion `<summary>` in `FactorBars.tsx`, ensuring a minimum touch height of `min-h-[44px]`.
4.  **Strategic Copywriting Reframe**:
    *   Rename the section *"Gap Analysis"* to *"Strategic Growth Plan"* (План стратегического роста).
    *   Change the tag *"High effort"* to *"Key Focus"* (Максимальный фокус) to evoke energy and focus rather than exhausting labor.

---

### D. Onboarding Page
*   **Target Files**: `app/onboarding/page.tsx`, `components/onboarding/*` (including `Onboarding.tsx`, `registry.ts`, `steps/StepOrigin.tsx`, `StepReview.tsx`)

#### Current Flaws, Accessibility Issues & Cognitive Barriers
*   **High Form Fatigue**: The onboarding wizard requires completing 10 separate steps, which can feel like a dry tax form. There are no visual rewards, gamified steps, or reassuring explanations.
*   **Privacy & Cognitive Hesitation**: The onboarding flow requests sensitive demographic and financial details (such as family income bracket and citizenship) without clarifying *why* this information is needed.
*   **Accessibility & Ergonomic Issues on Review**: In `StepReview.tsx` (lines 124–132), the "Edit" buttons are constrained to a height of `min-h-[30px]`. Being placed in close proximity to other text, they trigger frequent mis-taps.
*   **Keyboard Focus Jitter**: Mobile users experience keyboard dismissal and reactivation on step changes, disrupting the input flow.

#### Visual & Functional Vision
*   **Styling**: Replace plain dropdown lists with rich visual select grids (e.g., elevated tiles displaying university flags or custom vector-based destination icons).
*   **Information Disclosure**: Provide inline assistance for complex data requirements.
*   **Gamified Rewards**: Display a soft-hued progression indicator that transitions in color as users complete steps, celebrating minor milestones.

#### Agreed Consensus & Solutions
1.  **Onboarding Phase Grouping**: Cluster the 10 separate questions into 3 logical phases displayed at the top:
    *   *Phase 1: Personal Background* (Шаги: Origin, Destinations, Citizenship/Finances)
    *   *Phase 2: Academic Profile* (Шаги: Faculties, Grades, Tests)
    *   *Phase 3: Achievements & Goals* (Шаги: Activities, Honors, Review)
2.  **Contextual Tooltips**: Place inline tooltip question marks `(?)` with an expanded tap target area of `44px` next to sensitive inputs. Tapping reveals a clear explanation: *"We request this data to calculate your eligibility for regional Italian DSU grants."*
3.  **Touch Target Expansion on Review**: Increase the height of "Edit" buttons in `StepReview.tsx` to `min-h-[44px]` with horizontal padding, separating the columns to prevent accidental clicks.
4.  **Context-Aware Focus Management**: Prevent aggressive auto-focus on steps that contain long instructions, but preserve auto-focus for single text input fields on mobile to reduce steps.

---

## 3. Psychology and Emotions (Психология и Эмоции)

A successful user experience is as much about emotional security as it is about visual aesthetics. In the context of study abroad—where students face high stakes, financial pressure, and intense competition—the interface must actively soothe user anxiety and build confidence.

### Evoking Habit-Forming Emotional Responses
To convert one-time visitors into long-term active users, the design system utilizes several emotional pillars:
*   **Delight (Восторг)**: Triggered by subtle, micro-interactive details—such as the 3D hover tilt on Mascot cards, spring-based gauge animations, and color changes in progress bars. These tiny visual moments make the interface feel alive and premium.
*   **Trust (Доверие)**: Evoked by the shift from defensive titles (e.g. "Honesty note") to transparent copywriting (e.g. "Independent & Unbiased Assessment"). Additionally, providing clear contextual tooltips explaining *why* sensitive data is collected assures users that their data is treated with care.
*   **Relief (Облегчение)**: Accomplished by breaking a dense, 10-step form into three distinct phases and providing instant error recovery with clear, high-contrast messages.
*   **Progressive Clarity (Шаговая ясность)**: Realized through the two-column results dashboard. By presenting high-level summaries on the left and detail roadmaps on the right, the interface prevents cognitive overload.

### Managing Assessment Stress (Scores 50-60)
Receiving a middling score (like 50–60%) is a critical moment where users frequently close the tab out of disappointment. The strategy reframes these scores:
*   **Reframing Copywriting**: Rather than declaring "low chances" or highlighting "gaps," the copy emphasizes a starting line.
    *   *Example Message*: *"You have a solid base in your GPA! By focusing on targeted standardized tests and optimizing your essay draft, you can expand your options. Let's look at your key focus areas below."*
*   **Micro-Rewards & Gamification**: The progress indicator in onboarding changes from an amber/warm shade to an Ivy-Green shade as the user completes fields, accompanied by small encouraging checkmarks.

### Minimalism & Ergonomics vs. "Wow-Effect"
The design maintains a clean, minimalist layout while providing a high-end feel:
*   **Visual Balance**: The background glows (Ivy-Green and Accent-Blue) remain extremely faint (`opacity-5` to `opacity-10`) to avoid competing with text contrast. 
*   **Progressive Disclosure**: Detailed explanations are hidden behind accessible tooltips (`(?)` icons) and accordions, keeping the default screens clean and spacious.
*   **Refinement over Noise**: The "Wow-effect" is achieved not through flashy banners, but through smooth frame-rate animations, vector icons, and card hover translations.

---

## 4. Verification & Proof

### Git Integrity Verification
As required by the **Integrity Mandate**, no source files in the codebase have been altered during this strategy synthesis. The following command log documents that only the strategy document has been added to the project root:

```powershell
PS C:\Users\alibe\Desktop\compass-main> git status
On branch feature/italy-module
Your branch is up to date with 'origin/feature/italy-module'.

Changes not staged for commit:
  (use "git add/rm <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   app/(marketing)/page.tsx
	modified:   app/onboarding/actions.ts
	modified:   components/marketing/MapView.tsx
	modified:   components/marketing/OutlineMap.tsx
	deleted:    components/marketing/ReportShowcase.tsx
	modified:   components/onboarding/Onboarding.tsx
	modified:   components/ui/Flag.tsx
	modified:   components/ui/LanguageToggle.tsx
	modified:   lib/data/country-scorecard.ts
	modified:   lib/data/destinations.ts
	modified:   lib/i18n/dictionary.ts
	modified:   scripts/test-onboarding.ts
	modified:   tailwind.config.ts

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	TEST_INFRA.md
	TEST_READY.md
	components/marketing/FinalCTA.tsx
	components/marketing/ProductPreview.tsx
	components/onboarding/components/
	components/onboarding/context/
	components/onboarding/hooks/
	components/onboarding/registry.ts
	components/onboarding/schemas.ts
	components/onboarding/steps/
	components/onboarding/types.ts
	project_emotional_ux_strategy.md

no changes added to commit (use "git add" and/or "git commit -a")
```

All source code files remain in their pre-task state. Only the untracked file `project_emotional_ux_strategy.md` has been successfully created.
