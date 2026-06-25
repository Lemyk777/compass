"use client";

import { Button, ButtonLink } from "@/components/ui/Button";
import { Flag } from "@/components/ui/Flag";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { DESTINATIONS, type DestinationCode } from "@/lib/data/destinations";
import { useT } from "@/lib/i18n/client";

export function LoadingState() {
  const t = useT();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-line border-t-accent" />
      <h2 className="mt-5 text-lg font-semibold text-ink">{t("dash.loadingTitle")}</h2>
      <p className="mt-1 max-w-xs text-sm text-ink-soft">{t("dash.loadingBody")}</p>
    </div>
  );
}

export function EmptyState({
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
      <p className="mt-2 max-w-sm text-sm text-ink-soft">{t("dash.emptyReadyBody")}</p>
      <Button size="lg" className="mt-6" onClick={onRun}>
        {t("dash.seeStanding")}
      </Button>
    </div>
  );
}

export function ErrorState({
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

// Shown on a section page (standing, odds, …) when no analysis exists yet — it
// points the user back to the overview, which owns the "run analysis" flow.
export function NoAnalysisYet() {
  const t = useT();
  const { basePath } = useDashboard();
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
      <h1 className="text-xl font-semibold tracking-tight text-ink">
        {t("dash.noAnalysisTitle")}
      </h1>
      <p className="mt-2 max-w-sm text-sm text-ink-soft">{t("dash.noAnalysisBody")}</p>
      <ButtonLink href={basePath} size="lg" className="mt-6">
        {t("dash.goDashboard")}
      </ButtonLink>
    </div>
  );
}

// Country switcher (US / Italy / Hong Kong) wired to the shared context, so the
// choice carries across the standing / odds / costs pages.
export function CountryTabs() {
  const t = useT();
  const { tabs, country, setCountry } = useDashboard();
  if (tabs.length < 2) return null;
  return (
    <div className="inline-flex rounded-xl border border-line bg-card p-1">
      {tabs.map((code: DestinationCode) => {
        const d = DESTINATIONS.find((x) => x.code === code);
        if (!d) return null;
        const on = code === country;
        return (
          <button
            key={code}
            type="button"
            aria-pressed={on}
            onClick={() => setCountry(code)}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus-visible:focus-ring ${
              on ? "bg-accent text-white" : "text-ink-soft hover:text-ink"
            }`}
          >
            <Flag code={code} />
            {t(d.labelKey)}
          </button>
        );
      })}
    </div>
  );
}

// Title + subtitle shown at the top of every section page.
export function PageHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
      {hint && <p className="mt-1 text-sm text-ink-soft">{hint}</p>}
    </div>
  );
}
