import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { AdminSwitcher } from "@/components/admin/AdminSwitcher";
import { getT } from "@/lib/i18n/server";

type NavLink = { href: string; label: string };

export function AppHeader({
  links = [],
  admin = false,
}: {
  links?: NavLink[];
  admin?: boolean;
}) {
  const t = getT();
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-surface/85 backdrop-blur">
      <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-y-2 px-5 py-3">
        <Link href="/dashboard" className="rounded focus-visible:focus-ring">
          <Logo className="text-ink" />
        </Link>
        {admin && <AdminSwitcher className="order-last w-full justify-center sm:order-none sm:w-auto" />}
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
          <LanguageToggle className="mx-1" />
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="ghost" size="sm">
              {t("common.signOut")}
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
