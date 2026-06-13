import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { provisionUser } from "@/lib/auth/provision";
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
  const next = sanitizeNext(searchParams.get("next"));

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

  return NextResponse.redirect(`${origin}${next}`);
}

function sanitizeNext(next: string | null): string {
  // Only allow internal, absolute-path redirects.
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/onboarding";
}
