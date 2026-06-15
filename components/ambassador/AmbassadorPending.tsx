"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/Button";

// Shown when a signed-in user opens /ambassador but isn't an approved
// ambassador yet. The "Check approval" button re-runs the server query — if the
// founder has since added them, the page swaps to the hub automatically.
export function AmbassadorPending() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [checkedOnce, setCheckedOnce] = useState(false);

  function check() {
    setChecking(true);
    router.refresh();
    // If approved, this component unmounts before the timeout fires.
    setTimeout(() => {
      setChecking(false);
      setCheckedOnce(true);
    }, 1500);
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-target-soft text-[#8A5410]">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        You&apos;re not confirmed yet
      </h1>
      <p className="mt-2 max-w-sm text-sm text-ink-soft">
        Your ambassador status hasn&apos;t been approved yet. Once the Compass team
        confirms you, your referral link and stats will appear here.
      </p>

      {checkedOnce && !checking && (
        <p className="mt-4 rounded-lg bg-target-soft px-3 py-2 text-sm text-[#8A5410]">
          Still pending — check back a little later.
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <Button size="lg" onClick={check} disabled={checking}>
          {checking ? "Checking…" : "Check approval"}
        </Button>
        <ButtonLink href="/onboarding" variant="subtle" size="lg">
          Back
        </ButtonLink>
      </div>
    </div>
  );
}
