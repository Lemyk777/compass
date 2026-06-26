import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Email-link confirmation landing (PKCE-safe).
 *
 * The default Supabase confirmation link uses the `?code=` exchange handled by
 * /auth/callback, which needs the PKCE *code verifier* cookie created in the
 * browser at sign-up. That cookie is absent when the user opens the email on a
 * different device or browser (the common case), so the exchange fails and the
 * account is never confirmed — even though Google OAuth (a same-browser
 * round-trip, so the verifier is present) works fine.
 *
 * Verifying the one-time `token_hash` instead needs no verifier, so it works
 * across devices. This requires the "Confirm signup" email template to link
 * here instead of using {{ .ConfirmationURL }}:
 *
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup
 *
 * On success we hand off to /auth/callback (no code), which provisions the user
 * and routes them by role — the exact path OAuth already takes.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = cleanNext(searchParams.get("next"));

  if (tokenHash && type) {
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      const handoff = next
        ? `/auth/callback?next=${encodeURIComponent(next)}`
        : "/auth/callback";
      return NextResponse.redirect(`${origin}${handoff}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/auth/login?error=${encodeURIComponent(
      "This confirmation link is invalid or has expired. Please sign in or sign up again to get a new one."
    )}`
  );
}

/** Allow only internal absolute-path redirects; null if absent/invalid. */
function cleanNext(next: string | null): string | null {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return null;
}
