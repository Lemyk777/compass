"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-surface px-5 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        {t("err.title")}
      </h1>
      <p className="mt-2 max-w-sm text-sm text-ink-soft">{t("err.body")}</p>
      <div className="mt-6 flex gap-3">
        <Button size="lg" onClick={() => reset()}>
          {t("common.tryAgain")}
        </Button>
        <ButtonLink href="/dashboard" variant="subtle" size="lg">
          {t("err.goDashboard")}
        </ButtonLink>
      </div>
    </main>
  );
}
