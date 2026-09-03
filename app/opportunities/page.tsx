import type { Metadata } from "next";
import { BrandLink } from "@/components/ui/BrandLink";
import { Container } from "@/components/ui/Container";
import { SKIP_TARGET, SkipLink } from "@/components/ui/SkipLink";
import { ButtonLink } from "@/components/ui/Button";
import { EligibilityChecker } from "@/components/opportunities/EligibilityChecker";
import { OpportunitiesView } from "@/components/dashboard/views/OpportunitiesView";
import { DashboardProvider } from "@/components/dashboard/DashboardContext";
import { StudentShell } from "@/components/student/StudentShell";
import { COMPETITIONS, type Competition } from "@/lib/data/key-dates";
import { getSession } from "@/lib/auth/session";
import { categoryFromParam } from "@/lib/data/opportunity-filter";
import { fetchLivePool } from "@/lib/partners/queries";
import { loadStudentContext } from "@/lib/dashboard/load";
import { pageMeta } from "@/lib/seo";

// Opportunities — the front door, at its own address, for BOTH states.
//
// It used to be two different things: this bare public checker for strangers,
// and a tab inside the admission report's sidebar for anyone signed in. That
// arrangement said the report was the product and this was one of its eight
// panels; a student who came to find what they can enter landed in a portfolio
// scoring console. Now the student's own section of the site is Opportunities +
// Guide, and the report is a link out of it.
//
// Signed in → the matched, personal view inside the student shell.
// Signed out → the checker that answers "what can I enter?" for a stranger.

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMeta({
  title: "What can you enter this year? — Compass",
  description:
    "Competitions, olympiads and programmes open to school students worldwide, filtered to the ones you can actually enter at your age. Free, no account needed.",
  path: "/opportunities",
});

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // `?kind=` is where the thread's "try it for an afternoon" move points. The
  // page ignored it, so that link landed on the All tab and the two-clicks-to-a
  // -simulation promise was quietly undelivered.
  const initialCategory = categoryFromParam(searchParams.kind);
  const session = await getSession();

  if (session) {
    const ctx = await loadStudentContext(session);
    return (
      <DashboardProvider
        initialAnalysis={ctx.analysis}
        name={session.full_name}
        hasProfile={ctx.hasProfile}
        isAdmin={session.role === "admin"}
        // Links out of this view (e.g. "run your full report") go to the report
        // section, which still lives under /dashboard.
        basePath="/dashboard"
        canAnalyze
        destinations={ctx.destinations}
        profileMeta={ctx.profileMeta}
        readiness={ctx.readiness}
        liveDates={ctx.liveDates}
        intents={ctx.intents}
      >
        <StudentShell
          isAdmin={session.role === "admin"}
          hasReport={Boolean(ctx.analysis)}
        >
          <OpportunitiesView initialCategory={initialCategory} />
        </StudentShell>
      </DashboardProvider>
    );
  }

  // Partner-posted opportunities have to reach this page too — it is the front
  // door, and an organisation that publishes with us would rightly ask why its
  // hackathon is missing from the page we point everyone at. Note the limit this
  // inherits: a LOCAL post only shows to a student whose country we know, and
  // here we know nothing about the visitor. That is the existing rule (someone
  // else's local list is worse than none), and the partner's own /partners/[id]
  // page shows their full list regardless.
  // The ONE place that prefers degrading over failing, stated here rather than
  // hidden inside every partner query: this page's value is the curated
  // catalog, and partner posts are additive. If the live pool is unreachable a
  // stranger should still get their answer — but the failure is logged, not
  // swallowed into an indistinguishable "no partners".
  let live: Competition[] = [];
  try {
    live = await fetchLivePool();
  } catch (e) {
    console.error(
      "[opportunities] live pool unavailable, serving the catalog only:",
      e,
    );
  }

  // Header outside the main landmark, and a skip link ahead of both — see the
  // note in app/guide/layout.tsx. This is the page a stranger meets first, so it
  // is the last one where the keyboard route in should be the long way round.
  return (
    <div className="min-h-dvh bg-surface text-ink">
      <SkipLink />
      <header className="border-b border-line/70">
        <Container size="dashboard" className="flex items-center justify-between gap-3 py-5">
          <BrandLink />
          <div className="flex items-center gap-2">
            <ButtonLink href="/about" variant="subtle" size="sm">
              About
            </ButtonLink>
            <ButtonLink href="/auth/login" variant="subtle" size="sm">
              Sign in
            </ButtonLink>
          </div>
        </Container>
      </header>

      <main id={SKIP_TARGET} tabIndex={-1}>
        <EligibilityChecker live={live} />

        {/* The account ask comes last, and only after something useful has already
          been handed over. Note what is NOT being sold: Compass is free either
          way, so the trade on offer is information, not money. */}
        <section className="border-t border-line/70 bg-card">
          <Container size="dashboard" className="py-14">
            <h2 className="text-balance text-2xl font-semibold tracking-tight text-ink">
              So far we only know one thing about you: your year at school.
            </h2>
            <p className="mt-3 max-w-xl text-pretty text-base leading-relaxed text-ink-soft">
              Tell us a bit more, what you like and what you&rsquo;ve already done,
              and we can say which of these suit you best, which one to start
              with, and what to do this month. We keep track of all{" "}
              <span data-num className="font-semibold text-ink">
                {COMPETITIONS.length}
              </span>{" "}
              of them and check every link and date ourselves.
            </p>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-soft">
              It doesn&rsquo;t cost anything. Compass is free, all of it.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/auth/signup" variant="primary" size="md">
                Make an account
              </ButtonLink>
              <ButtonLink href="/guide" variant="tonal" size="md">
                Where can this lead?
              </ButtonLink>
              <ButtonLink href="/demo" variant="subtle" size="md">
                See an example first
              </ButtonLink>
            </div>
          </Container>
        </section>
      </main>
    </div>
  );
}
