"use client";

import { useState, useTransition } from "react";
import {
  MAP_NODE_KIND_LABEL,
  canIndent,
  canMoveDown,
  canMoveUp,
  canOutdent,
  flattenTree,
  layoutTree,
  mapNodeKind,
  parentIdOf,
  type MapNode,
} from "@/lib/data/mindmap";
import {
  addNode,
  deleteMap,
  deleteNode,
  moveNode,
  promoteNodeToTask,
  renameNode,
} from "@/app/planner/maps/actions";
import { LIMITS } from "@/lib/limits";
import { Link } from "@/components/ui/Link";
import { MapDiagram } from "@/components/planner/MapDiagram";
import { MapOutline } from "@/components/planner/MapOutline";

// One map: the picture, the outline, and the bar that edits it.
//
// **The bar used to be ten words and no subject.** Add inside · Add after ·
// Rename · Indent · Outdent · Up · Down · Send to plan · Delete, laid in a row
// with nothing on screen saying WHICH branch any of them would act on. That is
// the whole of "the map's controls are terrible": not that the operations are
// wrong — they are the right operations, and each is disabled exactly when it
// is impossible — but that a verb with an invisible object cannot be
// understood, and half of them were named after the data structure rather than
// after the decision.
//
// Three changes, and they are all the same change:
//
//   1. **The subject is stated.** "Working on — Germany, Country" sits above the
//      verbs. Everything else on the bar becomes readable the moment that line
//      exists.
//   2. **Ten controls became five groups.** The two adds are one control with
//      the choice inside its own form, where the words "inside it" and
//      "after it" can be full sentences instead of button labels. The four
//      structural moves become one labelled group of arrows, which is what they
//      always were.
//   3. **Direction is drawn, not named.** Indent and outdent are tree
//      vocabulary; ← and → with "move it out one level" as the label are the
//      same operation explained.
//
// The bar still sits OUTSIDE the diagram's scroll container, and every button is
// still disabled exactly when its operation is impossible, using the same pure
// predicates the server actions check. A lit button the server then refuses
// teaches the structure's rules wrongly.

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
  const [adding, setAdding] = useState(false);
  const [where, setWhere] = useState<"inside" | "after">("inside");
  const [draft, setDraft] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  const layout = layoutTree(root);
  // From the TREE, not the layout: the bar needs the node's link to say what
  // the branch is and where to read about it, and the layout carries geometry.
  const all = flattenTree(root);
  const current = all.find((n) => n.id === currentId) ?? all[0];
  const isRoot = current?.id === root.id;
  const kindLabel = current
    ? MAP_NODE_KIND_LABEL[mapNodeKind(current.linkHref)]
    : null;

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
    // "After" means a sibling, which is a child of the current node's parent —
    // read from the TREE, never from the drawing. The root has no parent, so
    // there it falls back to a child, the only reading that is not an error.
    const parentId =
      where === "inside" || isRoot
        ? currentId
        : (parentIdOf(root, currentId) ?? currentId);
    run(() => addNode({ mapId, parentId, label }));
    setDraft("");
    setAdding(false);
  }

  const disabled = pending || !current;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-card">
        {/* THE SUBJECT. Everything under it acts on this branch, and before
            this line existed nothing on screen said so. */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-b border-line px-3.5 py-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
            Working on
          </span>
          <span className="min-w-0 truncate text-sm font-semibold text-ink">
            {current?.label ?? "—"}
          </span>
          {kindLabel && (
            <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent-ink">
              {kindLabel}
            </span>
          )}
          {/* A typed branch knows the page it came from. Offering it here is
              what keeps the map inside the guide rather than beside it. */}
          {current?.linkHref && (
            <Link
              href={current.linkHref}
              className="ml-auto inline-flex min-h-11 items-center text-sm font-medium text-accent-ink underline-offset-4 transition hover:underline focus-visible:focus-ring"
            >
              Read about it
            </Link>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-2">
          <BarButton
            onClick={() => {
              setAdding(true);
              setWhere("inside");
              setDraft("");
            }}
            disabled={disabled}
            tone="accent"
          >
            Add a branch
          </BarButton>
          <BarButton onClick={() => setRenaming(true)} disabled={disabled}>
            Rename
          </BarButton>

          <span aria-hidden className="mx-1 h-5 w-px bg-line" />

          {/* One labelled group instead of four loose words. The arrows say
              direction better than "indent" ever did, and the labels underneath
              them say it in the student's language. */}
          <div
            role="group"
            aria-label="Move this branch"
            className="flex items-center gap-1"
          >
            <MoveButton
              path="M15 18l-6-6 6-6"
              label="Move it out one level"
              onClick={() => move("outdent")}
              disabled={disabled || !canOutdent(root, currentId)}
            />
            <MoveButton
              path="M9 18l6-6-6-6"
              label="Move it in, under the branch above it"
              onClick={() => move("indent")}
              disabled={disabled || !canIndent(root, currentId)}
            />
            <MoveButton
              path="M18 15l-6-6-6 6"
              label="Move it earlier among the branches beside it"
              onClick={() => move("up")}
              disabled={disabled || !canMoveUp(root, currentId)}
            />
            <MoveButton
              path="M6 9l6 6 6-6"
              label="Move it later among the branches beside it"
              onClick={() => move("down")}
              disabled={disabled || !canMoveDown(root, currentId)}
            />
          </div>

          <span aria-hidden className="mx-1 h-5 w-px bg-line" />

          <BarButton
            onClick={() =>
              run(
                () => promoteNodeToTask({ mapId, id: currentId }),
                "Added to your board. The branch stays here.",
              )
            }
            disabled={disabled}
          >
            Send to my plan
          </BarButton>
          <BarButton
            onClick={() => run(() => deleteNode({ mapId, id: currentId }))}
            disabled={disabled || isRoot}
          >
            Delete
          </BarButton>
        </div>
      </div>

      {adding && (
        <form
          onSubmit={submitAdd}
          className="rounded-2xl border border-accent/40 bg-card p-3.5"
        >
          {/* The choice lives HERE, where each option can be a sentence, rather
              than as two bar buttons whose difference nobody could guess. */}
          <fieldset className="flex flex-wrap items-center gap-1.5">
            <legend className="sr-only">Where does the new branch go?</legend>
            <WhereButton
              on={where === "inside"}
              onClick={() => setWhere("inside")}
            >
              Inside {shortName(current?.label)}
            </WhereButton>
            <WhereButton
              on={where === "after"}
              onClick={() => setWhere("after")}
              disabled={isRoot}
            >
              Beside it
            </WhereButton>
          </fieldset>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <label className="min-w-0 flex-1">
              <span className="sr-only">What is the new branch?</span>
              <input
                type="text"
                autoFocus
                value={draft}
                maxLength={LIMITS.mapLabel}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={
                  where === "inside"
                    ? "What goes inside it?"
                    : "What is the alternative?"
                }
                className="min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-faint focus-visible:focus-ring"
              />
            </label>
            <button
              type="submit"
              disabled={pending || draft.trim().length === 0}
              className="inline-flex min-h-11 items-center rounded-lg bg-cta px-4 text-sm font-medium text-cta-ink transition-opacity hover:opacity-90 focus-visible:focus-ring disabled:opacity-40"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="inline-flex min-h-11 items-center px-1 text-sm text-ink-faint underline-offset-2 hover:underline focus-visible:focus-ring"
            >
              Cancel
            </button>
          </div>
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
        <p role="alert" className="text-sm text-reach-ink">
          {error}
        </p>
      )}
      {notice && !error && (
        <p role="status" className="text-sm text-ivy-ink">
          {notice}
        </p>
      )}

      {/* Width buys columns: the outline becomes a rail beside the picture only
          once there is room for both. Below that they stack, picture first. */}
      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="order-2 lg:order-1">
          <MapOutline root={root} currentId={currentId} onPick={setCurrentId} />
          {root.children.length === 0 && (
            <p className="mt-3 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
              One question so far. Pick a branch above, then{" "}
              <span className="font-medium text-ink">Add a branch</span> — an
              option, a place, or a thing you would have to do.
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

      {/* Deleting the WHOLE map, which the product promised and did not provide.
          `createMap` refuses the thirteenth with "That's 12 maps — delete one
          before starting another", and `deleteMap` had been written, validated
          and left wired to nothing: a student who filled their quota was told
          to do something the interface offered no way to do.

          At the foot, away from the branch bar, and behind a confirm — the bar
          above already has a Delete that means one branch, and two controls
          with the same word and different objects is the "verb with an
          invisible subject" problem that bar was rebuilt to fix. */}
      <div className="border-t border-line pt-4">
        {confirmingDelete ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-ink">
              Delete <span className="font-medium">{root.label}</span> and every
              branch on it?
            </p>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => deleteMap(mapId))}
              className="inline-flex h-9 items-center rounded-lg border border-reach px-3 text-xs font-medium text-reach-ink transition-colors hover:bg-reach-soft focus-visible:focus-ring disabled:opacity-50"
            >
              Yes, delete this map
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="text-xs font-medium text-ink-faint underline-offset-2 hover:text-ink hover:underline focus-visible:focus-ring"
            >
              Keep it
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="inline-flex min-h-11 items-center text-xs font-medium text-ink-faint underline-offset-2 transition-colors hover:text-ink hover:underline focus-visible:focus-ring"
          >
            Delete this whole map
          </button>
        )}
      </div>
    </div>
  );
}

