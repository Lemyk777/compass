import Link from "next/link";
import { cookies } from "next/headers";
import { Logo } from "@/components/ui/Logo";
import { AuthForm } from "@/components/auth/AuthForm";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { REF_COOKIE } from "@/lib/supabase/middleware";
import { getT } from "@/lib/i18n/server";

export default function SignupPage() {
  const ref = cookies().get(REF_COOKIE)?.value;
  const t = getT();

  return (
    <main className="flex min-h-dvh flex-col bg-surface">
      <header className="mx-auto flex w-full max-w-md items-center justify-between px-5 py-6">
        <Link href="/" className="rounded focus-visible:focus-ring">
          <Logo className="text-ink" />
        </Link>
        <LanguageToggle />
      </header>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-16">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {t("auth.buildTitle")}
        </h1>
        <p className="mb-6 mt-1 text-sm text-ink-soft">{t("auth.signupSub")}</p>
        {ref && (
          <p className="mb-4 inline-flex items-center gap-2 self-start rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {t("auth.referredBy")} {ref}
          </p>
        )}
        <AuthForm mode="signup" />
        <p className="mt-5 text-center text-sm text-ink-soft">
          {t("auth.haveAccount")}{" "}
          <Link
            href="/auth/login"
            className="font-medium text-accent hover:underline"
          >
            {t("common.logIn")}
          </Link>
        </p>
      </div>
    </main>
  );
}
