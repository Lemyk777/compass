"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { LIMITS } from "@/lib/limits";
import type { SaveResult } from "@/app/dashboard/actions";
import {
  intentStatusFromPlanner,
  type PlannerOrigin,
  type PlannerStatus,
} from "@/lib/data/planner";
import {
  isPickId,
  isPickKind,
  pickHref,
  pickRef,
} from "@/lib/data/plan-picks";

// Writes for the planner. Two tables, and which one a write lands in is decided
// by the item's ORIGIN — a committed opportunity keeps its state in
// opportunity_intents, a task the student typed keeps its state in
// planner_items. Nothing is ever written to both, which is what stops the two
// from drifting and what keeps /admin/intents reading the real number.
//
// Every bound below is enforced HERE and not only in the form: a server action
// is a public HTTP endpoint and the form is a convenience.

const PLANNER_STATUSES: PlannerStatus[] = ["todo", "doing", "done", "dropped"];

function isPlannerStatus(v: unknown): v is PlannerStatus {
  return PLANNER_STATUSES.includes(v as PlannerStatus);
}

/**
 * Trim, collapse whitespace, bound. Empty becomes null, so "no answer" is one
 * value in the database rather than three — the same rule `cleanIntentText`
 * follows next door.
 */
function clean(v: string | null | undefined, max: number): string | null {
  if (v == null) return null;
  const t = v.trim().replace(/\s+/g, " ");
  return t.length === 0 ? null : t.slice(0, max);
}

/** ISO date-only, or null. Anything else is rejected rather than coerced. */
function cleanDate(v: string | null | undefined): string | null {
  if (!v) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  return Number.isNaN(Date.parse(`${v}T00:00:00Z`)) ? null : v;
}

/**
 * An in-app path, or null. Never an external URL — the catalog owns those,
 * because `npm run test:links` is what keeps them alive and it only knows about
 * the catalog. `//host` is rejected alongside `https://`: it is
 * protocol-relative, so it leaves the site while looking like a path.
 */
function cleanHref(v: string | null | undefined): string | null {
  if (!v) return null;
  const t = v.trim();
  if (!t.startsWith("/")) return null;
  if (t.startsWith("//")) return null;
  return t.slice(0, 200);
}

async function currentUserId(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// One path, because there is one page now: the board and the maps became views
// of `/planner` rather than routes of their own, and `/planner/board` is a 308
// from next.config.mjs. Revalidating a redirect would be a no-op that reads as
// coverage.
function refresh() {
  try {
    revalidatePath("/planner");
  } catch {
    // ignore cache revalidation errors
  }
}

/**
 * A missing table, a missing column or a rejected status all mean the same
 * thing: 0028 has not been applied by hand yet. Say which migration, the way
 * the pinned checkbox does for 0027 — an opaque 500 sends the reader looking
 * for a code bug that is not there.
 */
function migrationHint(code: string | undefined): string | null {
  if (code === "42P01" || code === "42703") {
    return "The planner's table isn't set up yet — run migration 0028_planner.sql.";
  }
  if (code === "23514") {
    return "That column isn't available yet — run migration 0028_planner.sql.";
  }
  return null;
}

export async function createPlannerItem(input: {
  title: string;
  note?: string | null;
  dueISO?: string | null;
  linkHref?: string | null;
}): Promise<SaveResult> {
  const title = clean(input.title, LIMITS.plannerTitle);
  if (!title) return { ok: false, error: "Give it a name first." };

  const uid = await currentUserId();
  if (!uid) return { ok: false, error: "Please log in again." };

  const supabase = createClient();

  // The ceiling, checked before the insert. `head: true` fetches no rows.
  const { count, error: countError } = await supabase
    .from("planner_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", uid);

  if (countError) {
    return {
      ok: false,
      error:
        migrationHint(countError.code) ?? "Could not save that. Try again.",
    };
  }
  if ((count ?? 0) >= LIMITS.plannerItems) {
    return {
      ok: false,
      error: `That's ${LIMITS.plannerItems} tasks — finish or remove one before adding another.`,
    };
  }

  const { error } = await supabase.from("planner_items").insert({
    user_id: uid,
    title,
    note: clean(input.note, LIMITS.plannerNote),
    due_date: cleanDate(input.dueISO),
    link_href: cleanHref(input.linkHref),
  });

  if (error) {
    return {
      ok: false,
      error: migrationHint(error.code) ?? "Could not save that. Try again.",
    };
  }

  refresh();
  return { ok: true };
}

export async function updatePlannerItem(input: {
  id: string;
  title?: string;
  note?: string | null;
  dueISO?: string | null;
}): Promise<SaveResult> {
  const uid = await currentUserId();
  if (!uid) return { ok: false, error: "Please log in again." };

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.title !== undefined) {
    const title = clean(input.title, LIMITS.plannerTitle);
    if (!title) return { ok: false, error: "Give it a name first." };
    patch.title = title;
  }
  if (input.note !== undefined)
    patch.note = clean(input.note, LIMITS.plannerNote);
  if (input.dueISO !== undefined) patch.due_date = cleanDate(input.dueISO);

  const supabase = createClient();
  const { error } = await supabase
    .from("planner_items")
    .update(patch)
    .eq("id", input.id)
    .eq("user_id", uid);

  if (error) {
    return {
      ok: false,
      error: migrationHint(error.code) ?? "Could not save that. Try again.",
    };
  }

  refresh();
  return { ok: true };
}

