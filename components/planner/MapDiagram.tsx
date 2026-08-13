"use client";

import { MINDMAP_GEOMETRY, type MapLayout } from "@/lib/data/mindmap";

// The picture of the tree.
//
// It draws a layout it is given and computes nothing, which is what keeps the
// geometry testable — and it is `role="img"`, not an interactive surface: the
// outline beside it is the real content and the thing a screen reader walks.
// Two representations of one tree, and only one of them is authoritative.
//
// The wide-content rule applies here and is easy to get wrong: a map four
// levels deep is ~800px, so it scrolls inside its OWN container. The page body
// must never scroll sideways.

const g = MINDMAP_GEOMETRY;

/** Long labels are cut in the picture and kept in full in the outline. */
function short(label: string): string {
  return label.length > 22 ? `${label.slice(0, 21)}…` : label;
}

export function MapDiagram({
  layout,
  currentId,
  onPick,
}: {
  layout: MapLayout;
  currentId: string | null;
  onPick: (id: string) => void;
}) {
  const { nodes, edges, width, height } = layout;

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-card p-1">
      <svg
        role="img"
        aria-label={`Your map, ${nodes.length} ${nodes.length === 1 ? "node" : "nodes"}. The list below it is the same map, and is where you edit it.`}
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="max-w-none"
      >
        {edges.map((e) => (
          <path
            key={`${e.from}-${e.to}`}
            // A cubic with horizontal handles: the line leaves a parent sideways
            // and arrives at a child sideways, which is what makes a tree read
            // as a tree rather than as a web of diagonals.
            d={`M ${e.x1} ${e.y1} C ${e.x1 + g.columnWidth / 3} ${e.y1}, ${e.x2 - g.columnWidth / 3} ${e.y2}, ${e.x2} ${e.y2}`}
            className="fill-none stroke-line"
            strokeWidth={1.5}
          />
        ))}

        {nodes.map((n) => {
          const on = n.id === currentId;
          return (
            <g
              key={n.id}
              // The picture mirrors the outline's selection so the two panes
              // never disagree about where you are. It is not a tab stop: the
              // outline owns keyboard navigation, and two focusable copies of
              // one tree is a worse experience, not a more accessible one.
              tabIndex={-1}
              onClick={() => onPick(n.id)}
              className="cursor-pointer"
            >
              <title>{n.label}</title>
              <rect
                x={n.x - g.nodeWidth / 2}
                y={n.y - g.nodeHeight / 2}
                width={g.nodeWidth}
                height={g.nodeHeight}
                rx={10}
                className={
                  on
                    ? "fill-accent-soft stroke-accent"
                    : "fill-surface stroke-line"
                }
                strokeWidth={on ? 2 : 1}
              />
              <text
                x={n.x}
                y={n.y}
                dominantBaseline="central"
                textAnchor="middle"
                className={`text-xs font-medium ${on ? "fill-accent-ink" : "fill-ink"}`}
              >
                {short(n.label)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
