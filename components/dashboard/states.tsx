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
      <h2 className="mt-5 text-lg font-semibold text-ink">
        {t("dash.loadingTitle")}
      </h2>
      <p className="mt-1 max-w-xs text-sm text-ink-soft">
        {t("dash.loadingBody")}
      </p>
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
        <ReadinessCard />
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
      {/* Growth mode: these two sections are deterministic and already open —
          a thin-portfolio student gets value before (or instead of) analyzing. */}
      <EmptyStatePreLinks />
      <ReadinessCard />
    </div>
  );
}

/**
 * Endowed-progress readiness (research rule 8). Shows how far along the profile
 * already is, pre-credited for what we know — so the bar opens part-filled, the
 * documented counter-move to the 44% who signed up and filled in nothing.
 *
 * Self-hides when there is nothing to nudge: in demo (no real profile), when the
 * profile is already complete, or before the layout has supplied a readiness
 * summary. Copy is deliberately non-coercive — completion is invited, never
 * required — to stay consistent with FirstWin's stance in onboarding.
 */
function ReadinessCard() {
  const { readiness, demo } = useDashboard();
  if (demo || !readiness || readiness.allDone) return null;

  const { items, done, total } = readiness;
  const pct = Math.round((done / total) * 100);

  return (
    <section
      aria-label="Profile readiness"
      className="mt-8 w-full max-w-md rounded-2xl border border-line bg-card p-5 text-left"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink">
          {done > 0
            ? `You're already ${done} of ${total} of the way there`
            : "A few things sharpen what Compass shows you"}
        </h2>
        <span data-num className="shrink-0 text-xs font-medium text-ink-faint">
          {done}/{total}
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
        className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-line"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="mt-4 space-y-2.5">
        {items.map((it) =>
          it.done ? (
            <li key={it.key} className="flex items-start gap-2.5 text-sm">
              <CheckDot done />
              <span className="text-ink-faint line-through decoration-line">
                {it.label}
              </span>
            </li>
          ) : (
            <li key={it.key}>
              <a
                href="/onboarding"
                className="group flex items-start gap-2.5 rounded-lg text-sm focus-visible:focus-ring"
              >
                <CheckDot done={false} />
                <span>
                  <span className="font-medium text-ink group-hover:underline">
                    {it.label}
                  </span>
                  <span className="block text-xs text-ink-soft">{it.hint}</span>
                </span>
              </a>
            </li>
          ),
        )}
      </ul>

      {/* Anti-coercion line — true, and load-bearing: Opportunities works with
          none of this filled in, so nothing here is being held hostage. */}
      <p className="mt-4 text-xs leading-relaxed text-ink-soft">
        Add these whenever you like — each one sharpens what we show you, and
        none of it is required to use your opportunities.
      </p>
    </section>
  );
}

/** Filled check for a done item, hollow ring for one still to do. */
function CheckDot({ done }: { done: boolean }) {
  if (done) {
    return (
      <svg
        viewBox="0 0 20 20"
        aria-hidden
        className="mt-0.5 h-4 w-4 shrink-0 text-accent"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  return (
    <span
      aria-hidden
      className="mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 border-line"
    />
  );
}

function EmptyStatePreLinks() {
  const t = useT();
  const { basePath } = useDashboard();
  return (
    <p className="mt-4 max-w-sm text-sm text-ink-soft">
      {t("dash.emptyPreLinksLead")}{" "}
      <a
        href={`${basePath}/opportunities`}
        className="font-medium text-accent-ink hover:underline"
      >
        {t("nav.opportunities")}
      </a>{" "}
      {t("dash.emptyPreLinksAnd")}{" "}
      <a
        href={`${basePath}/plan`}
        className="font-medium text-accent-ink hover:underline"
      >
        {t("nav.plan")}
      </a>{" "}
      {t("dash.emptyPreLinksTail")}
    </p>
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
      <p className="mt-2 max-w-sm text-sm text-ink-soft">
        {t("dash.noAnalysisBody")}
      </p>
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
              on ? "bg-accent text-on-fill" : "text-ink-soft hover:text-ink"
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

// Shown on the odds/costs pages when the active country tab has no college list
// yet (e.g. the student built a US list but hasn't picked Italy programs). Points
// them at the multi-country builder, which opens on the active country tab.
export function EmptyCountryList({ code }: { code: DestinationCode }) {
  const { basePath } = useDashboard();
  const d = DESTINATIONS.find((x) => x.code === code);
  const label = useT()(d?.labelKey ?? "");
  return (
    <div className="rounded-2xl border border-dashed border-line bg-card px-6 py-12 text-center">
      <h2 className="text-lg font-semibold tracking-tight text-ink">
        No {label} universities yet
      </h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">
        Add the {label} universities or programs you&apos;re aiming for and
        Compass will score your admission odds at each.
      </p>
      <ButtonLink href={`${basePath}/college-list`} size="lg" className="mt-6">
        Build your {label} list
      </ButtonLink>
    </div>
  );
}

// Title + subtitle shown at the top of every section page.
export function PageHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        {title}
      </h1>
      {hint && <p className="mt-1 text-sm text-ink-soft">{hint}</p>}
    </div>
  );
}
