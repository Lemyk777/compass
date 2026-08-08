"use server";

// Admin review actions for discovered competition candidates.
//
// Approve = the ONLY path from discovery to students: the candidate row is
// upserted into competition_deadlines, where the dashboard's
// resolveCompetitions() merges live-only rows into the Opportunities pool.
// An unconfirmed deadline is stored with date_confirmed=false, so the UI
// shows "Dates not yet announced" instead of a countdown we can't stand
// behind.

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { FACULTY_VALUES, type FacultyValue } from "@/lib/data/faculties";
import { LOCAL_TARGETS } from "@/lib/data/geo";
import { angleByKey, SEARCH_ANGLES } from "@/lib/discovery/discover";
import { runDiscovery, type DiscoveryTarget } from "@/lib/discovery/run";
import type { CostModel } from "@/lib/data/key-dates";

// competition_deadlines.deadline is NOT NULL (migration 0011). For a candidate
// with no verifiable date we store the end of the current cycle as a sorting
// placeholder — date_confirmed stays false, so the UI never shows it as a
// real deadline.
function cycleEndPlaceholder(): string {
  const now = new Date();
  const year = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year + 1}-06-30`;
}

function currentCycle(): string {
  const now = new Date();
  const year = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-${String(year + 1).slice(2)}`;
}

const COST_MODELS: CostModel[] = [
  "unknown",
  "free",
  "free_cert_paid",
  "free_then_paid",
  "freemium",
  "subscription",
  "one_time",
  "paid_aid",
  "funded",
  "varies",
];

export async function approveCandidate(id: string, formData: FormData): Promise<void> {
  await requireRole("admin", "/admin/opportunities");
  const admin = createAdminClient();

  const { data: cand, error: readErr } = await admin
    .from("competition_candidates")
    .select("*")
    .eq("id", id)
    .eq("status", "pending")
    .maybeSingle();
  if (readErr || !cand) return;

  // Cost is set by the REVIEWER, not by discovery. Screening quotes whatever
  // the page says about money (the `cost_signal` warning) and stops there: a
  // hallucinated price is worse than no price, and "unknown" is an honest
  // answer the UI already knows how to render. This is the one field where a
  // human reading one sentence beats anything we can automate — and until now
  // every approved row was permanently "cost unverified" because there was
  // nowhere to put the answer.
  const rawCost = String(formData.get("cost") ?? "unknown");
  const cost = (COST_MODELS as string[]).includes(rawCost) ? (rawCost as CostModel) : "unknown";
  const costDetail = String(formData.get("cost_detail") ?? "").trim().slice(0, 200);

  const { error: upsertErr } = await admin.from("competition_deadlines").upsert(
    {
      id: cand.id,
      name: cand.name,
      fields: cand.fields,
      deadline: cand.deadline ?? cycleEndPlaceholder(),
      event_window: cand.event_window || "See official site",
      level: cand.level,
      url: cand.url,
      blurb: cand.blurb,
      category: cand.category,
      tier: cand.tier,
      eligibility: cand.eligibility,
      region: cand.region,
      city: cand.city,
      date_confirmed: cand.date_confirmed === true && cand.deadline !== null,
      cost: cost === "unknown" ? null : cost,
      cost_detail: costDetail || null,
      cycle: currentCycle(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (upsertErr) {
    console.error(`[opportunities] approve upsert failed for ${id}:`, upsertErr);
    return;
  }

  await admin
    .from("competition_candidates")
    .update({ status: "approved", reviewed_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/admin/opportunities");
}

export async function rejectCandidate(id: string): Promise<void> {
  await requireRole("admin", "/admin/opportunities");
  const admin = createAdminClient();

  await admin
    .from("competition_candidates")
    .update({ status: "rejected", reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pending");

  revalidatePath("/admin/opportunities");
}

// ---------------------------------------------------------------------------
// Run discovery on demand
// ---------------------------------------------------------------------------

export type RunDiscoveryState = {
  ok: boolean;
  message: string;
  /** One line per target: what it found, queued and threw away. */
  lines: string[];
};

/**
 * Search for new opportunities now, from the admin page.
 *
 * The weekly cron covers two faculties; this covers "I want more law entries
 * and I want them today". It is the same runner, so anything it queues went
 * through the same screening and lands in the same review list — the button
 * changes WHEN discovery happens, never what is trusted.
 *
 * Deliberately synchronous: one target, one angle, ~30–60s, and the summary
 * comes back on the page. A background job would need a table to report into
 * and a way to tell whether it ever ran, which is precisely the ambiguity that
 * left the cron unexamined for a month.
 */
export async function runDiscoveryNow(formData: FormData): Promise<RunDiscoveryState> {
  await requireRole("admin", "/admin/opportunities");

  const rawTarget = String(formData.get("target") ?? "");
  const angle = angleByKey(String(formData.get("angle") ?? "")) ?? SEARCH_ANGLES[0];

  let target: DiscoveryTarget | null = null;
  if (rawTarget.startsWith("local:")) {
    const local = LOCAL_TARGETS[rawTarget.slice(6).toUpperCase()];
    if (local) target = { kind: "local", target: local };
  } else if ((FACULTY_VALUES as string[]).includes(rawTarget)) {
    target = { kind: "faculty", faculty: rawTarget as FacultyValue };
  }
  if (!target) {
    return { ok: false, message: "Pick a field or a country to search.", lines: [] };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      ok: false,
      message: "ANTHROPIC_API_KEY is not set in this environment — discovery cannot search.",
      lines: [],
    };
  }

  try {
    const run = await runDiscovery([target], angle);
    const lines = run.outcomes.flatMap((o) => {
      const head = o.error
        ? `${o.tag}: failed — ${o.error}`
        : `${o.tag}: found ${o.found}, queued ${o.queued}${o.flagged > 0 ? ` (${o.flagged} flagged)` : ""}`;
      // Every dropped candidate is named with its reason. "Found 6, kept 0" on
      // its own is indistinguishable from a broken pipeline.
      return [head, ...o.dropped.map((d) => `  · dropped ${d.name} — ${d.reason}`)];
    });

    revalidatePath("/admin/opportunities");
    return {
      ok: true,
      message:
        run.inserted > 0
          ? `Queued ${run.inserted} new candidate${run.inserted === 1 ? "" : "s"} for review.`
          : "Nothing new survived screening — see below for what was found and why it was dropped.",
      lines,
    };
  } catch (e) {
    return {
      ok: false,
      message: `Run failed: ${e instanceof Error ? e.message : "unknown error"}`,
      lines: [],
    };
  }
}
