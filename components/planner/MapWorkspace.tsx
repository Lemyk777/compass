"use client";

import { useState, useTransition } from "react";
import {
  canIndent,
  canMoveDown,
  canMoveUp,
  canOutdent,
  layoutTree,
  parentIdOf,
  type MapNode,
} from "@/lib/data/mindmap";
import {
  addNode,
  deleteNode,
  moveNode,
  promoteNodeToTask,
  renameNode,
} from "@/app/planner/maps/actions";
import { LIMITS } from "@/lib/limits";
import { MapDiagram } from "@/components/planner/MapDiagram";
import { MapOutline } from "@/components/planner/MapOutline";

// One map: the picture, the outline, and the bar that edits it.
//
// The action bar acts on the CURRENT node and lives in one fixed place, rather
// than putting eight controls on every row. Two reasons, and the second is the
// one that would have been found late: a per-row control set makes a 60-node map
// unreadable, and any dropdown alternative would sit inside the diagram's
// `overflow-x: auto` container and be clipped by it.
//
// Every button is disabled exactly when its operation is impossible, using the
// same pure predicates the server actions check. A lit button the server then
// refuses teaches the structure's rules wrongly.

type Dir = "up" | "down" | "indent" | "outdent";

export function MapWorkspace({
  root,
  mapId,
}: {
  root: MapNode;
  mapId: string;
}) {
  const [currentId, setCurrentId] = useState<string>(root.id);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [adding, setAdding] = useState<"inside" | "after" | null>(null);
  const [draft, setDraft] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [pending, startTransition] = useTransition();

  const layout = layoutTree(root);
  const nodes = layout.nodes;
  const current = nodes.find((n) => n.id === currentId) ?? nodes[0];
  const isRoot = current?.id === root.id;

  function run(
    fn: () => Promise<{ ok: true } | { ok: false; error: string }>,
    ok?: string,
  ) {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        if (ok) setNotice(ok);
      } else {
        setError(res.error);
      }
    });
  }

  function move(direction: Dir) {
    run(() => moveNode({ mapId, id: currentId, direction }));
  }

  function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    const label = draft.trim();
    if (!label) return;
    // "Add after" means a sibling, which is a child of the current node's
    // parent — read from the TREE, never from the drawing. The root has no
    // parent, so there it falls back to a child, the only reading that is not
    // an error message.
    const parentId =
      adding === "inside" || isRoot
        ? currentId
        : (parentIdOf(root, currentId) ?? currentId);
    run(() => addNode({ mapId, parentId, label }));
    setDraft("");
    setAdding(null);
  }

  const disabled = pending || !current;

  return (
    <div className="space-y-4">
      {/* The bar sits OUTSIDE the diagram's scroll container on purpose. */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-line bg-card p-2">
        <BarButton
          onClick={() => {
            setAdding("inside");
            setDraft("");
          }}
          disabled={disabled}
        >
          Add inside
        </BarButton>
        <BarButton
          onClick={() => {
            setAdding("after");
            setDraft("");
          }}
          disabled={disabled || isRoot}
        >
          Add after
        </BarButton>
        <BarButton onClick={() => setRenaming(true)} disabled={disabled}>
          Rename
        </BarButton>

        <span aria-hidden className="mx-1 h-5 w-px bg-line" />

        <BarButton
          onClick={() => move("indent")}
          disabled={disabled || !canIndent(root, currentId)}
        >
          Indent
        </BarButton>
        <BarButton
          onClick={() => move("outdent")}
          disabled={disabled || !canOutdent(root, currentId)}
        >
          Outdent
        </BarButton>
        <BarButton
          onClick={() => move("up")}
          disabled={disabled || !canMoveUp(root, currentId)}
        >
          Up
        </BarButton>
        <BarButton
          onClick={() => move("down")}
          disabled={disabled || !canMoveDown(root, currentId)}
        >
          Down
        </BarButton>

        <span aria-hidden className="mx-1 h-5 w-px bg-line" />

        <BarButton
          onClick={() =>
            run(
              () => promoteNodeToTask({ mapId, id: currentId }),
              "Added to your board. The branch stays here.",
            )
          }
          disabled={disabled}
          tone="accent"
        >
          Send to plan
        </BarButton>
        <BarButton
          onClick={() => run(() => deleteNode({ mapId, id: currentId }))}
          disabled={disabled || isRoot}
        >
          Delete
        </BarButton>
      </div>

      {adding && (
        <form
          onSubmit={submitAdd}
          className="flex flex-wrap items-center gap-2"
        >
          <label className="min-w-0 flex-1">
            <span className="sr-only">
              {adding === "inside"
                ? "What goes inside it?"
                : "What comes after it?"}
            </span>
            <input
              type="text"
              autoFocus
              value={draft}
              maxLength={LIMITS.mapLabel}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={
                adding === "inside"
                  ? "What goes inside it?"
                  : "What comes after it?"
              }
              className="w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-ink placeholder:text-ink-faint focus-visible:focus-ring"
            />
          </label>
          <button
            type="submit"
            disabled={pending || draft.trim().length === 0}
            className="rounded-lg bg-cta px-3 py-1.5 text-xs font-medium text-cta-ink transition-opacity hover:opacity-90 focus-visible:focus-ring disabled:opacity-40"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setAdding(null)}
            className="text-xs text-ink-faint underline-offset-2 hover:underline focus-visible:focus-ring"
          >
            Cancel
          </button>
        </form>
      )}

      {renaming && current && (
        <RenameField
          initial={current.label}
          pending={pending}
          onCancel={() => setRenaming(false)}
          onSave={(label) => {
            run(() => renameNode({ mapId, id: currentId, label }));
            setRenaming(false);
          }}
        />
      )}

      {error && (
        <p role="alert" className="text-xs text-reach-ink">
          {error}
        </p>
      )}
      {notice && !error && (
        <p role="status" className="text-xs text-ivy-ink">
          {notice}
        </p>
      )}

      {/* Width buys columns: the outline becomes a rail beside the picture only
          once there is room for both. Below that they stack, picture first. */}
      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="order-2 lg:order-1">
          <MapOutline root={root} currentId={currentId} onPick={setCurrentId} />
          {root.children.length === 0 && (
            <p className="mt-3 max-w-[60ch] text-xs leading-relaxed text-ink-soft">
              One question so far. Add what your options are —{" "}
              <span className="text-ink">Add inside</span> puts a branch under
              whatever is selected.
            </p>
          )}
        </div>
        <div className="order-1 lg:order-2">
          <MapDiagram
            layout={layout}
            currentId={currentId}
            onPick={setCurrentId}
          />
        </div>
      </div>
    </div>
  );
}

