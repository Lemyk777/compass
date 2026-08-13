"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { LIMITS } from "@/lib/limits";
import type { SaveResult } from "@/app/dashboard/actions";
import { MINDMAP_MAX_DEPTH, type MapNodeRow } from "@/lib/data/mindmap";

// Writes for the mind maps (migration 0029).
//
// Structure only — a parent and a position among siblings. There are no
// coordinates to write, which is why "move" here means indent / outdent / up /
// down rather than a drag, and why every one of those is a small, checkable
// operation instead of a stream of pointer events.
//
// Every bound is enforced HERE and not only in the form: a server action is a
// public HTTP endpoint and the form is a convenience.

const MAX_LABEL = LIMITS.mapLabel;

function clean(v: string | null | undefined, max: number): string | null {
  if (v == null) return null;
  const t = v.trim().replace(/\s+/g, " ");
  return t.length === 0 ? null : t.slice(0, max);
}

/**
 * An in-app path, or null. Never an external URL — the catalog owns those,
 * because `npm run test:links` keeps them alive and only knows about the
 * catalog. `//host` is rejected alongside `https://`: it is protocol-relative,
 * so it leaves the site while looking like a path.
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

function refresh(mapId?: string) {
  try {
    revalidatePath("/planner/maps");
    if (mapId) revalidatePath(`/planner/maps/${mapId}`);
  } catch {
    // ignore cache revalidation errors
  }
}

/** A missing table or column means 0029 has not been applied by hand yet. */
function migrationHint(code: string | undefined): string | null {
  if (code === "42P01" || code === "42703") {
    return "Mind maps aren't set up yet — run migration 0029_planner_maps.sql.";
  }
  return null;
}

const fail = (code: string | undefined, fallback: string): SaveResult => ({
  ok: false,
  error: migrationHint(code) ?? fallback,
});

// ── Reading, for the actions that need the current shape ──────────────────────

type Row = {
  id: string;
  map_id: string;
  parent_id: string | null;
  position: number;
};

async function loadMapRows(
  userId: string,
  mapId: string,
): Promise<{ ok: true; rows: Row[] } | { ok: false; error: string }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("planner_map_nodes")
    .select("id, map_id, parent_id, position")
    .eq("user_id", userId)
    .eq("map_id", mapId);

  if (error) {
    return { ok: false, error: migrationHint(error.code) ?? "Could not read that map." };
  }
  return { ok: true, rows: (data ?? []) as Row[] };
}

/** Depth of a node by walking up. Cycle-safe, same reason `buildTree` is. */
function depthOf(rows: Row[], id: string): number {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const seen = new Set<string>();
  let depth = 0;
  let cur = byId.get(id);
  while (cur?.parent_id) {
    if (seen.has(cur.id)) break;
    seen.add(cur.id);
    cur = byId.get(cur.parent_id);
    depth += 1;
    if (depth > MINDMAP_MAX_DEPTH + 2) break;
  }
  return depth;
}

/** The deepest descendant below `id`, measured from `id` itself (0 = a leaf). */
function subtreeHeight(rows: Row[], id: string): number {
  const kids = rows.filter((r) => r.parent_id === id);
  if (kids.length === 0) return 0;
  return 1 + Math.max(...kids.map((k) => subtreeHeight(rows, k.id)));
}

function siblingsOf(rows: Row[], node: Row): Row[] {
  return rows
    .filter((r) => r.parent_id === node.parent_id)
    .sort((a, b) => (a.position === b.position ? a.id.localeCompare(b.id) : a.position - b.position));
}

// ── Maps ──────────────────────────────────────────────────────────────────────

/**
 * Start a map. The root IS the map: its `map_id` is its own id, which is what
 * makes "list my maps" a plain `where parent_id is null` and needs no second
 * table.
 */
export async function createMap(label: string): Promise<SaveResult> {
  const title = clean(label, MAX_LABEL);
  if (!title) return { ok: false, error: "Give the map a question to answer." };

  const uid = await currentUserId();
  if (!uid) return { ok: false, error: "Please log in again." };

  const supabase = createClient();

  const { count, error: countError } = await supabase
    .from("planner_map_nodes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", uid)
    .is("parent_id", null);

  if (countError) return fail(countError.code, "Could not start a map. Try again.");
  if ((count ?? 0) >= LIMITS.maps) {
    return { ok: false, error: `That's ${LIMITS.maps} maps — delete one before starting another.` };
  }

  // The root's map_id must equal its own id, so it is generated here rather than
  // by the default: one insert instead of insert-then-update.
  const id = crypto.randomUUID();
  const { error } = await supabase.from("planner_map_nodes").insert({
    id,
    user_id: uid,
    map_id: id,
    parent_id: null,
    label: title,
    position: 0,
  });

  if (error) return fail(error.code, "Could not start a map. Try again.");

  refresh(id);
  return { ok: true };
}

