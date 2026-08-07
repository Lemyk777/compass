import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  SESSION_COOKIE,
  VISITOR_COOKIE,
  cleanCountry,
  cleanDwell,
  cleanPath,
  deviceFromUA,
  externalHost,
  isBot,
  isMeasurableHost,
  shouldTrack,
} from "@/lib/traffic/track";

/**
 * The one write endpoint for site traffic. Two calls, both fire-and-forget from
 * the browser (components/analytics/Traffic.tsx):
 *
 *   { path, referrer }  → a page opened. Answers with the row id.
 *   { id, ms }          → that page closed after `ms`. Sent via sendBeacon.
 *
 * The row is written when the page OPENS, not when it closes, and `dwell_ms`
 * is filled in afterwards. The other way round is tidier and loses data: a
 * beacon is best-effort, so any tab killed by the OS, any browser that blocks
 * sendBeacon, and any visitor who closes the laptop lid would simply not exist.
 * A view with an unknown duration is still a view.
 *
 * Always answers 204/200 and never throws at the caller. Analytics failing is
 * not a reason for a page to show an error.
 */

// Never prerender or cache: every call is a distinct write.
export const dynamic = "force-dynamic";

/** Longest a single visit's page list can get before we stop recording it.
 *
 * Best-effort only — serverless instances come and go, so this is a speed bump
 * for a naive loop (a script hammering the endpoint, or a page stuck in a
 * navigation cycle), not a security control. The real guard is that a row here
 * is cheap and unreadable by anyone but the service role.
 */
const MAX_VIEWS_PER_SESSION = 300;
const seen = new Map<string, number>();

function overLimit(sessionId: string): boolean {
  const n = (seen.get(sessionId) ?? 0) + 1;
  // Bound the map itself, or a long-lived instance leaks one entry per visit.
  if (seen.size > 5_000) seen.clear();
  seen.set(sessionId, n);
  return n > MAX_VIEWS_PER_SESSION;
}

/** Logged at most once per instance — otherwise an unapplied migration would
 *  print a stack trace on every single page view. */
let warned = false;
function warnOnce(where: string, error: unknown) {
  if (warned) return;
  warned = true;
  console.error(
    `traffic: ${where} failed — is migration 0025_traffic.sql applied? ` +
      `(npm run db:check)`,
    error
  );
}

export async function POST(req: NextRequest) {
  const noop = new NextResponse(null, { status: 204 });

  const jar = cookies();
  const visitorId = jar.get(VISITOR_COOKIE)?.value;
  const sessionId = jar.get(SESSION_COOKIE)?.value;
  // No ids means the middleware never ran for this request or the browser
  // refuses cookies. Either way there is nothing to attribute a view to.
  if (!visitorId || !sessionId) return noop;

  const ua = req.headers.get("user-agent");
  if (isBot(ua)) return noop;

  // Development and preview deploys write to the same database as production.
  if (
    process.env.TRACK_LOCAL !== "1" &&
    !isMeasurableHost(req.headers.get("host"))
  )
    return noop;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return noop;
  }

  const admin = createAdminClient();

  // ---- close: fill in how long the page was open -------------------------
  if (body.id != null) {
    const id = Number(body.id);
    const ms = cleanDwell(body.ms);
    if (!Number.isSafeInteger(id) || ms == null) return noop;
    // Scoped to the caller's own session id, so the worst a hand-written
    // request can do is overwrite the duration of a page it opened itself.
    const { error } = await admin
      .from("page_views")
      .update({ dwell_ms: ms })
      .eq("id", id)
      .eq("session_id", sessionId);
    if (error) warnOnce("dwell update", error);
    return noop;
  }

  // ---- open: record the view --------------------------------------------
  const path = cleanPath(typeof body.path === "string" ? body.path : null);
  if (!path || !shouldTrack(path)) return noop;
  if (overLimit(sessionId)) return noop;

  const referrer = externalHost(
    typeof body.referrer === "string" ? body.referrer : null,
    req.headers.get("host")
  );

  const { data, error } = await admin
    .from("page_views")
    .insert({
      visitor_id: visitorId,
      session_id: sessionId,
      user_id: await currentUserId(),
      path,
      referrer,
      // Vercel attaches this from the edge; absent locally, and that is fine —
      // an unknown country is shown as unknown, never guessed.
      country: cleanCountry(req.headers.get("x-vercel-ip-country")),
      device: deviceFromUA(ua),
    })
    .select("id")
    .single();

  if (error) {
    warnOnce("view insert", error);
    return noop;
  }
  return NextResponse.json({ id: data.id });
}

/**
 * The signed-in user, if there is one.
 *
 * Skipped entirely when no Supabase auth cookie is present, which is the case
 * for most traffic — that keeps the common path at zero extra auth round trips
 * and only pays for `getUser()` when there is actually a session to verify. A
 * false negative here costs an attribution, never correctness: the view is
 * still recorded, just without a user attached.
 */
async function currentUserId(): Promise<string | null> {
  const hasAuthCookie = cookies()
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));
  if (!hasAuthCookie) return null;
  try {
    const {
      data: { user },
    } = await createClient().auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}
