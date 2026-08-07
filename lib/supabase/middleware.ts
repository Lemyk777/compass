import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { CANONICAL_HOST } from "@/lib/site";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  VISITOR_COOKIE,
  VISITOR_MAX_AGE,
} from "@/lib/traffic/track";

export const REF_COOKIE = "compass_ref";

/**
 * Refreshes the Supabase auth session on every request, captures an ambassador
 * referral code from `?ref=CODE` into a long-lived cookie so it survives the
 * round-trip through OAuth/email signup, and issues the two anonymous ids that
 * site traffic is measured with.
 *
 * The traffic ids are minted HERE rather than in the browser for two reasons:
 * a client-generated id races itself across tabs opened at the same moment, and
 * the session id has to slide (30 minutes of inactivity ends a visit), which
 * means re-setting it on every request — which is exactly what middleware is.
 */
export async function updateSession(request: NextRequest) {
  // Canonical-domain enforcement: in production, permanently forward any other
  // host (the retired domain, www, etc.) to the single canonical domain. Old
  // links — including ambassador `?ref=` links — keep working while the old
  // domain effectively goes dark. Localhost and Vercel preview hosts are exempt.
  if (process.env.NODE_ENV === "production") {
    const host = request.headers.get("host") ?? "";
    const isPreview = host.endsWith(".vercel.app");
    const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1");
    if (host && host !== CANONICAL_HOST && !isPreview && !isLocal) {
      const url = request.nextUrl.clone();
      url.protocol = "https:";
      url.hostname = CANONICAL_HOST;
      url.port = "";
      return NextResponse.redirect(url, 308);
    }
  }

  // Capture referral code (no personal data in the URL — just the ambassador code).
  const rawRef = request.nextUrl.searchParams.get("ref");
  const ref = rawRef ? rawRef.trim().slice(0, 64) || null : null;

  // Anonymous traffic ids. A visitor is remembered for a year; a visit ends
  // after 30 minutes of inactivity because the max-age is refreshed on every
  // request below. Neither is derived from anything about the person.
  const visitorId = request.cookies.get(VISITOR_COOKIE)?.value || crypto.randomUUID();
  const sessionId = request.cookies.get(SESSION_COOKIE)?.value || crypto.randomUUID();

  // Put them on the REQUEST as well, so the /api/track handler can read them on
  // the very first page load. A cookie set on the response only comes back on
  // the *next* request, which would have made every first-ever visit invisible.
  request.cookies.set(VISITOR_COOKIE, visitorId);
  request.cookies.set(SESSION_COOKIE, sessionId);

  /**
   * Re-applies everything we own onto a response object. The Supabase client
   * rebuilds the response whenever it refreshes auth cookies, which drops any
   * cookie set before that point — so this runs again after each rebuild.
   */
  const decorate = (res: NextResponse) => {
    if (ref) {
      res.cookies.set(REF_COOKIE, ref, {
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
        path: "/",
      });
    }
    // httpOnly: nothing in the browser needs to read these, and an id the page
    // can't read is an id a third-party script can't lift.
    const secure = process.env.NODE_ENV === "production";
    res.cookies.set(VISITOR_COOKIE, visitorId, {
      maxAge: VISITOR_MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
    });
    res.cookies.set(SESSION_COOKIE, sessionId, {
      maxAge: SESSION_MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
    });
    return res;
  };

  let response = decorate(NextResponse.next({ request }));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // If Supabase isn't configured yet, skip auth refresh but keep our cookies.
  if (!url || !anon) return response;

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]
      ) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = decorate(NextResponse.next({ request }));
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set({ name, value, ...(options ?? {}) })
        );
      },
    },
  });

  // IMPORTANT: refresh the session so server components see a valid user.
  await supabase.auth.getUser();

  return response;
}
