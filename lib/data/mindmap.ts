// Mind maps — the planner's third view (backlog #17, release 2).
//
// ONE DECISION EVERYTHING HERE FOLLOWS FROM: we store the STRUCTURE, never the
// coordinates. A node knows its parent and its position among its siblings;
// where it lands on screen is computed here, so one tree always draws one
// picture.
//
// That is the same "separate what decays from what holds" move the guide made
// with rankings. The value of a student's map is the branching — these are my
// options, this is what each one needs. Nobody's future depends on whether
// "Germany" sits at x=340. Coordinates are the part that would rot, that would
// cost a drag implementation, and that would be unusable on a phone.
//
// It also settles three things at once:
//   • the planner's own rule holds — "moving is a button, never a drag" — because
//     there is now nothing to drag;
//   • the outline is operable from a keyboard without building a second,
//     parallel interaction model purely to pass the accessibility test;
//   • the picture is unit-testable, which a dragged one is not.
//
// Pure: no I/O, no clock, no dataset import.

/** How deep a map may go. Also the bound that keeps the diagram drawable. */
export const MINDMAP_MAX_DEPTH = 4;

/** A row of `planner_map_nodes` (migration 0029), already mapped. */
export type MapNodeRow = {
  id: string;
  mapId: string;
  /** null = this is a map's root. */
  parentId: string | null;
  label: string;
  note: string | null;
  /** An in-app path, or null. Never an external URL. */
  linkHref: string | null;
  /** Order among siblings. */
  position: number;
};

export type MapNode = {
  id: string;
  label: string;
  note: string | null;
  linkHref: string | null;
  /** 0 for the root. */
  depth: number;
  children: MapNode[];
};

// ── Building ──────────────────────────────────────────────────────────────────

/**
 * Flat rows → a tree rooted at `rootId`.
 *
 * Defensive about three states the database can technically hold and a renderer
 * cannot survive. None of them should ever happen; each would hang or crash the
 * page if it did, and the cost of being sure is a visited set and a counter:
 *
 *  • a `parent_id` pointing at a row from another map — dropped. The query is
 *    already scoped by `map_id`; this does not assume the query was written
 *    correctly.
 *  • a cycle (a → b → a) — broken rather than recursed into.
 *  • depth past the cap — truncated rather than rendered.
 *
 * Returns null when `rootId` is not among the rows.
 */
export function buildTree(rows: MapNodeRow[], rootId: string): MapNode | null {
  const root = rows.find((r) => r.id === rootId);
  if (!root) return null;

  // One map only. A row carrying a different `map_id` is not ours to draw.
  const mapId = root.mapId;
  const byParent = new Map<string, MapNodeRow[]>();
  for (const r of rows) {
    if (r.mapId !== mapId) continue;
    if (r.parentId == null) continue;
    byParent.set(r.parentId, [...(byParent.get(r.parentId) ?? []), r]);
  }

  const visited = new Set<string>();

  function build(row: MapNodeRow, depth: number): MapNode {
    visited.add(row.id);
    const children =
      depth >= MINDMAP_MAX_DEPTH
        ? []
        : (byParent.get(row.id) ?? [])
            .filter((c) => !visited.has(c.id))
            .sort(byPosition)
            .map((c) => build(c, depth + 1));

    return {
      id: row.id,
      label: row.label,
      note: row.note,
      linkHref: row.linkHref,
      depth,
      children,
    };
  }

  return build(root, 0);
}

/** Position first, then id — a total order, so the tree is deterministic. */
function byPosition(a: MapNodeRow, b: MapNodeRow): number {
  return a.position === b.position ? a.id.localeCompare(b.id) : a.position - b.position;
}

/** Every node of a tree, depth-first — the order the outline renders in. */
export function flattenTree(root: MapNode): MapNode[] {
  const out: MapNode[] = [];
  const walk = (n: MapNode) => {
    out.push(n);
    n.children.forEach(walk);
  };
  walk(root);
  return out;
}

// ── Layout ────────────────────────────────────────────────────────────────────

/** Geometry, in one place so the SVG and the tests cannot disagree. */
export const MINDMAP_GEOMETRY = {
  /** Horizontal distance between one depth and the next. */
  columnWidth: 200,
  /** Vertical distance between two leaves. */
  rowHeight: 56,
  nodeWidth: 168,
  nodeHeight: 40,
  padding: 16,
} as const;

export type PlacedNode = {
  id: string;
  label: string;
  depth: number;
  /** Centre of the node box. */
  x: number;
  y: number;
};

