"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Analysis } from "@/lib/ai/schema";
import { Report } from "@/components/report/Report";
import { Logo } from "@/components/ui/Logo";
import { Button, ButtonLink } from "@/components/ui/Button";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useT } from "@/lib/i18n/client";

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
  const t = useT();
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
              {t("common.updateProfile")}
            </ButtonLink>
            <LanguageToggle className="mx-1" />
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="ghost" size="sm">
                {t("common.signOut")}
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
                  {t("dash.yourStanding")}
                </h1>
                <p className="text-sm text-ink-soft">{t("dash.basedOn")}</p>
              </div>
              <Button variant="subtle" size="sm" onClick={runAnalysis}>
                {t("dash.reanalyze")}
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
  const t = useT();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-line border-t-accent" />
      <h2 className="mt-5 text-lg font-semibold text-ink">
        {t("dash.loadingTitle")}
      </h2>
      <p className="mt-1 max-w-xs text-sm text-ink-soft">{t("dash.loadingBody")}</p>
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
  const t = useT();
  if (!hasProfile) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {t("dash.emptyNoProfileTitle")}
        </h1>
        <p className="mt-2 max-w-sm text-sm text-ink-soft">
          {t("dash.emptyNoProfileBody")}
        </p>
        <ButtonLink href="/onboarding" size="lg" className="mt-6">
          {t("dash.startProfile")}
        </ButtonLink>
      </div>
    );
  }
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        {t("dash.emptyReadyTitle")}
      </h1>
      <p className="mt-2 max-w-sm text-sm text-ink-soft">
        {t("dash.emptyReadyBody")}
      </p>
      <Button size="lg" className="mt-6" onClick={onRun}>
        {t("dash.seeStanding")}
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
  const t = useT();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-xl font-semibold tracking-tight text-ink">
        {t("dash.errTitle")}
      </h1>
      <p className="mt-2 max-w-sm text-sm text-ink-soft">{error}</p>
      <div className="mt-6 flex gap-3">
        {hasProfile && (
          <Button size="lg" onClick={onRetry}>
            {t("common.tryAgain")}
          </Button>
        )}
        <ButtonLink href="/onboarding" variant="subtle" size="lg">
          {t("dash.editProfile")}
        </ButtonLink>
      </div>
    </div>
  );
}
