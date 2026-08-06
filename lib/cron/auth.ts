import { NextResponse, type NextRequest } from "next/server";

// The gate in front of both cron endpoints. They spend money per call (page
// fetches, model reads, web search) and write with the service-role key, so the
// rule is: no secret configured ⇒ nobody runs them, us included.
//
// It replaced `if (secret && header !== secret) 401`, which failed OPEN when the
// variable was unset — and it was unset in production.

/** A response to send when the caller is NOT authorized, or null when they are. */
export function denyUnlessCronAuthorized(req: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;

  // 503, not 401: a missing secret is our misconfiguration, and it should read
  // as one in the logs. Vercel Cron sends the header automatically once it exists.
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured — refusing to run." },
      { status: 503 },
    );
  }

  return req.headers.get("authorization") === `Bearer ${secret}`
    ? null
    : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
