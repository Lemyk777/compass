import type { Metadata } from "next";
import Link from "@/components/ui/Link";
import { BrandLink } from "@/components/ui/BrandLink";
import { ButtonLink } from "@/components/ui/Button";
import { SKIP_TARGET, SkipLink } from "@/components/ui/SkipLink";
import { Container } from "@/components/ui/Container";
import { pageMeta } from "@/lib/seo";
import { COMPETITIONS, opportunityCost } from "@/lib/data/key-dates";
import { allCareerAreas } from "@/lib/data/careers";
import { MAJORS } from "@/lib/data/majors";
import { STUDY_DESTINATIONS } from "@/lib/data/study-destinations";
import { HUBS } from "@/lib/data/world";
import { HOME_ROUTES } from "@/lib/data/from-home";
import { AboutClient, type AboutStats } from "./AboutClient";

export const metadata: Metadata = pageMeta({
  title: "About Compass — who this is for, and what we refuse to do",
  description:
    "Compass is a free tool that shows school students what they can actually enter this year. Who builds it, how we check a date, and what we will not put on a card.",
  path: "/about",
  type: "article",
});

export default function AboutPage() {
  let free = 0;
  let alwaysOpen = 0;
  for (const c of COMPETITIONS) {
    if (opportunityCost(c).tone === "free") free++;
    if (c.alwaysOpen) alwaysOpen++;
  }

  const stats: AboutStats = {
    total: COMPETITIONS.length,
    free,
    alwaysOpen,
    areas: allCareerAreas().length,
    majors: MAJORS.length,
    countries: STUDY_DESTINATIONS.length,
    cities: HUBS.length,
    homeRoutes: HOME_ROUTES.length,
  };

  return (
    <div className="min-h-dvh bg-surface text-ink flex flex-col">
      <SkipLink />

      <header className="border-b border-line/70">
        <Container size="dashboard" className="flex items-center justify-between gap-3 py-5">
          {/* Not wrapped in a Link. `BrandLink` IS one, with its own href and
              its own aria-label, so wrapping it nests an anchor inside an
              anchor: invalid HTML, and React fails hydration over it. */}
          <BrandLink transition={false} className="shrink-0" />
          <div className="flex items-center gap-2">
            <ButtonLink href="/opportunities" variant="subtle" size="sm">
              See what you can enter
            </ButtonLink>
            <ButtonLink href="/auth/login" variant="subtle" size="sm">
              Sign in
            </ButtonLink>
          </div>
        </Container>
      </header>

      <main id={SKIP_TARGET} tabIndex={-1} className="flex-1 flex flex-col">
        <AboutClient stats={stats} />
      </main>

      <footer className="border-t border-line/70 mt-auto">
        <Container size="dashboard" className="flex flex-col items-start justify-between gap-3 py-8 text-base text-ink-soft sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Compass. Guidance, not guarantees.</p>
          <nav className="flex flex-wrap items-center gap-5">
            <Link href="/privacy" className="transition-colors hover:text-ink">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-ink">
              Terms of Use
            </Link>
          </nav>
        </Container>
      </footer>
    </div>
  );
}
