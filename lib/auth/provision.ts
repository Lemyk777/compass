import { createAdminClient } from "@/lib/supabase/admin";
import type { User } from "@supabase/supabase-js";

/**
 * Idempotent post-signup provisioning. Called after a user authenticates
 * (OAuth callback or email confirmation). On the user's FIRST appearance it:
 *   1. creates their `profiles` row,
 *   2. records the referral code (if a valid ambassador code is present),
 *   3. logs a `signup` event, and
 *   4. increments the referring ambassador's signup count.
 *
 * Runs with the service-role client (server-only) so it can write the event
 * log and bump another user's ambassador row, which RLS would otherwise block.
 */
export async function provisionUser(user: User, refCode?: string | null) {
  const admin = createAdminClient();

  // Already provisioned? Then this isn't a new signup — do nothing.
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (existing) return { created: false as const };

  // Validate the referral code against real, active ambassadors only.
  let referredBy: string | null = null;
  if (refCode) {
    const { data: amb } = await admin
      .from("ambassadors")
      .select("user_id, code, status")
      .eq("code", refCode)
      .maybeSingle();
    // Ignore self-referral and inactive/unknown codes.
    if (amb && amb.user_id !== user.id && amb.status !== "inactive") {
      referredBy = amb.code;
    }
  }

  const fullName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    null;

  await admin.from("profiles").insert({
    id: user.id,
    role: "student",
    full_name: fullName,
    referred_by: referredBy,
  });

  await admin.from("events").insert({
    user_id: user.id,
    type: "signup",
    ref_code: referredBy,
  });

  if (referredBy) {
    // Best-effort increment of the ambassador's denormalized counter.
    const { data: amb } = await admin
      .from("ambassadors")
      .select("signups")
      .eq("code", referredBy)
      .maybeSingle();
    if (amb) {
      await admin
        .from("ambassadors")
        .update({ signups: (amb.signups ?? 0) + 1 })
        .eq("code", referredBy);
    }
  }

  return { created: true as const, referredBy };
}
