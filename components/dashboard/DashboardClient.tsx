"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Analysis } from "@/lib/ai/schema";
import { Report } from "@/components/report/Report";
import { ReportNav } from "@/components/dashboard/ReportNav";
import { Logo } from "@/components/ui/Logo";
import { Button, ButtonLink } from "@/components/ui/Button";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { AdminSwitcher } from "@/components/admin/AdminSwitcher";
import { useT } from "@/lib/i18n/client";

type Props = {
  initialAnalysis: Analysis | null;
  name: string | null;
  hasProfile: boolean;
  autoAnalyze: boolean;
  isAdmin?: boolean;
};

export function DashboardClient({
  initialAnalysis,
  name,
  hasProfile,
  autoAnalyze,
  isAdmin = false,
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

      // Parse defensively: on a timeout/crash the platform returns a non-JSON
      // error page, so never assume the body is JSON (that crashed the UI with
      // "Unexpected token 'A'..."). Read text, then try to parse it.
      const raw = await res.text();
      let data: { analysis?: Analysis; error?: string } | null = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        const fallback =
          res.status === 504 || res.status === 408 || res.status === 524
            ? t("dash.errTimeout")
            : res.status === 429
              ? t("dash.errBusy")
              : t("dash.errGeneric");
        throw new Error(data?.error || fallback);
      }
      if (!data?.analysis) throw new Error(t("dash.errGeneric"));

      setAnalysis(data.analysis as Analysis);
      // Clean the ?analyze=1 flag from the URL.
      router.replace("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("dash.errGeneric"));
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
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-y-2 px-5 py-3">
          <Logo className="text-ink" />
          {isAdmin && (
            <AdminSwitcher className="order-last w-full justify-center sm:order-none sm:w-auto" />
          )}
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

      {loading ? (
        <div className="mx-auto max-w-2xl px-5 py-6">
          <LoadingState />
        </div>
      ) : error ? (
        <div className="mx-auto max-w-2xl px-5 py-6">
          <ErrorState error={error} onRetry={runAnalysis} hasProfile={hasProfile} />
        </div>
      ) : analysis ? (
        <div className="mx-auto max-w-6xl px-5 py-6">
          <div className="mb-6 flex items-center justify-between gap-4">
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
          {/* Wide results layout: sticky section rail on the left, report fills
              the rest. Single column on mobile (the rail hides itself). */}
          <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10">
            <ReportNav analysis={analysis} />
            <div className="min-w-0">
              <Report analysis={analysis} name={name} />
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-2xl px-5 py-6">
          <EmptyState hasProfile={hasProfile} onRun={runAnalysis} />
        </div>
      )}
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
