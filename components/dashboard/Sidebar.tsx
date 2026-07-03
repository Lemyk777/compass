"use client";

import Link from "@/components/ui/Link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Button, ButtonLink } from "@/components/ui/Button";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { useT } from "@/lib/i18n/client";

// One source of truth for the nav. `slug: ""` is the dashboard overview itself.
const SECTIONS: { slug: string; labelKey: string; icon: keyof typeof ICONS }[] = [
  { slug: "", labelKey: "common.dashboard", icon: "grid" },
  { slug: "standing", labelKey: "nav.standing", icon: "user" },
  { slug: "rankings", labelKey: "nav.rankings", icon: "trophy" },
  { slug: "odds", labelKey: "nav.results", icon: "bars" },
  { slug: "costs", labelKey: "nav.costs", icon: "dollar" },
  { slug: "plan", labelKey: "nav.plan", icon: "calendar" },
  { slug: "opportunities", labelKey: "nav.opportunities", icon: "spark" },
  { slug: "summary", labelKey: "nav.summary", icon: "list" },
];

export function Sidebar() {
  const t = useT();
  const pathname = usePathname();
  const { basePath, isAdmin, demo } = useDashboard();

  const hrefFor = (slug: string) => (slug ? `${basePath}/${slug}` : basePath);
  const isActive = (slug: string) => {
    const href = hrefFor(slug);
    return slug === "" ? pathname === href : pathname.startsWith(href);
  };

  return (
    <aside
      className="border-line bg-card lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-64 lg:shrink-0 lg:flex-col lg:border-r"
      style={{ viewTransitionName: "sidebar" }}
    >
      <div className="hidden px-6 py-6 lg:block">
        <Logo className="text-ink" style={{ viewTransitionName: "brand-logo" }} />
      </div>


      <nav
        aria-label="Dashboard"
        // Mobile: wrap every section so all of them are visible at once (a
        // horizontal scroller hid Costs/Plan/Timeline/Summary off the right edge
        // with no scroll affordance). Desktop: vertical rail.
        className="flex flex-wrap gap-2 border-b border-line px-3 py-3 lg:flex-1 lg:flex-col lg:flex-nowrap lg:gap-2 lg:border-b-0 lg:px-3 lg:py-2"
      >
        {SECTIONS.map((s) => {
          const on = isActive(s.slug);
          return (
            <Link
              key={s.slug || "overview"}
              href={hrefFor(s.slug)}
              aria-current={on ? "page" : undefined}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors focus-visible:focus-ring lg:shrink ${
                on
                  ? "bg-accent-soft text-accent-ink"
                  : "text-ink-soft hover:bg-surface hover:text-ink"
              }`}
            >
              <span className={on ? "text-accent" : "text-ink-faint"}>
                {ICONS[s.icon]}
              </span>
              <span className="whitespace-nowrap">{t(s.labelKey)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Account actions. Mobile: a compact wrapping row under the nav (was
          hidden entirely below lg, so Update profile / Sign out were unreachable
          on phones). Desktop: the vertical block pinned to the sidebar bottom. */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line p-3 lg:flex-col lg:items-stretch lg:border-b-0 lg:border-t lg:p-4">
        {demo ? (
          <ButtonLink href="/" variant="tonal" size="sm" className="lg:w-full">
            <HomeGlyph /> {t("common.home")}
          </ButtonLink>
        ) : (
          <>
            {isAdmin && (
              <ButtonLink href="/admin" variant="tonal" size="sm" className="lg:w-full">
                <ShieldGlyph /> Admin
              </ButtonLink>
            )}
            <ButtonLink href="/" variant="tonal" size="sm" className="lg:w-full">
              <HomeGlyph /> {t("common.home")}
            </ButtonLink>
            <ButtonLink href="/onboarding" variant="tonal" size="sm" className="lg:w-full">
              <EditGlyph /> {t("common.updateProfile")}
            </ButtonLink>
            {/* Separate the destructive action from normal nav (destructive-nav-separation). */}
            <div className="my-1 hidden h-px w-full bg-line lg:block" aria-hidden />
            <form action="/auth/signout" method="post" className="lg:w-full">
              <Button type="submit" variant="danger" size="sm" className="lg:w-full">
                <LogoutGlyph /> {t("common.signOut")}
              </Button>
            </form>
          </>
        )}
      </div>
    </aside>
  );
}

const iconCls = "h-[18px] w-[18px]";
const ICONS = {
  grid: (
    <svg className={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  user: (
    <svg className={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  ),
  trophy: (
    <svg className={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
    </svg>
  ),
  bars: (
    <svg className={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M21 20H3" />
    </svg>
  ),
  dollar: (
    <svg className={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18" />
      <path d="M16.5 7.5A3.5 3.5 0 0 0 13 5h-1.5a3 3 0 0 0 0 6h1a3 3 0 0 1 0 6H10a3.5 3.5 0 0 1-3.5-2.5" />
    </svg>
  ),
  check: (
    <svg className={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="m8 12 2.5 2.5L16 9" />
    </svg>
  ),
  calendar: (
    <svg className={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4.5" width="18" height="16.5" rx="2.5" />
      <path d="M3 9h18M8 3v3M16 3v3" />
    </svg>
  ),
  spark: (
    <svg className={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
    </svg>
  ),
  list: (
    <svg className={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6h13M8 12h13M8 18h13" />
      <path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
    </svg>
  ),
} as const;

// ── Account-action glyphs (16px, matched to the nav icon style) ──────────────
const glyphCls = "h-4 w-4 shrink-0";

function HomeGlyph() {
  return (
    <svg className={glyphCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  );
}

function EditGlyph() {
  return (
    <svg className={glyphCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function ShieldGlyph() {
  return (
    <svg className={glyphCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3 5 6v5c0 4 3 6.5 7 8 4-1.5 7-4 7-8V6l-7-3Z" />
    </svg>
  );
}

// Coral-tinted so the destructive action reads as distinct even before hover.
function LogoutGlyph() {
  return (
    <svg className={`${glyphCls} text-reach`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3" />
      <path d="M10 17 5 12l5-5" />
      <path d="M5 12h11" />
    </svg>
  );
}