export type MapEdge = { from: string; to: string; x1: number; y1: number; x2: number; y2: number };

export type MapLayout = {
  nodes: PlacedNode[];
  edges: MapEdge[];
  width: number;
  height: number;
};

/**
 * A tidy horizontal tree: depth sets `x`, leaves take successive `y` slots, and
 * a parent sits at the midpoint of its first and last child.
 *
 * That is the whole algorithm. It is a few dozen lines rather than a dependency
 * because the shape we need is the simple one — and because a layout we own is
 * a layout we can assert.
 */
export function layoutTree(root: MapNode): MapLayout {
  const g = MINDMAP_GEOMETRY;
  const nodes: PlacedNode[] = [];
  const edges: MapEdge[] = [];
  const yOf = new Map<string, number>();
  let nextLeafRow = 0;

  // Post-order: a parent's y needs its children's.
  function place(n: MapNode): number {
    const x = g.padding + n.depth * g.columnWidth + g.nodeWidth / 2;

    let y: number;
    if (n.children.length === 0) {
      y = g.padding + nextLeafRow * g.rowHeight + g.nodeHeight / 2;
      nextLeafRow += 1;
    } else {
      const childYs = n.children.map(place);
      y = (childYs[0] + childYs[childYs.length - 1]) / 2;
    }

    yOf.set(n.id, y);
    nodes.push({ id: n.id, label: n.label, depth: n.depth, x, y });

    for (const c of n.children) {
      edges.push({
        from: n.id,
        to: c.id,
        x1: x + g.nodeWidth / 2,
        y1: y,
        x2: g.padding + c.depth * g.columnWidth,
        y2: yOf.get(c.id)!,
      });
    }

    return y;
  }

  place(root);

  const maxDepth = nodes.reduce((d, n) => Math.max(d, n.depth), 0);
  // `nextLeafRow` is at least 1 — a root on its own is a leaf — so an empty map
  // still has a canvas rather than collapsing to nothing.
  const rows = Math.max(nextLeafRow, 1);

  return {
    nodes,
    edges,
    width: g.padding * 2 + maxDepth * g.columnWidth + g.nodeWidth,
    height: g.padding * 2 + rows * g.rowHeight,
  };
}

// ── What can move where ───────────────────────────────────────────────────────
//
// These drive the action bar's disabled states, and they are the same
// predicates the server actions check. A button that is lit when the operation
// is impossible is how a structure editor teaches its own rules wrongly — so
// they live here, pure, and are asserted against the actions' behaviour.

/**
 * The id of a node's parent, or null for the root (and for an id not in this
 * tree). Exported because "add a sibling" means "add a child of my parent", and
 * the caller must not work that out from the geometry — the picture is derived
 * from the tree, so reading the tree back out of the picture is backwards.
 */
export function parentIdOf(root: MapNode, id: string): string | null {
  return parentOf(root, id)?.id ?? null;
}

function parentOf(root: MapNode, id: string): MapNode | null {
  let found: MapNode | null = null;
  const walk = (n: MapNode) => {
    if (n.children.some((c) => c.id === id)) found = n;
    n.children.forEach(walk);
  };
  walk(root);
  return found;
}

function indexAmongSiblings(root: MapNode, id: string): number {
  const p = parentOf(root, id);
  return p ? p.children.findIndex((c) => c.id === id) : -1;
}

/** The root is not a card: it cannot move, indent, outdent or be deleted. */
export function canMoveUp(root: MapNode, id: string): boolean {
  return indexAmongSiblings(root, id) > 0;
}

export function canMoveDown(root: MapNode, id: string): boolean {
  const p = parentOf(root, id);
  if (!p) return false;
  const i = p.children.findIndex((c) => c.id === id);
  return i >= 0 && i < p.children.length - 1;
}

/** Indent = become the child of the sibling above you, so the first cannot. */
export function canIndent(root: MapNode, id: string): boolean {
  const p = parentOf(root, id);
  if (!p) return false;
  const i = p.children.findIndex((c) => c.id === id);
  if (i <= 0) return false;
  // The new parent is the sibling above, one level deeper than it is now.
  return p.children[i - 1].depth + 1 < MINDMAP_MAX_DEPTH;
}

/**
 * Outdent = become a sibling of your parent. Impossible at depth 1, because the
 * parent is then the root and the root has no siblings.
 */
export function canOutdent(root: MapNode, id: string): boolean {
  const p = parentOf(root, id);
  if (!p) return false;
  return p.id !== root.id;
}
