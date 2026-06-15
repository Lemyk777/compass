import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-surface px-5 text-center">
      <Logo className="mb-6 text-ink" />
      <h1 className="font-display text-4xl font-semibold text-ink">404</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-soft">
        We couldn&apos;t find that page.
      </p>
      <ButtonLink href="/" variant="subtle" size="lg" className="mt-6">
        Back home
      </ButtonLink>
    </main>
  );
}
