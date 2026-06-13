import { requireSession } from "@/lib/auth/session";
import { Logo } from "@/components/ui/Logo";

// Placeholder — the results dashboard is built in M4.
export default async function DashboardPage() {
  const session = await requireSession("/dashboard");
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-6">
      <Logo className="text-ink" />
      <div className="flex flex-1 flex-col justify-center">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Profile saved.
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          The analysis engine and results dashboard land here next ({session.email}).
        </p>
      </div>
    </main>
  );
}
