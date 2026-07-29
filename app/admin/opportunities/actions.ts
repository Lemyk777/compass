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

export async function approveCandidate(id: string): Promise<void> {
  await requireRole("admin", "/admin/opportunities");
  const admin = createAdminClient();

  const { data: cand, error: readErr } = await admin
    .from("competition_candidates")
    .select("*")
    .eq("id", id)
    .eq("status", "pending")
    .maybeSingle();
  if (readErr || !cand) return;

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
