"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type AuthMethodHint = "google-only" | "has-password" | "unknown";

/**
 * Best-effort lookup of how an email's account can sign in. Used ONLY to show a
 * friendlier message after a failed password attempt — e.g. when the account
 * was created with Google and has no password, we can say so instead of the
 * generic "invalid login credentials".
 *
 * Runs with the service role (server-only). Returns "unknown" on any failure or
 * ambiguity so the caller falls back to the normal error — this must never
 * block a real sign-in. We only ever assert "google-only" when we positively
 * see a Google identity AND no email/password identity.
 *
 * Note: this is only consulted after the user has already proven they know the
 * email (they just tried to log in with it), so it doesn't add a meaningful
 * account-enumeration surface beyond what the login form already exposes.
 */
export async function lookupAuthMethod(rawEmail: string): Promise<AuthMethodHint> {
  const email = rawEmail.trim().toLowerCase();
  if (!email) return "unknown";

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    // Service role not configured (e.g. local dev without env) — stay silent.
    return "unknown";
  }

  // supabase-js has no getUserByEmail, so page through the admin user list and
  // match. Bounded to keep this cheap; "unknown" if not found within the cap.
  const perPage = 200;
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error || !data) return "unknown";

    const user = data.users.find((u) => u.email?.toLowerCase() === email);
    if (user) {
      // The authoritative list of linked sign-in methods is
      // `app_metadata.providers` (e.g. ["google"] or ["email","google"]).
      // The admin list endpoint returns an empty `identities` array on some
      // GoTrue versions, so we union both rather than trust identities alone.
      const meta = user.app_metadata as
        | { provider?: string; providers?: string[] }
        | undefined;
      const providers = new Set<string>([
        ...(meta?.providers ?? (meta?.provider ? [meta.provider] : [])),
        ...(user.identities ?? []).map((i) => i.provider),
      ]);
      const hasPassword = providers.has("email");
      const hasGoogle = providers.has("google");
      // Only claim "google-only" when we're sure there's no password to use.
      if (hasGoogle && !hasPassword) return "google-only";
      return "has-password";
    }

    if (data.users.length < perPage) break; // reached the last page
  }

  return "unknown";
}