function BarButton({
  children,
  onClick,
  disabled,
  tone = "plain",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "plain" | "accent";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-40 ${
        tone === "accent"
          ? "bg-accent-soft text-accent-ink hover:bg-accent-soft/70"
          : "border border-line text-ink-soft hover:border-ink/30 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function RenameField({
  initial,
  onSave,
  onCancel,
  pending,
}: {
  initial: string;
  onSave: (label: string) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const [value, setValue] = useState(initial);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="min-w-0 flex-1">
        <span className="sr-only">Rename this branch</span>
        <input
          type="text"
          autoFocus
          value={value}
          maxLength={LIMITS.mapLabel}
          disabled={pending}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSave(value);
            } else if (e.key === "Escape") {
              onCancel();
            }
          }}
          className="w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-ink focus-visible:focus-ring"
        />
      </label>
      <button
        type="button"
        onClick={() => onSave(value)}
        disabled={pending || value.trim().length === 0}
        className="rounded-lg bg-cta px-3 py-1.5 text-xs font-medium text-cta-ink transition-opacity hover:opacity-90 focus-visible:focus-ring disabled:opacity-40"
      >
        Save
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="text-xs text-ink-faint underline-offset-2 hover:underline focus-visible:focus-ring"
      >
        Cancel
      </button>
    </div>
  );
}
