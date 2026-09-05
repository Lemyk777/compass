import type { Metadata } from "next";
import { BrandLink } from "@/components/ui/BrandLink";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SKIP_TARGET, SkipLink } from "@/components/ui/SkipLink";
import { pageMeta } from "@/lib/seo";
import { Wizard } from "@/components/assessment/Wizard";

export const metadata: Metadata = pageMeta({
  title: "Find Your Direction — Personal Assessment | Compass",
  description:
    "Answer 4 simple questions with a mentor to uncover your tailored competition roadmap, strengths, and next steps. Free, no account required.",
  path: "/assessment",
});

export default function AssessmentPage() {
  return (
    <div className="relative min-h-dvh bg-surface text-ink flex flex-col overflow-hidden">
      <SkipLink />

      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[450px] w-[700px] rounded-full bg-gradient-to-tr from-accent/10 via-ivy/10 to-transparent blur-3xl -z-10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-10 right-0 h-[350px] w-[450px] rounded-full bg-accent/5 blur-3xl -z-10"
      />

      {/* Header */}
      <header className="border-b border-line/60 bg-surface/80 backdrop-blur-md sticky top-0 z-20">
        <Container size="reading" className="flex items-center justify-between py-4">
          <BrandLink transition={false} />
          <ButtonLink href="/opportunities" variant="ghost" size="sm">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Opportunities
          </ButtonLink>
        </Container>
      </header>

      {/* Main Wizard Stage */}
      <main
        id={SKIP_TARGET}
        tabIndex={-1}
        className="flex-1 flex flex-col justify-center py-8 sm:py-12"
      >
        <Container size="reading" className="w-full">
          <div className="mx-auto max-w-2xl">
            <Wizard />
          </div>
        </Container>
      </main>

      {/* Footer */}
      <footer className="border-t border-line/60 py-6 text-center text-xs text-ink-faint">
        <Container size="reading">
          <p>© {new Date().getFullYear()} Compass. Guidance, not guarantees. 100% Free.</p>
        </Container>
      </footer>
    </div>
  );
}
