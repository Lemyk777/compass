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

/**
 * Credit an ambassador a user self-reported in the "how did you hear about us?"
 * survey (they arrived via a normal link, not a referral). Treated exactly like
 * a referral so it shows in the ambassador's count and the admin leaderboard.
 *
 * Idempotent and safe: only credits a user with NO existing attribution, against
 * a real, active ambassador (never self). Runs with the service role.
 */
export async function creditSurveyReferral(userId: string, rawCode: string) {
  const code = rawCode.trim().slice(0, 64);
  if (!code) return { credited: false as const };

  const admin = createAdminClient();

  // Never override an existing attribution (also keeps this idempotent).
  const { data: profile } = await admin
    .from("profiles")
    .select("referred_by")
    .eq("id", userId)
    .maybeSingle();
  if (!profile || profile.referred_by) return { credited: false as const };

  // Validate against a real, active ambassador — ignore self/unknown/inactive.
  const { data: amb } = await admin
    .from("ambassadors")
    .select("user_id, code, status, signups")
    .eq("code", code)
    .maybeSingle();
  if (!amb || amb.user_id === userId || amb.status === "inactive") {
    return { credited: false as const };
  }

  // Attribute on the profile.
  await admin.from("profiles").update({ referred_by: amb.code }).eq("id", userId);

  // Reflect in the event log so signup_count_for_code() and the admin
  // leaderboard (which count signup events) pick it up. Attribute the user's
  // existing signup event if it's unattributed; otherwise add one.
  const { data: ev } = await admin
    .from("events")
    .select("id, ref_code")
    .eq("user_id", userId)
    .eq("type", "signup")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (ev && !ev.ref_code) {
    await admin.from("events").update({ ref_code: amb.code }).eq("id", ev.id);
  } else if (!ev) {
    await admin
      .from("events")
      .insert({ user_id: userId, type: "signup", ref_code: amb.code });
  }

  // Bump the denormalized counter to match the referral-link path.
  await admin
    .from("ambassadors")
    .update({ signups: (amb.signups ?? 0) + 1 })
    .eq("code", amb.code);

  return { credited: true as const, code: amb.code };
}
