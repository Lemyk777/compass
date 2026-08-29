"use client";

import { useEffect, useRef, useState } from "react";
import Link from "@/components/ui/Link";
import { usePathname } from "next/navigation";
import { BrandLink } from "@/components/ui/BrandLink";
import { Shell } from "@/components/ui/Shell";

// The nav for the student's own half of the site.
//
// Shape: brand hard left, destinations hard right, account at the far end. That
// is the arrangement every reader already knows, and the point of following it
// is that navigation is the one place originality costs more than it returns.
//
// Three things here are fixes rather than layout:
//
//   • THE ORDER IS THE PRODUCT'S OWN. Opportunities → Guide → Plan: what you
//     can enter, where it leads, then it becomes work. It shipped as
//     Opportunities → Plan → Guide, which disagreed with the landing page, with
//     the guide's own "next step" footer, and with the sentence we use to
//     explain ourselves.
//   • SIGN OUT IS NOT A TOP-LEVEL CONTROL. It was a button sitting permanently
//     in the header — the most destructive action on the page, one stray tap
//     from a student's session, and directly beside the links they actually
//     want. It lives behind the account menu now, which is also where everyone
//     looks for it.
//   • THE HEADER DOES NOT WRAP. `flex-wrap` turned a phone's header into two or
//     three ragged rows whose height changed with the admin flag. One row, and
//     the section links scroll if they must.

const LINKS: { href: string; label: string }[] = [
  { href: "/opportunities", label: "Opportunities" },
  { href: "/guide", label: "Guide" },
  { href: "/planner", label: "Advisory" },
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
      className="sticky top-0 z-30 border-b border-line/60 bg-surface/80 backdrop-blur-md transition-colors"
      style={{ viewTransitionName: "header" }}
    >
      {/* Same container as the content below it — a header that stops short of
          where the page starts is what makes a wide layout look broken. */}
      <Shell className="flex items-center gap-3 py-3">
        <BrandLink />

        <nav
          aria-label="Compass"
          // Scrolls rather than wraps on a narrow phone, and the scrollbar is
          // hidden because a 3-item nav that shows a track reads as broken.
          className="ml-auto flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {LINKS.map((l) => {
            const on = pathname === l.href || pathname.startsWith(`${l.href}/`);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={on ? "page" : undefined}
                className={`inline-flex min-h-11 items-center whitespace-nowrap rounded-xl px-3.5 text-sm font-medium transition-all focus-visible:focus-ring ${
                  on
                    ? "bg-accent-soft/85 text-accent-ink font-semibold shadow-sm"
                    : "text-ink-soft hover:bg-card/80 hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <AccountMenu isAdmin={isAdmin} hasReport={hasReport} />
      </Shell>
    </header>
  );
}

/**
 * Everything that is about the ACCOUNT rather than about the plan: the report,
 * the admin console, and signing out.
 *
 * Native `<details>` rather than a hand-built menu — it is a disclosure, it is
 * keyboard-operable for free, and it needs no state. The two things `<details>`
 * does not give are added because a menu without them is a trap: **Escape
 * closes it, and so does a click outside.** Both listeners are removed when the
 * menu is shut, so a page with a closed menu carries no handlers at all.
 */
function AccountMenu({
  isAdmin,
  hasReport,
}: {
  isAdmin: boolean;
  hasReport: boolean;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => {
      if (ref.current) ref.current.open = false;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      close();
      // Focus returns to the control that opened it, or the next Tab starts
      // from the top of the document.
      ref.current?.querySelector("summary")?.focus();
    };
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onClick);
    };
  }, [open]);

  return (
    <details
      ref={ref}
      open={open}
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
      // `group` is not decoration: the chevron below is `group-open:rotate-180`,
      // which Tailwind compiles to `.group[open] .group-open\:rotate-180`. With
      // no `group` on this element that selector matched nothing, so the arrow
      // never turned while the menu was open — for the whole life of the
      // component. Nothing catches it: the class is one Tailwind can generate,
      // so `no-custom-classname` passes, the build is green and a review reads
      // the intent rather than the selector. Same shape as the four modals that
      // carried `animate-in fade-in zoom-in-95` from an uninstalled plugin.
      className="group relative shrink-0"
    >
      <summary
        aria-label="Account"
        className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-xl px-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-card hover:text-ink focus-visible:focus-ring"
      >
        <span
          aria-hidden="true"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-[12px] font-semibold text-accent-ink"
        >
          {/* A mark, not a photo. We never asked for one, and a generic grey
              avatar is the placeholder that tells a reader nothing. */}
          &#9679;
        </span>
        <svg
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>

      <div className="absolute right-0 top-full z-40 mt-1.5 w-56 rounded-2xl border border-line/70 bg-card/95 backdrop-blur-xl p-1.5 shadow-lift">
        <MenuLink href="/dashboard">
          {hasReport ? "Your report" : "Full report"}
        </MenuLink>
        {isAdmin && <MenuLink href="/admin">Admin</MenuLink>}
        <div className="my-1.5 border-t border-line/60" />
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm font-medium text-ink-soft transition-colors hover:bg-surface hover:text-ink focus-visible:focus-ring"
          >
            Sign out
          </button>
        </form>
      </div>
    </details>
  );
}

function MenuLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-ink-soft transition-colors hover:bg-surface hover:text-ink focus-visible:focus-ring"
    >
      {children}
    </Link>
  );
}
