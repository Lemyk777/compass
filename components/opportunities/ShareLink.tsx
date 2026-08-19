"use client";

import { useEffect, useRef, useState } from "react";

// "Send it to a friend" — the whole point of an opportunity having its own
// address.
//
// Three decisions worth keeping:
//
//  1. **It shares OUR url, never the organiser's.** A student who sends the
//     contest's own page sends a page that does not say who can enter, what it
//     costs, or when it closes — the four facts are ours. The friend should
//     land on the card, not on a registration form in a language they may not
//     read.
//  2. **The link travels alone.** `navigator.share` is given a `url` and
//     nothing else: no title, no blurb, no "Check this out on Compass". A
//     share sheet that pastes marketing copy into someone's chat on their
//     behalf is the reason people stop using share buttons. The link unfurls
//     into a card by itself — that is what the Open Graph tags on the page are
//     for.
//  3. **Copy is the fallback, not the second-class option.** `navigator.share`
//     exists on phones and mostly does not on desktop, which is where a student
//     pasting into a chat actually is half the time.
//
// The confirmation is announced, not just coloured: a silent visual state
// change tells a screen-reader user nothing about whether the thing they came
// to do happened.

export function ShareLink({
  /** Absolute or root-relative; resolved against the current origin. */
  path,
  label = "Send to a friend",
}: {
  path: string;
  label?: string;
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const [fallbackUrl, setFallbackUrl] = useState("");
  const fallbackRef = useRef<HTMLInputElement | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  function flash(next: "copied" | "failed") {
    setState(next);
    if (timer.current) window.clearTimeout(timer.current);
    // A failure stays on screen: it comes with the URL to copy by hand, and
    // clearing that after two seconds would take the recovery away with it.
    if (next === "copied") {
      timer.current = window.setTimeout(() => setState("idle"), 2200);
    }
  }

  async function share() {
    const url = new URL(path, window.location.origin).toString();

    // The share sheet first, where there is one. `url` only — see note 2.
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ url });
        return;
      } catch (err) {
        // A cancelled sheet is not a failure and must not show an error.
        if (err instanceof DOMException && err.name === "AbortError") return;
        // Anything else falls through to the clipboard.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      flash("copied");
    } catch {
      // The clipboard can be refused outright — an embedded webview, a browser
      // that wants the document focused, a permission denied. Plenty of our
      // students open links inside a messaging app's webview, so this is a real
      // path and not a theoretical one. "Copy failed" alone is a dead end, so
      // the link itself appears, selected, to be copied by hand.
      setFallbackUrl(url);
      flash("failed");
      requestAnimationFrame(() => fallbackRef.current?.select());
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={share}
        className="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-medium text-ink-soft transition-[background-color,border-color,color,transform] duration-200 ease-out hover:border-accent hover:text-ink active:scale-[0.97] active:duration-75 focus-visible:focus-ring motion-reduce:transform-none motion-reduce:transition-none"
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
          <path d="M12 3v13" />
          <path d="m7 8 5-5 5 5" />
        </svg>
        {state === "copied"
          ? "Link copied"
          : state === "failed"
            ? "Copy failed"
            : label}
      </button>
      {/* Announced separately from the label, because a button whose own text
          changes is not reliably re-read. */}
      <span aria-live="polite" className="sr-only">
        {state === "copied"
          ? "Link copied to clipboard"
          : state === "failed"
            ? "Could not copy the link. It is shown below to copy by hand"
            : ""}
      </span>
      {state === "failed" && fallbackUrl && (
        <label className="mt-2 block w-full basis-full">
          <span className="text-xs text-ink-faint">
            Your browser wouldn&rsquo;t let us copy it. Here is the link:
          </span>
          <input
            ref={fallbackRef}
            readOnly
            value={fallbackUrl}
            onFocus={(e) => e.currentTarget.select()}
            className="mt-1 h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-ink focus-visible:focus-ring"
          />
        </label>
      )}
    </>
  );
}
