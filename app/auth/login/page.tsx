import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { AuthForm } from "@/components/auth/AuthForm";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <main className="flex min-h-dvh flex-col bg-surface">
      <header className="mx-auto w-full max-w-md px-5 py-6">
        <Link href="/" className="rounded focus-visible:focus-ring">
          <Logo className="text-ink" />
        </Link>
      </header>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-16">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Welcome back
        </h1>
        <p className="mb-6 mt-1 text-sm text-ink-soft">
          Log in to see your standing and pick up where you left off.
        </p>
        <AuthForm mode="login" initialError={searchParams.error} />
        <p className="mt-5 text-center text-sm text-ink-soft">
          New here?{" "}
          <Link
            href="/auth/signup"
            className="font-medium text-accent hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
