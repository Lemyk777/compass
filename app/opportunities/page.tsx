import type { Metadata } from "next";
import { Logo } from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { EligibilityChecker } from "@/components/opportunities/EligibilityChecker";
import { COMPETITIONS } from "@/lib/data/key-dates";
import { getSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { FacultyValue } from "@/lib/data/faculties";

// The public face of Opportunities: no account, no analysis, no paywall.
// It exists to answer one question for a stranger — "what can I enter?" — and
// it is the entry point if this is to stand alone as a product.
//
// It is ALSO the page a signed-in student may land on, and pushing them to
// "make an account" they already have is the exact seam that makes the product
// feel like two sites. So when we know who they are we drop the sign-up asks,
// point them back to their dashboard, and pre-fill the checker from their
// profile — the public answer and the logged-in answer run through the same
// engine, so they should open already agreeing.

export const metadata: Metadata = {
  title: "What can you enter this year? — Compass",
  description:
    "Competitions, olympiads and programmes open to school students worldwide, filtered to the ones you can actually enter at your age. Free, no account needed.",
};

export default async function PublicOpportunitiesPage() {
  const session = await getSession();

  // For a signed-in student, pull the two facts the checker can pre-fill from.
  // `select("*")` so a DB missing newer columns still returns the row, matching
  // the dashboard layout's read. RLS scopes this to their own row.
  let graduationYear: number | null = null;
  let faculties: FacultyValue[] = [];
  if (session) {
    const supabase = createClient();
    const { data: profile } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("user_id", session.id)
      .maybeSingle();
    graduationYear = (profile?.graduation_year as number | null) ?? null;
    faculties = (profile?.faculties as FacultyValue[] | null) ?? [];
  }

  return (
    <main className="min-h-dvh bg-surface text-ink">
      <header className="border-b border-line/70">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-5 sm:px-6">
          <Logo className="shrink-0 text-ink" />
          {session ? (
            <ButtonLink href="/dashboard" variant="subtle" size="sm">
              My dashboard
            </ButtonLink>
          ) : (
            <ButtonLink href="/auth/signup" variant="subtle" size="sm">
              Get the full report
            </ButtonLink>
          )}
        </div>
      </header>

      <EligibilityChecker
        initialGraduationYear={graduationYear}
        initialFields={faculties}
      />

      {session ? (
        // Already ours — no sign-up ask. Send them to the fuller view instead,
        // and never imply they need a second account.
        <section className="border-t border-line/70 bg-card">
          <div className="mx-auto max-w-3xl px-5 py-14 sm:px-6">
            <h2 className="text-balance text-2xl font-semibold tracking-tight text-ink">
              This is the same list, just the public view of it.
            </h2>
            <p className="mt-3 max-w-xl text-pretty text-base leading-relaxed text-ink-soft">
              Your dashboard has the rest — how these fit your profile, which one
              to start with, what to do this month, and your admission report
              across every country you picked.
            </p>
            <div className="mt-6">
              <ButtonLink href="/dashboard" variant="primary" size="md">
                Open my dashboard
              </ButtonLink>
            </div>
          </div>
        </section>
      ) : (
        // The account ask comes last, and only after something useful has
        // already been handed over. Note what is NOT being sold: Compass is free
        // either way, so the trade on offer is information, not money. Copy that
        // implies a paid tier ("the free half") would be a straight lie.
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
      )}
    </main>
  );
}
