import Link from "@/components/ui/Link";
import { Logo } from "@/components/ui/Logo";

import { AuthForm } from "@/components/auth/AuthForm";
import { AuthAside } from "@/components/marketing/AuthAside";
import { getT } from "@/lib/i18n/server";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const t = getT();
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col bg-surface">
        <header className="mx-auto flex w-full max-w-md items-center justify-between px-5 py-6">
          <Link href="/" className="rounded focus-visible:focus-ring">
            <Logo className="text-ink" style={{ viewTransitionName: "brand-logo" }} />
          </Link>
        </header>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-16">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            {t("auth.welcomeBack")}
          </h1>
          <p className="mb-6 mt-1 text-sm text-ink-soft">{t("auth.loginSub")}</p>
          <AuthForm mode="login" initialError={searchParams.error} />
          <p className="mt-5 text-center text-sm text-ink-soft">
            {t("auth.newHere")}{" "}
            <Link
              href="/auth/signup"
              className="font-medium text-accent hover:underline"
            >
              {t("auth.createAccount")}
            </Link>
          </p>
        </div>
      </div>

      <AuthAside t={t} />
    </main>
  );
}
