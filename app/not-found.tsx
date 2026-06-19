import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { getT } from "@/lib/i18n/server";

export default function NotFound() {
  const t = getT();
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-surface px-5 text-center">
      <Logo className="mb-6 text-ink" />
      <h1 className="font-display text-4xl font-semibold text-ink">404</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-soft">{t("nf.body")}</p>
      <ButtonLink href="/" variant="subtle" size="lg" className="mt-6">
        {t("nf.back")}
      </ButtonLink>
    </main>
  );
}
