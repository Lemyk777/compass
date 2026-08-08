// Cron endpoint — discovers NEW competition candidates via web search and
// queues them for admin review in `competition_candidates`. Students never see
// anything from this route directly: approval happens at /admin/opportunities.
//
// The run itself lives in lib/discovery/run.ts, because the admin page runs the
// same thing on demand. This file is only the schedule and the guard: a weekly
// trigger that picks the rotating faculty batch, the top local country and the
// week's search angle.
//
// Cost control: one Haiku call (with up to 6 web searches) per target, and only
// FACULTIES_PER_RUN faculties + one country per run. Screening then fetches one
// page per surviving candidate and the date extraction adds one cheap Haiku
// call for each.
//
// Security: protected by CRON_SECRET (fail-closed — see lib/cron/auth.ts).

import { NextResponse, type NextRequest } from "next/server";
import { denyUnlessCronAuthorized } from "@/lib/cron/auth";
import { runScheduledDiscovery } from "@/lib/discovery/run";

export const maxDuration = 300; // web search + per-candidate verification is slow

const FACULTIES_PER_RUN = 2;

export async function GET(req: NextRequest) {
  const denied = denyUnlessCronAuthorized(req);
  if (denied) return denied;

  const run = await runScheduledDiscovery(FACULTIES_PER_RUN);
  return NextResponse.json({ ok: true, ...run });
}
