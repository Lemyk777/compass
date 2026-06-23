import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { provisionUser } from "@/lib/auth/provision";
import { landingPathForRole, type Role } from "@/lib/auth/session";
import { REF_COOKIE } from "@/lib/supabase/middleware";

/**
 * Auth landing for both flows:
 *  - OAuth / email-confirmation links arrive with `?code=...` to exchange.
 *  - Client email sign-in redirects here with the session cookie already set.
 * In both cases we ensure the user is provisioned (profile + referral + signup
 * event) exactly once, then forward to `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const explicitNext = cleanNext(searchParams.get("next"));

  const supabase = createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        `${origin}/auth/login?error=${encodeURIComponent("Could not sign you in. Please try again.")}`
      );
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/auth/login`);
  }

  const refCode = request.cookies.get(REF_COOKIE)?.value ?? null;
  try {
    await provisionUser(user, refCode);
  } catch (e) {
    // Provisioning is best-effort; never block the user from getting in.
    console.error("provisionUser failed", e);
  }

  // Honor an explicit return target; otherwise route by role
  // (admin → /admin, ambassador → /ambassador, student → /onboarding).
  let target = explicitNext;
  if (!target) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const role = (profile?.role as Role) ?? "student";
    if (role === "student") {
      // A returning student who already has results should land on their
      // dashboard — not be dumped back into the questionnaire (which looks like
      // their results vanished). Only brand-new students go to onboarding.
      const { count } = await supabase
        .from("analyses")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      target = (count ?? 0) > 0 ? "/dashboard" : "/onboarding";
    } else {
      target = landingPathForRole(role);
    }
  }

  return NextResponse.redirect(`${origin}${target}`);
}

/** Allow only internal absolute-path redirects; null if absent/invalid. */
function cleanNext(next: string | null): string | null {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return null;
}
