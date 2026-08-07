import type { Metadata } from "next";
import { Logo } from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { EligibilityChecker } from "@/components/opportunities/EligibilityChecker";
import { OpportunitiesView } from "@/components/dashboard/views/OpportunitiesView";
import { DashboardProvider } from "@/components/dashboard/DashboardContext";
import { StudentShell } from "@/components/student/StudentShell";
import { COMPETITIONS, type Competition } from "@/lib/data/key-dates";
import { getSession } from "@/lib/auth/session";
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

export default async function OpportunitiesPage() {
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
          <OpportunitiesView />
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
    console.error("[opportunities] live pool unavailable, serving the catalog only:", e);
  }

  return (
    <main className="min-h-dvh bg-surface text-ink">
      <header className="border-b border-line/70">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-5 sm:px-6">
          <Logo className="shrink-0 text-ink" />
          <ButtonLink href="/auth/login" variant="subtle" size="sm">
            Sign in
          </ButtonLink>
        </div>
      </header>

      <EligibilityChecker live={live} />

      {/* The account ask comes last, and only after something useful has already
          been handed over. Note what is NOT being sold: Compass is free either
          way, so the trade on offer is information, not money. */}
      <section className="border-t border-line/70 bg-card">
        <div className="mx-auto max-w-3xl px-5 py-14 sm:px-6">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-ink">
            So far we only know one thing about you: your year at school.
          </h2>
          <p className="mt-3 max-w-xl text-pretty text-base leading-relaxed text-ink-soft">
            Tell us a bit more — what you like, what you&rsquo;ve already done —
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
        </div>
      </section>
    </main>
  );
}
