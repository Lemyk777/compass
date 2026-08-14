import Link from "@/components/ui/Link";
import { BrandLink } from "@/components/ui/BrandLink";
import { Button } from "@/components/ui/Button";
import { AdminSwitcher } from "@/components/admin/AdminSwitcher";
import { getT } from "@/lib/i18n/server";

type NavLink = { href: string; label: string };

export function AppHeader({
  links = [],
  admin = false,
  wide = false,
}: {
  links?: NavLink[];
  admin?: boolean;
  /** Match a wider page body (tables that don't fit the default column). */
  wide?: boolean;
}) {
  const t = getT();
  return (
    <header
      className="sticky top-0 z-10 border-b border-line bg-surface/85 backdrop-blur"
      style={{ viewTransitionName: "header" }}
    >
      <div
        className={`mx-auto flex flex-wrap items-center justify-between gap-y-2 px-5 py-3 ${
          wide ? "max-w-5xl" : "max-w-2xl"
        }`}
      >
        <BrandLink />

        {admin && (
          <AdminSwitcher className="order-last w-full justify-center sm:order-none sm:w-auto" />
        )}
        <div className="flex items-center gap-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-xl px-3 py-3 text-sm text-ink-soft hover:bg-ink/5 hover:text-ink focus-visible:focus-ring"
            >
              {l.label}
            </Link>
          ))}
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
