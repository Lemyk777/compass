import { requireSession } from "@/lib/auth/session";
import { Logo } from "@/components/ui/Logo";

// Placeholder — the full multi-step intake is built in M2.
export default async function OnboardingPage() {
  const session = await requireSession("/onboarding");
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-6">
      <Logo className="text-ink" />
      <div className="flex flex-1 flex-col justify-center">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          You&apos;re in{session.full_name ? `, ${session.full_name}` : ""}.
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          The profile intake lands here next. Signed in as {session.email}.
        </p>
      </div>
    </main>
  );
}