export async function deletePlannerItem(id: string): Promise<SaveResult> {
  const uid = await currentUserId();
  if (!uid) return { ok: false, error: "Please log in again." };

  const supabase = createClient();
  const { error } = await supabase
    .from("planner_items")
    .delete()
    .eq("id", id)
    .eq("user_id", uid);

  if (error) {
    return {
      ok: false,
      error: migrationHint(error.code) ?? "Could not remove that. Try again.",
    };
  }

  refresh();
  return { ok: true };
}

/**
 * Move a card between columns.
 *
 * The dispatch on `origin` is the whole design: one fact has one home. A
 * committed opportunity's state IS its intent — writing it anywhere else would
 * create a second copy that drifts from the one /admin/intents reads.
 */
export async function movePlannerItem(input: {
  origin: PlannerOrigin;
  sourceId: string;
  to: PlannerStatus;
}): Promise<SaveResult> {
  if (!isPlannerStatus(input.to))
    return { ok: false, error: "Unknown column." };
  if (input.origin !== "opportunity" && input.origin !== "own") {
    // SAT sittings and application deadlines are facts about the world. They
    // have no state to move, and the board never renders them — so reaching
    // here means the request did not come from our board.
    return { ok: false, error: "That one isn't yours to move." };
  }

  const uid = await currentUserId();
  if (!uid) return { ok: false, error: "Please log in again." };

  const supabase = createClient();
  const now = new Date().toISOString();

  const { error } =
    input.origin === "own"
      ? await supabase
          .from("planner_items")
          .update({ status: input.to, updated_at: now })
          .eq("id", input.sourceId)
          .eq("user_id", uid)
      : await supabase
          .from("opportunity_intents")
          .update({
            status: intentStatusFromPlanner(input.to),
            updated_at: now,
          })
          .eq("opportunity_id", input.sourceId)
          .eq("user_id", uid);

  if (error) {
    return {
      ok: false,
      error: migrationHint(error.code) ?? "Could not move that. Try again.",
    };
  }

  refresh();
  try {
    // The opportunity card shows the same state, so it has to be re-read too.
    revalidatePath("/opportunities");
  } catch {
    // ignore cache revalidation errors
  }
  return { ok: true };
}

// ─── The guide → plan join ────────────────────────────────────────────────────
//
// Claiming something out of the guide, and letting go of it again. Two writes,
// one table (0030), and neither of them accepts a path from the caller: the
// href is COMPUTED from the pick, because a server action is a public HTTP
// endpoint and a client-supplied path would let anyone store `/admin` under the
// label "Germany" and have the plan render it as a country chip.

