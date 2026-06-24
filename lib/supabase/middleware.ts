import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { CANONICAL_HOST } from "@/lib/site";

export const REF_COOKIE = "compass_ref";

/**
 * Refreshes the Supabase auth session on every request and captures an
 * ambassador referral code from `?ref=CODE` into a long-lived cookie so it
 * survives the round-trip through OAuth/email signup.
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

  let response = NextResponse.next({ request });

  // Capture referral code (no personal data in the URL — just the ambassador code).
  const ref = request.nextUrl.searchParams.get("ref");
  if (ref) {
    const clean = ref.trim().slice(0, 64);
    if (clean) {
      response.cookies.set(REF_COOKIE, clean, {
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
        path: "/",
      });
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // If Supabase isn't configured yet, skip auth refresh but keep the ref cookie.
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
        response = NextResponse.next({ request });
        // Re-apply the ref cookie onto the rebuilt response.
        if (ref) {
          const clean = ref.trim().slice(0, 64);
          if (clean)
            response.cookies.set(REF_COOKIE, clean, {
              maxAge: 60 * 60 * 24 * 365,
              sameSite: "lax",
              path: "/",
            });
        }
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
