"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { UNIVERSITIES } from "@/lib/data/universities";
import { normalizeDestinations } from "@/lib/types";
import { LIMITS } from "@/lib/limits";

export type SaveResult = { ok: true } | { ok: false; error: string };

// Persist the student's US college list (target_schools). Validates names against
// our dataset, caps the count, and ensures "US" is in the destinations so the
// analysis produces US odds. The actual analysis is triggered separately by the
// client (POST /api/analyze) right after this resolves.
export async function saveCollegeList(schools: string[]): Promise<SaveResult> {
  const valid = new Set(UNIVERSITIES.map((u) => u.name));
  const cleaned = Array.from(
    new Set((schools ?? []).filter((s) => valid.has(s)))
  ).slice(0, LIMITS.targetSchools);

  if (cleaned.length === 0) {
    return { ok: false, error: "Pick at least one university." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please log in again." };

  const { data: sp } = await supabase
    .from("student_profiles")
    .select("id, destinations, include_italy")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!sp) return { ok: false, error: "Complete your profile first." };

  // Make sure "US" is among the destinations so the analysis runs the US pathway.
  const destinations = Array.from(
    new Set([...normalizeDestinations(sp.destinations, sp.include_italy), "US"])
  );

  const { error } = await supabase
    .from("student_profiles")
    .update({
      target_schools: cleaned,
      destinations,
      include_italy: destinations.includes("IT"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", sp.id);

  if (error) return { ok: false, error: "Could not save your college list." };

  try {
    revalidatePath("/dashboard");
  } catch {
    // ignore cache revalidation errors
  }
  return { ok: true };
}
