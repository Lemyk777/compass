import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. BYPASSES Row-Level Security.
 *
 * SERVER-ONLY. Never import this into a client component or expose the key.
 * Use only for trusted server-side provisioning: post-signup user setup,
 * writing event rows, admin metrics, and inserting analyses.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing Supabase service-role configuration (SUPABASE_SERVICE_ROLE_KEY)."
    );
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
