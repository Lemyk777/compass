"use client";

import Link from "@/components/ui/Link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n/client";

/**
 * Top-of-page view switcher shown only to admins. Lets a founder jump between
 * the public landing, their results dashboard, and the project statistics
 * without hunting for URLs. Rendered by each header only when the user is an
 * admin; the active tab is derived from the current path.
 */
const ITEMS = [
  { href: "/", key: "adminNav.landing", isActive: (p: string) => p === "/" },
  {
    href: "/dashboard",
    key: "adminNav.results",
    isActive: (p: string) => p.startsWith("/dashboard"),
  },
  {
    href: "/admin",
    key: "adminNav.stats",
    isActive: (p: string) => p.startsWith("/admin"),
  },
] as const;

export function AdminSwitcher({ className = "" }: { className?: string }) {
  const t = useT();
  const pathname = usePathname() || "/";

  return (
    <nav
      aria-label="Admin views"
      className={`inline-flex items-center rounded-full border border-line bg-card p-0.5 ${className}`}
    >
      {ITEMS.map((it) => {
        const active = it.isActive(pathname);
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus-visible:focus-ring ${
              active
                ? "bg-ink text-white"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            {t(it.key)}
          </Link>
        );
      })}
    </nav>
  );
}