export async function deleteMap(mapId: string): Promise<SaveResult> {
  const uid = await currentUserId();
  if (!uid) return { ok: false, error: "Please log in again." };

  const supabase = createClient();
  // Deleting every node of the map, not only the root: the cascade would handle
  // the descendants, but naming the whole map is clearer and does not rely on
  // the FK being present on a database where 0029 was edited by hand.
  const { error } = await supabase
    .from("planner_map_nodes")
    .delete()
    .eq("user_id", uid)
    .eq("map_id", mapId);

  if (error) return fail(error.code, "Could not delete that map. Try again.");

  refresh(mapId);
  return { ok: true };
}

// ── Nodes ─────────────────────────────────────────────────────────────────────

export async function addNode(input: {
  mapId: string;
  /** The node this one hangs under. */
  parentId: string;
  label: string;
  linkHref?: string | null;
}): Promise<SaveResult> {
  const label = clean(input.label, MAX_LABEL);
  if (!label) return { ok: false, error: "Give it a name first." };

  const uid = await currentUserId();
  if (!uid) return { ok: false, error: "Please log in again." };

  const loaded = await loadMapRows(uid, input.mapId);
  if (!loaded.ok) return { ok: false, error: loaded.error };
  const rows = loaded.rows;

  if (rows.length >= LIMITS.mapNodes) {
    return {
      ok: false,
      error: `That map has ${LIMITS.mapNodes} nodes — the most one map can hold.`,
    };
  }

  const parent = rows.find((r) => r.id === input.parentId);
  if (!parent) return { ok: false, error: "That branch is gone — reload the map." };

  if (depthOf(rows, parent.id) + 1 > MINDMAP_MAX_DEPTH) {
    return {
      ok: false,
      error: `A map goes ${MINDMAP_MAX_DEPTH} levels deep. Start a new branch instead.`,
    };
  }

  const nextPosition = rows.filter((r) => r.parent_id === parent.id).length;

  const supabase = createClient();
  const { error } = await supabase.from("planner_map_nodes").insert({
    user_id: uid,
    map_id: input.mapId,
    parent_id: parent.id,
    label,
    link_href: cleanHref(input.linkHref),
    position: nextPosition,
  });

  if (error) return fail(error.code, "Could not add that. Try again.");

  refresh(input.mapId);
  return { ok: true };
}

export async function renameNode(input: {
  mapId: string;
  id: string;
  label: string;
  note?: string | null;
  linkHref?: string | null;
}): Promise<SaveResult> {
  const label = clean(input.label, MAX_LABEL);
  if (!label) return { ok: false, error: "Give it a name first." };

  const uid = await currentUserId();
  if (!uid) return { ok: false, error: "Please log in again." };

  const patch: Record<string, unknown> = { label, updated_at: new Date().toISOString() };
  if (input.note !== undefined) patch.note = clean(input.note, LIMITS.plannerNote);
  if (input.linkHref !== undefined) patch.link_href = cleanHref(input.linkHref);

  const supabase = createClient();
  const { error } = await supabase
    .from("planner_map_nodes")
    .update(patch)
    .eq("id", input.id)
    .eq("user_id", uid);

  if (error) return fail(error.code, "Could not rename that. Try again.");

  refresh(input.mapId);
  return { ok: true };
}

export async function deleteNode(input: { mapId: string; id: string }): Promise<SaveResult> {
  const uid = await currentUserId();
  if (!uid) return { ok: false, error: "Please log in again." };

  const loaded = await loadMapRows(uid, input.mapId);
  if (!loaded.ok) return { ok: false, error: loaded.error };

  const node = loaded.rows.find((r) => r.id === input.id);
  if (!node) return { ok: true }; // already gone; nothing to say
  if (node.parent_id === null) {
    return { ok: false, error: "That's the map itself — delete the whole map instead." };
  }

  const supabase = createClient();
  // The branch below it goes too, by cascade — that is the database's job.
  const { error } = await supabase
    .from("planner_map_nodes")
    .delete()
    .eq("id", input.id)
    .eq("user_id", uid);

  if (error) return fail(error.code, "Could not remove that. Try again.");

  refresh(input.mapId);
  return { ok: true };
}

/**
 * The four structural moves, in one action.
 *
 * They are checked against the same rules `canIndent` / `canOutdent` /
 * `canMoveUp` / `canMoveDown` use to light the buttons, because a button that is
 * enabled for an operation the server refuses teaches the structure's rules
 * wrongly.
 */
