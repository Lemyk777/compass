"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type AuthMethodHint = "google-only" | "unknown";

/**
 * Best-effort hint, shown after a failed password sign-in, to steer a user whose
 * account was created with Google (and therefore has NO password) to the Google
 * button instead of a confusing "invalid login credentials".
 *
 * Runs with the service role (server-only). Returns "unknown" on any failure or
 * ambiguity so the caller falls back to the normal error — this must never block
 * a real sign-in.
 *
 * Account-enumeration hardening: a "use server" action is a public POST endpoint
 * anyone can call with any email. So this is deliberately one-directional — it
 * ONLY ever reveals the "google-only" case. A password account, a Google+
 * password account, and a non-existent email all return "unknown" and are
 * indistinguishable, so this confirms nothing about ordinary accounts. The hard
 * per-IP cap on probing still belongs in the Supabase Auth rate-limit settings;
 * this just keeps the endpoint from being a free existence/method oracle.
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
      // Only ever reveal the Google-only case; never confirm that a password
      // account exists (that would make this an account-enumeration oracle).
      if (hasGoogle && !hasPassword) return "google-only";
      return "unknown";
    }

    if (data.users.length < perPage) break; // reached the last page
  }

  return "unknown";
}
