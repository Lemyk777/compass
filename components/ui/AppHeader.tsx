import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";

type NavLink = { href: string; label: string };

export function AppHeader({ links = [] }: { links?: NavLink[] }) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-surface/85 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3">
        <Link href="/dashboard" className="rounded focus-visible:focus-ring">
          <Logo className="text-ink" />
        </Link>
        <div className="flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-xl px-3 py-2 text-sm text-ink-soft hover:bg-ink/5 hover:text-ink focus-visible:focus-ring"
            >
              {l.label}
            </Link>
          ))}
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
