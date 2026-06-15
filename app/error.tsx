"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-surface px-5 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-sm text-sm text-ink-soft">
        That page hit an error. Try again, or head back to your dashboard.
      </p>
      <div className="mt-6 flex gap-3">
        <Button size="lg" onClick={() => reset()}>
          Try again
        </Button>
        <ButtonLink href="/dashboard" variant="subtle" size="lg">
          Go to dashboard
        </ButtonLink>
      </div>
    </main>
  );
}
