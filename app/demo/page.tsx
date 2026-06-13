import Link from "next/link";
import { Report } from "@/components/report/Report";
import { Logo } from "@/components/ui/Logo";
import { SAMPLE_ANALYSIS } from "@/lib/ai/sample";

// Public preview of the results dashboard using the §12 sample student.
// Lets you (and the founder) see the design without Supabase/Anthropic set up.
export const metadata = { title: "Compass — Scorecard preview" };

export default function DemoPage() {
  return (
    <main className="min-h-dvh bg-surface">
      <header className="sticky top-0 z-10 border-b border-line bg-surface/85 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3">
          <Logo className="text-ink" />
          <Link
            href="/"
            className="rounded px-2 py-1 text-sm text-ink-soft hover:text-ink focus-visible:focus-ring"
          >
            Home
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-2xl px-5 py-6">
        <div className="mb-6">
          <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent-ink">
            Sample report
          </span>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
            Aizhan&apos;s standing
          </h1>
          <p className="text-sm text-ink-soft">
            A preview built from a sample student profile.
          </p>
        </div>
        <Report analysis={SAMPLE_ANALYSIS} name="Aizhan" />
      </div>
    </main>
  );
}
