"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/client";

/**
 * Live local clock, ticking once a second. Returns `null` until mounted so the
 * first client render matches the server (time-of-day and the current minute
 * depend on the visitor's locale/timezone and can't be rendered on the server
 * without a hydration mismatch). Callers render a neutral, reserved placeholder
 * while it's null, then swap in the real value on mount.
 */
function useNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/**
 * Big time-aware greeting for the dashboard home header. The date/clock live
 * separately in the persistent top bar (DateClock), so this is greeting-only.
 */
export function Greeting({ name }: { name?: string | null }) {
  const t = useT();
  const now = useNow();
  const word = now ? greetingFor(now.getHours(), t) : t("dash.hello");
  const greeting = name ? `${word}, ${name}` : word;
  return (
    <h1 className="text-3xl font-semibold tracking-tight text-ink">{greeting}</h1>
  );
}

/**
 * Compact date + live clock for the persistent top bar — the always-visible
 * "today" anchor across every dashboard page.
 */
export function DateClock() {
  const now = useNow();
  if (!now) {
    // Reserve width so the bar doesn't shift when the real value mounts in.
    return (
      <span aria-hidden className="invisible text-sm">
        Friday, June 00 · 00:00
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 text-sm text-ink-soft motion-safe:animate-fade-up">
      <CalendarIcon />
      <span>{formatDate(now)}</span>
      <span aria-hidden className="text-ink-faint">
        ·
      </span>
      <Clock now={now} />
    </span>
  );
}

function Clock({ now }: { now: Date }) {
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return (
    <span data-num className="font-semibold tabular-nums text-ink">
      {hh}
      {/* Pulsing colon gives the clock a quiet "ticking" life without seconds. */}
      <span className="motion-safe:animate-pulse">:</span>
      {mm}
    </span>
  );
}

function greetingFor(hour: number, t: (k: string) => string): string {
  if (hour < 12) return t("dash.morning");
  if (hour < 18) return t("dash.afternoon");
  return t("dash.evening");
}

function formatDate(d: Date): string {
  // The product is English-only, so pin the date to English ("Friday, June 26")
  // rather than the browser locale — otherwise an English greeting pairs with a
  // localized date (e.g. Russian), which reads as a bug. The clock stays
  // locale-neutral 24h.
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function CalendarIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-ink-faint"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="4.5" width="18" height="16.5" rx="2.5" />
      <path d="M3 9h18M8 3v3M16 3v3" />
    </svg>
  );
}
