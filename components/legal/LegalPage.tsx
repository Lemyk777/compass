import Link from "@/components/ui/Link";
import { Logo } from "@/components/ui/Logo";
import { SKIP_TARGET, SkipLink } from "@/components/ui/SkipLink";

/**
 * Shared chrome for the static legal pages (Privacy Policy, Terms of Use).
 * Plain, readable, single-column prose styled with utility classes (no
 * typography plugin in this project). Public and indexable.
 */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    // Banner and footer are siblings of `main`, not children of it — the same
    // repair as the marketing page. Here the `<article>` IS the main content, so
    // it becomes the landmark rather than gaining a wrapper.
    <div className="min-h-screen bg-[#F7F8FA] text-ink">
      <SkipLink />
      <header className="border-b border-black/10">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
          <Link href="/" aria-label="Compass home">
            <Logo className="text-ink" />
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-ink/60 transition hover:text-ink"
          >
            ← Back to site
          </Link>
        </div>
      </header>

      <main
        id={SKIP_TARGET}
        tabIndex={-1}
        className="mx-auto max-w-3xl px-6 py-12 sm:py-16"
      >
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-sm text-ink-faint">Last updated: {updated}</p>

        <div className="legal-prose mt-10 space-y-8 text-[0.975rem] leading-relaxed text-ink/80">
          {children}
        </div>
      </main>

      <footer className="border-t border-black/10">
        <div className="mx-auto flex max-w-3xl flex-col items-start justify-between gap-3 px-6 py-8 text-sm font-light text-ink-faint sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Compass. Guidance, not guarantees.</p>
          <nav className="flex items-center gap-5">
            <Link href="/privacy" className="transition hover:text-ink/70">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition hover:text-ink/70">
              Terms of Use
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

/** A titled section within a legal page. */
export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
        {heading}
      </h2>
      {children}
    </section>
  );
}
