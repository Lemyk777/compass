"use client";

import Link from "@/components/ui/Link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Shell } from "@/components/ui/Shell";

// The nav for the student's own half of the site. Two destinations, both about
// the student's future — what you can enter, and where it leads. The admission
// report is deliberately NOT one of them: it sits to the right as a secondary
// link, because it is now one input into this, not the thing the site is.

const LINKS: { href: string; label: string; hint: string }[] = [
  { href: "/opportunities", label: "Opportunities", hint: "What you can enter" },
  { href: "/planner", label: "Plan", hint: "What to do next" },
  { href: "/guide", label: "Guide", hint: "Where it leads" },
];

export function StudentNav({
  isAdmin = false,
  hasReport = false,
}: {
  isAdmin?: boolean;
  hasReport?: boolean;
}) {
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur"
      style={{ viewTransitionName: "header" }}
    >
      {/* Same container as the content below it — a header that stops short of
          where the page starts is the thing that makes a wide layout look
          broken. */}
      <Shell className="flex flex-wrap items-center gap-x-5 gap-y-3 py-3">
        <Link href="/opportunities" className="shrink-0 focus-visible:focus-ring">
          <Logo className="text-ink" style={{ viewTransitionName: "brand-logo" }} />
        </Link>

        <nav aria-label="Compass" className="flex items-center gap-1">
          {LINKS.map((l) => {
            const on = pathname === l.href || pathname.startsWith(`${l.href}/`);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={on ? "page" : undefined}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:focus-ring ${
                  on
                    ? "bg-accent-soft text-accent-ink"
                    : "text-ink-soft hover:bg-card hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Link
            href="/dashboard"
            className="rounded-xl px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-card hover:text-ink focus-visible:focus-ring"
          >
            {hasReport ? "Your report" : "Full report"}
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="rounded-xl px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-card hover:text-ink focus-visible:focus-ring"
            >
              Admin
            </Link>
          )}
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="rounded-xl px-3 py-2 text-sm font-medium text-ink-faint transition-colors hover:text-ink focus-visible:focus-ring"
            >
              Sign out
            </button>
          </form>
        </div>
      </Shell>
    </header>
  );
}
