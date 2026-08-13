"use client";

import { useRef } from "react";
import { flattenTree, type MapNode } from "@/lib/data/mindmap";

// The outline — the map's real content, and the surface a keyboard and a screen
// reader work with.
//
// It is a genuine ARIA tree: `role="tree"`, roving tabindex, **Tab moves into
// and out of the widget, arrows move within it.** That last part is the whole
// reason this is not the usual outliner: binding Tab to "indent" is the
// convention in note apps, and it takes away the one key a screen-reader user
// needs to leave the tree. Structural edits live in the action bar above
// instead, where they are also visible rather than folklore.

export function MapOutline({
  root,
  currentId,
  onPick,
}: {
  root: MapNode;
  currentId: string | null;
  onPick: (id: string) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  // Depth-first is the order the rows appear in, so it is also the order Up and
  // Down move through — which is what makes arrow navigation match what the eye
  // is doing.
  const visible = flattenTree(root);
  const index = visible.findIndex((n) => n.id === currentId);

  function focusRow(id: string) {
    onPick(id);
    // The roving tabindex has to be followed by real focus, or the next Tab
    // press leaves from wherever focus actually was.
    requestAnimationFrame(() => {
      listRef.current
        ?.querySelector<HTMLElement>(`[data-node="${CSS.escape(id)}"]`)
        ?.focus();
    });
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (index === -1) return;
    const node = visible[index];

    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        const next = visible[index + 1];
        if (next) focusRow(next.id);
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        const prev = visible[index - 1];
        if (prev) focusRow(prev.id);
        break;
      }
      case "ArrowRight": {
        // Into the branch. Nothing collapses in this release, so right is
        // "first child" rather than "expand".
        e.preventDefault();
        if (node.children.length > 0) focusRow(node.children[0].id);
        break;
      }
      case "ArrowLeft": {
        e.preventDefault();
        const parent = visible.find((n) => n.children.some((c) => c.id === node.id));
        if (parent) focusRow(parent.id);
        break;
      }
      case "Home": {
        e.preventDefault();
        focusRow(visible[0].id);
        break;
      }
      case "End": {
        e.preventDefault();
        focusRow(visible[visible.length - 1].id);
        break;
      }
    }
  }

  return (
    <div
      ref={listRef}
      role="tree"
      aria-label="Your map, as a list"
      onKeyDown={onKeyDown}
      className="space-y-0.5"
    >
      {visible.map((n) => {
        const on = n.id === currentId;
        return (
          <div
            key={n.id}
            role="treeitem"
            data-node={n.id}
            aria-level={n.depth + 1}
            aria-selected={on}
            aria-expanded={n.children.length > 0 ? true : undefined}
            // Roving tabindex: exactly one row is a tab stop, which is what
            // stops a 60-node map from being 60 presses deep.
            tabIndex={on ? 0 : -1}
            onClick={() => onPick(n.id)}
            style={{ paddingLeft: `${n.depth * 18}px` }}
            className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors focus-visible:focus-ring ${
              on
                ? "bg-accent-soft text-accent-ink"
                : "text-ink-soft hover:bg-card hover:text-ink"
            }`}
          >
            <span aria-hidden className="text-ink-faint">
              {n.depth === 0 ? "◆" : "•"}
            </span>
            <span className="min-w-0 flex-1 truncate">{n.label}</span>
            {n.linkHref && (
              <span aria-hidden className="shrink-0 text-xs text-ink-faint">
                ↗
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