/** Enough of a label to identify it in a sentence, without wrapping a control. */
function shortName(label: string | undefined): string {
  if (!label) return "it";
  return label.length > 18 ? `${label.slice(0, 17)}…` : label;
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
      // 44px tall, like every other control a student taps. These were 30px,
      // which is a third of the minimum on the surface most of them are on.
      className={`inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-40 ${
        tone === "accent"
          ? "bg-accent-soft text-accent-ink hover:bg-accent-soft/70"
          : "border border-line text-ink-soft hover:border-ink/30 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * One arrow. The visible label is the arrow; the accessible one is the sentence,
 * and `title` puts that same sentence on the pointer — so nobody has to know
 * what "outdent" means to use it.
 */
function MoveButton({
  path,
  label,
  onClick,
  disabled,
}: {
  path: string;
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="inline-flex h-11 w-10 items-center justify-center rounded-lg border border-line text-ink-soft transition-colors hover:border-ink/30 hover:text-ink focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-40"
    >
      <svg
        viewBox="0 0 24 24"
        width="17"
        height="17"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={path} />
      </svg>
    </button>
  );
}

function WhereButton({
  on,
  onClick,
  disabled,
  children,
}: {
  on: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={on}
      className={`inline-flex min-h-11 max-w-full items-center truncate rounded-lg border px-3 text-sm font-medium transition-colors focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-40 ${
        on
          ? "border-accent bg-accent-soft text-accent-ink"
          : "border-line text-ink-soft hover:border-ink/30 hover:text-ink"
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
          className="min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink focus-visible:focus-ring"
        />
      </label>
      <button
        type="button"
        onClick={() => onSave(value)}
        disabled={pending || value.trim().length === 0}
        className="inline-flex min-h-11 items-center rounded-lg bg-cta px-4 text-sm font-medium text-cta-ink transition-opacity hover:opacity-90 focus-visible:focus-ring disabled:opacity-40"
      >
        Save
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex min-h-11 items-center px-1 text-sm text-ink-faint underline-offset-2 hover:underline focus-visible:focus-ring"
      >
        Cancel
      </button>
    </div>
  );
}
