import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { buildTree, type MapNode, type MapNodeRow } from "@/lib/data/mindmap";

// Reads for the mind maps. Server-only, and deliberately thin: everything that
// turns rows into a shape lives in the pure core, so it can be tested without a
// database.
//
// A missing table (0029 unapplied) reads as "no maps" rather than a crashed
// page — the same degradation every newer table gets in this codebase.

export type MapSummary = { id: string; label: string; nodeCount: number };

function toRow(r: Record<string, unknown>): MapNodeRow {
  return {
    id: r.id as string,
    mapId: r.map_id as string,
    parentId: (r.parent_id as string | null) ?? null,
    label: r.label as string,
    note: (r.note as string | null) ?? null,
    linkHref: (r.link_href as string | null) ?? null,
    position: (r.position as number | null) ?? 0,
  };
}

/** Every map the student owns, with how much is in each. */
export const loadMaps = cache(async (userId: string): Promise<MapSummary[]> => {
  const supabase = createClient();
  const { data } = await supabase
    .from("planner_map_nodes")
    .select("id, map_id, parent_id, label")
    .eq("user_id", userId);

  const rows = (data ?? []) as Record<string, unknown>[];
  const counts = new Map<string, number>();
  for (const r of rows) {
    const m = r.map_id as string;
    counts.set(m, (counts.get(m) ?? 0) + 1);
  }

  return rows
    .filter((r) => r.parent_id == null)
    .map((r) => ({
      id: r.id as string,
      label: r.label as string,
      // The root counts as a node in the table but not as something the student
      // put there, so what is reported is what they added.
      nodeCount: Math.max((counts.get(r.map_id as string) ?? 1) - 1, 0),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
});

/** One map, as a tree. Null when it does not exist or is not theirs. */
export const loadMap = cache(
  async (userId: string, mapId: string): Promise<MapNode | null> => {
    const supabase = createClient();
    const { data } = await supabase
      .from("planner_map_nodes")
      .select("*")
      .eq("user_id", userId)
      .eq("map_id", mapId);

    const rows = (data ?? []) as Record<string, unknown>[];
    if (rows.length === 0) return null;

    // The root is the node whose id is the map id — that is what makes a map a
    // root rather than a second table.
    return buildTree(rows.map(toRow), mapId);
  },
);
