"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { siteUrl } from "@/lib/site";
import { Button } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Input";

type Mode = "login" | "signup";

export function AuthForm({
  mode,
  initialError,
}: {
  mode: Mode;
  initialError?: string;
}) {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<"email" | "google" | null>(null);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [checkEmail, setCheckEmail] = useState(false);

  // Forward an explicit return target if one was passed (e.g. a gated page
  // redirected here). Otherwise let the callback route by role.
  const nextParam =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("next")
      : null;
  const safeNext =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : null;
  const callbackPath = safeNext
    ? `/auth/callback?next=${encodeURIComponent(safeNext)}`
    : "/auth/callback";
  const callbackUrl = `${siteUrl()}${callbackPath}`;

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading("email");
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: callbackUrl },
        });
        if (error) throw error;
        if (data.session) {
          // Email confirmation disabled — straight in.
          window.location.assign(callbackPath);
        } else {
          setCheckEmail(true);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        window.location.assign(callbackPath);
      }
    } catch (err) {
      setError(messageFor(err));
      setLoading(null);
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoading("google");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl },
    });
    if (error) {
      setError(messageFor(error));
      setLoading(null);
    }
  }

  if (checkEmail) {
    return (
      <div className="rounded-2xl border border-line bg-card p-6 text-center shadow-card">
        <h2 className="text-lg font-semibold text-ink">Check your inbox</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          We sent a confirmation link to <strong>{email}</strong>. Open it on
          this device to finish creating your account.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-card p-6 shadow-card">
      <Button
        type="button"
        variant="subtle"
        size="lg"
        className="w-full"
        onClick={handleGoogle}
        disabled={loading !== null}
      >
        <GoogleMark />
        {loading === "google" ? "Connecting…" : "Continue with Google"}
      </Button>

      <div className="my-5 flex items-center gap-3 text-xs text-ink-faint">
        <span className="h-px flex-1 bg-line" />
        or with email
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={handleEmail} className="space-y-4">
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </Field>
        <Field
          label="Password"
          htmlFor="password"
          hint={mode === "signup" ? "At least 6 characters." : undefined}
        >
          <Input
            id="password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </Field>

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-reach-soft px-3 py-2 text-sm text-reach"
          >
            {error}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={loading !== null}
        >
          {loading === "email"
            ? "One moment…"
            : mode === "signup"
              ? "Create account"
              : "Log in"}
        </Button>
      </form>
    </div>
  );
}

function messageFor(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/configuration|fetch|Failed to fetch/i.test(msg))
    return "Authentication isn't configured yet. Add your Supabase keys to continue.";
  return msg || "Something went wrong. Please try again.";
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}