/**
 * Same shape of hint as `migrationHint`, for the table this feature owns.
 * Separate function rather than a parameter: the two migrations fail at
 * different times, and a message naming the wrong one sends the reader to the
 * wrong SQL file.
 */
function pathMigrationHint(code: string | undefined): string | null {
  if (code === "42P01" || code === "42703") {
    return "Your plan's picks aren't set up yet — run migration 0030_planner_path.sql.";
  }
  return null;
}

/**
 * Put a country / city / kind of work / route from home onto the plan.
 *
 * Idempotent by the table's own unique key, so pressing it twice — or landing
 * on the page again with a stale button — is not an error the student has to
 * read about. `onConflict` updates the label, which is what keeps a pick made
 * a year ago from rendering the name a registry has since changed.
 */
export async function addPick(input: {
  kind: string;
  id: string;
  label: string;
}): Promise<SaveResult> {
  if (!isPickKind(input.kind)) return { ok: false, error: "Unknown kind." };
  if (!isPickId(input.id)) return { ok: false, error: "Unknown item." };

  const label = clean(input.label, LIMITS.pickLabel);
  if (!label) return { ok: false, error: "That one has no name." };

  const uid = await currentUserId();
  if (!uid) return { ok: false, error: "Please log in again." };

  const supabase = createClient();

  // The ceiling, checked before the insert — the same abuse bound every other
  // student-writable table here carries. `head: true` fetches no rows.
  const { count, error: countError } = await supabase
    .from("planner_path")
    .select("id", { count: "exact", head: true })
    .eq("user_id", uid);

  if (countError) {
    return {
      ok: false,
      error:
        pathMigrationHint(countError.code) ?? "Could not save that. Try again.",
    };
  }
  if ((count ?? 0) >= LIMITS.pathPicks) {
    return {
      ok: false,
      error: `That's ${LIMITS.pathPicks} things on your plan — take one off before adding another.`,
    };
  }

  const { error } = await supabase.from("planner_path").upsert(
    {
      user_id: uid,
      ref: pickRef(input.kind, input.id),
      label,
      href: pickHref(input.kind, input.id),
    },
    { onConflict: "user_id,ref" },
  );

  if (error) {
    return {
      ok: false,
      error: pathMigrationHint(error.code) ?? "Could not save that. Try again.",
    };
  }

  refreshPath(pickHref(input.kind, input.id));
  return { ok: true };
}

/**
 * Take one back off. A pick is a thought, not a commitment — changing your mind
 * about a country is the point of weighing several, so this is a plain delete
 * rather than the archive line `dropped` gives a commitment.
 */
export async function removePick(input: {
  kind: string;
  id: string;
}): Promise<SaveResult> {
  if (!isPickKind(input.kind)) return { ok: false, error: "Unknown kind." };
  if (!isPickId(input.id)) return { ok: false, error: "Unknown item." };

  const uid = await currentUserId();
  if (!uid) return { ok: false, error: "Please log in again." };

  const supabase = createClient();
  const { error } = await supabase
    .from("planner_path")
    .delete()
    .eq("user_id", uid)
    .eq("ref", pickRef(input.kind, input.id));

  if (error) {
    return {
      ok: false,
      error:
        pathMigrationHint(error.code) ?? "Could not remove that. Try again.",
    };
  }

  refreshPath(pickHref(input.kind, input.id));
  return { ok: true };
}

/**
 * Both surfaces that changed: the plan, and the guide page the button is on.
 * Missing the second is why a "saved" state used to survive a Back navigation
 * — the guide is `force-dynamic`, but the router cache is not.
 */
function refreshPath(guideHref: string) {
  try {
    revalidatePath("/planner");
    revalidatePath(guideHref);
  } catch {
    // ignore cache revalidation errors
  }
}
