import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { EligibilityChecker } from "@/components/opportunities/EligibilityChecker";
import { COMPETITIONS } from "@/lib/data/key-dates";
import { getSession } from "@/lib/auth/session";
import { fetchLivePool } from "@/lib/partners/queries";

// The public face of Opportunities: no account, no analysis, no paywall.
// It exists to answer one question for a STRANGER — "what can I enter?" — and
// it is the front door if this is to stand alone as a product.
//
// It is deliberately the GUEST surface only. A signed-in student already has an
// Opportunities view inside the dashboard shell (sidebar, their profile, the
// full report), so landing them on this bare page made the product feel like
// two separate sites. When we know who they are we send them to that integrated
// view instead — one Opportunities experience per state, not two.

export const metadata: Metadata = {
  title: "What can you enter this year? — Compass",
  description:
    "Competitions, olympiads and programmes open to school students worldwide, filtered to the ones you can actually enter at your age. Free, no account needed.",
};

export default async function PublicOpportunitiesPage() {
  // Signed in? Go to the account's own Opportunities, not this stripped-down
  // public copy. This is what stops the site feeling like disconnected islands.
  const session = await getSession();
  if (session) redirect("/dashboard/opportunities");

  // Partner-posted opportunities have to reach this page too — it is the front
  // door, and an organisation that publishes with us would rightly ask why its
  // hackathon is missing from the page we point everyone at. Note the limit
  // this inherits: a LOCAL post only shows to a student whose country we know,
  // and here we know nothing about the visitor. That is the existing rule
  // (someone else's local list is worse than none), and the partner's own
  // /partners/[id] page is the surface that shows their full list regardless.
  const live = await fetchLivePool();

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

      {/* The account ask comes last, and only after something useful has
          already been handed over. Note what is NOT being sold: Compass is free
          either way, so the trade on offer is information, not money. Copy that
          implies a paid tier ("the free half") would be a straight lie. */}
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
            <ButtonLink href="/demo" variant="tonal" size="md">
              See an example first
            </ButtonLink>
          </div>
        </div>
      </section>
    </main>
  );
}
