"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Analysis } from "@/lib/ai/schema";
import { Report } from "@/components/report/Report";
import { Logo } from "@/components/ui/Logo";
import { Button, ButtonLink } from "@/components/ui/Button";

type Props = {
  initialAnalysis: Analysis | null;
  name: string | null;
  hasProfile: boolean;
  autoAnalyze: boolean;
};

export function DashboardClient({
  initialAnalysis,
  name,
  hasProfile,
  autoAnalyze,
}: Props) {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<Analysis | null>(initialAnalysis);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  async function runAnalysis() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed.");
      setAnalysis(data.analysis as Analysis);
      // Clean the ?analyze=1 flag from the URL.
      router.replace("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (autoAnalyze && !initialAnalysis && hasProfile && !started.current) {
      started.current = true;
      runAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-dvh bg-surface">
      <header className="sticky top-0 z-10 border-b border-line bg-surface/85 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3">
          <Logo className="text-ink" />
          <div className="flex items-center gap-1">
            <ButtonLink href="/onboarding" variant="ghost" size="sm">
              Update profile
            </ButtonLink>
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-5 py-6">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} onRetry={runAnalysis} hasProfile={hasProfile} />
        ) : analysis ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-ink">
                  Your standing
                </h1>
                <p className="text-sm text-ink-soft">
                  Based on the profile you gave us.
                </p>
              </div>
              <Button variant="subtle" size="sm" onClick={runAnalysis}>
                Re-analyze
              </Button>
            </div>
            <Report analysis={analysis} name={name} />
          </div>
        ) : (
          <EmptyState hasProfile={hasProfile} onRun={runAnalysis} />
        )}
      </div>
    </main>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-line border-t-accent" />
      <h2 className="mt-5 text-lg font-semibold text-ink">
        Reading your profile…
      </h2>
      <p className="mt-1 max-w-xs text-sm text-ink-soft">
        We&apos;re scoring your factors and weighing each school. This takes a few
        seconds.
      </p>
    </div>
  );
}

function EmptyState({
  hasProfile,
  onRun,
}: {
  hasProfile: boolean;
  onRun: () => void;
}) {
  if (!hasProfile) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Let&apos;s build your scorecard
        </h1>
        <p className="mt-2 max-w-sm text-sm text-ink-soft">
          Tell us about your grades, tests, and target schools, and we&apos;ll show
          you where you stand.
        </p>
        <ButtonLink href="/onboarding" size="lg" className="mt-6">
          Start your profile
        </ButtonLink>
      </div>
    );
  }
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        Ready when you are
      </h1>
      <p className="mt-2 max-w-sm text-sm text-ink-soft">
        Your profile is saved. Run the analysis to see your competitiveness score
        and per-school likelihoods.
      </p>
      <Button size="lg" className="mt-6" onClick={onRun}>
        See my standing
      </Button>
    </div>
  );
}

function ErrorState({
  error,
  onRetry,
  hasProfile,
}: {
  error: string;
  onRetry: () => void;
  hasProfile: boolean;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-xl font-semibold tracking-tight text-ink">
        We couldn&apos;t finish your analysis
      </h1>
      <p className="mt-2 max-w-sm text-sm text-ink-soft">{error}</p>
      <div className="mt-6 flex gap-3">
        {hasProfile && (
          <Button size="lg" onClick={onRetry}>
            Try again
          </Button>
        )}
        <ButtonLink href="/onboarding" variant="subtle" size="lg">
          Edit profile
        </ButtonLink>
      </div>
    </div>
  );
}