export async function moveNode(input: {
  mapId: string;
  id: string;
  direction: "up" | "down" | "indent" | "outdent";
}): Promise<SaveResult> {
  const uid = await currentUserId();
  if (!uid) return { ok: false, error: "Please log in again." };

  const loaded = await loadMapRows(uid, input.mapId);
  if (!loaded.ok) return { ok: false, error: loaded.error };
  const rows = loaded.rows;

  const node = rows.find((r) => r.id === input.id);
  if (!node) return { ok: false, error: "That node is gone — reload the map." };
  if (node.parent_id === null) return { ok: false, error: "The map itself doesn't move." };

  const siblings = siblingsOf(rows, node);
  const i = siblings.findIndex((s) => s.id === node.id);
  const supabase = createClient();

  if (input.direction === "up" || input.direction === "down") {
    const j = input.direction === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= siblings.length) return { ok: false, error: "It's already at the end." };

    // Swap positions with the neighbour. Two writes, and a failure on the second
    // leaves a duplicate position — which `byPosition` breaks by id, so the tree
    // still renders in a stable order rather than flickering.
    const a = siblings[i];
    const b = siblings[j];
    const { error: e1 } = await supabase
      .from("planner_map_nodes")
      .update({ position: j })
      .eq("id", a.id)
      .eq("user_id", uid);
    if (e1) return fail(e1.code, "Could not move that. Try again.");

    const { error: e2 } = await supabase
      .from("planner_map_nodes")
      .update({ position: i })
      .eq("id", b.id)
      .eq("user_id", uid);
    if (e2) return fail(e2.code, "Could not move that. Try again.");

    refresh(input.mapId);
    return { ok: true };
  }

  if (input.direction === "indent") {
    if (i <= 0) return { ok: false, error: "Nothing above it to go under." };
    const newParent = siblings[i - 1];
    // The whole branch moves with it, so the check is on the branch, not the node.
    if (depthOf(rows, newParent.id) + 1 + subtreeHeight(rows, node.id) > MINDMAP_MAX_DEPTH) {
      return {
        ok: false,
        error: `That would go past ${MINDMAP_MAX_DEPTH} levels. Shorten the branch first.`,
      };
    }
    const position = rows.filter((r) => r.parent_id === newParent.id).length;
    const { error } = await supabase
      .from("planner_map_nodes")
      .update({ parent_id: newParent.id, position })
      .eq("id", node.id)
      .eq("user_id", uid);
    if (error) return fail(error.code, "Could not move that. Try again.");

    refresh(input.mapId);
    return { ok: true };
  }

  // outdent — become a sibling of the parent. Impossible when the parent is the
  // root, because the root has no siblings.
  const parent = rows.find((r) => r.id === node.parent_id);
  if (!parent || parent.parent_id === null) {
    return { ok: false, error: "It's already at the top level." };
  }
  const position = rows.filter((r) => r.parent_id === parent.parent_id).length;
  const { error } = await supabase
    .from("planner_map_nodes")
    .update({ parent_id: parent.parent_id, position })
    .eq("id", node.id)
    .eq("user_id", uid);
  if (error) return fail(error.code, "Could not move that. Try again.");

  refresh(input.mapId);
  return { ok: true };
}

/**
 * Send a node to the plan — it becomes a task on the board.
 *
 * This is what stops the map being a handsome dead end: thought → decision →
 * work, inside one product. The node is deliberately NOT removed. Deleting the
 * thinking at the moment you act on it is exactly backwards, and a student who
 * later wonders *why* they committed to something should find the branch it
 * came from still there.
 */
export async function promoteNodeToTask(input: {
  mapId: string;
  id: string;
}): Promise<SaveResult> {
  const uid = await currentUserId();
  if (!uid) return { ok: false, error: "Please log in again." };

  const supabase = createClient();

  const { data, error: readError } = await supabase
    .from("planner_map_nodes")
    .select("label, note, link_href")
    .eq("id", input.id)
    .eq("user_id", uid)
    .maybeSingle();

  if (readError) return fail(readError.code, "Could not read that node.");
  if (!data) return { ok: false, error: "That node is gone — reload the map." };

  const row = data as Pick<MapNodeRow, "note"> & { label: string; link_href: string | null };

  const { count, error: countError } = await supabase
    .from("planner_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", uid);

  if (countError) {
    return {
      ok: false,
      error:
        countError.code === "42P01"
          ? "The planner's table isn't set up yet — run migration 0028_planner.sql."
          : "Could not add it to your plan. Try again.",
    };
  }
  if ((count ?? 0) >= LIMITS.plannerItems) {
    return {
      ok: false,
      error: `That's ${LIMITS.plannerItems} tasks — finish or remove one first.`,
    };
  }

  const { error } = await supabase.from("planner_items").insert({
    user_id: uid,
    title: clean(row.label, LIMITS.plannerTitle),
    note: clean(row.note, LIMITS.plannerNote),
    link_href: cleanHref(row.link_href),
  });

  if (error) {
    return {
      ok: false,
      error:
        error.code === "42P01"
          ? "The planner's table isn't set up yet — run migration 0028_planner.sql."
          : "Could not add it to your plan. Try again.",
    };
  }

  refresh(input.mapId);
  try {
    revalidatePath("/planner/board");
  } catch {
    // ignore cache revalidation errors
  }
  return { ok: true };
}
