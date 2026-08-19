"use client";

import { useState, useTransition } from "react";
import { addPick, removePick } from "@/app/planner/actions";
import { addNode } from "@/app/planner/maps/actions";
import { pickHref, type PickKind } from "@/lib/data/plan-picks";
import type { GuideMapTarget } from "@/lib/guide/plan-state";

// THE MISSING HALF OF THE BRIDGE.
//
// The plan could already send you into the guide. Nothing could bring anything
// back: you could read every word about Germany and there was no way to say
// "this one is mine", so the plan had no idea what you had been thinking about
// and the guide had no idea you had decided anything. That is most of why the
// two read as separate products rather than as one section continuing another.
//
// **One quiet control, and that constraint is the design.** The temptation is a
// big coloured call to action, and it would turn every country profile into a
// page about the plan — which is the opposite of what the guide is for. So it
// takes the width of the rail it sits in, states plainly what it does, and
// changes to a settled state rather than congratulating anybody.
//
// Signed out it is a LINK to sign in that comes back here, not a hidden control
// and not a disabled one. A reader who has just decided something is exactly
// the person for whom an account is worth the friction, and hiding the control
// would hide the reason.
export function AddToPlan({
  kind,
  id,
  label,
  signedIn,
  saved: initiallySaved,
  returnTo,
  maps = [],
  /** `compact` is for a control that sits inside a card in a list, not in a rail. */
  size = "default",
}: {
  kind: PickKind;
  id: string;
  label: string;
  signedIn: boolean;
  saved: boolean;
  returnTo: string;
  /** Maps the reader already has. Empty means this half does not exist. */
  maps?: GuideMapTarget[];
  size?: "default" | "compact";
}) {
  // Held locally so the control settles the instant it is pressed. The server
  // action revalidates both this page and the plan, so the prop it was seeded
  // with catches up — but a student on a phone should not watch a round trip
  // before knowing whether the press landed.
  const [saved, setSaved] = useState(initiallySaved);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // The map half, and it is deliberately the SECOND thing. A guide page gets
  // one control; this one only unfolds once the reader has claimed the subject
  // and only if they already keep maps — so nobody meets two calls to action
  // while reading about Germany, and nobody is invited to start a map they have
  // no use for. Progressive disclosure, and the same restraint the rail already
  // asks for.
  const [pickingMap, setPickingMap] = useState(false);
  const [onMaps, setOnMaps] = useState<string[]>([]);

  const compact = size === "compact";

  if (!signedIn) {
    return (
      <a
        href={`/auth/login?next=${encodeURIComponent(returnTo)}`}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-card font-medium text-ink-soft transition-colors hover:border-accent hover:text-ink focus-visible:focus-ring ${
          compact ? "min-h-11 px-3 text-xs" : "min-h-12 px-4 text-sm"
        }`}
      >
        <PlusIcon />
        Add to my plan
      </a>
    );
  }

  function toggle() {
    setError(null);
    const next = !saved;
    setSaved(next);
    startTransition(async () => {
      const res = next
        ? await addPick({ kind, id, label })
        : await removePick({ kind, id });
      // Put it back if the server disagreed. An optimistic state that lies is
      // worse than a slow one — this is the plan telling them what they decided.
      if (!res.ok) {
        setSaved(!next);
        setError(res.error);
      }
    });
  }

  return (
    <div className={compact ? "" : "space-y-1.5"}>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={saved}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border font-medium transition-colors focus-visible:focus-ring disabled:opacity-60 ${
          compact ? "min-h-11 px-3 text-xs" : "min-h-12 px-4 text-sm"
        } ${
          saved
            ? "border-accent bg-accent-soft text-accent-ink"
            : "border-line bg-card text-ink-soft hover:border-accent hover:text-ink"
        }`}
      >
        {saved ? <CheckIcon /> : <PlusIcon />}
        {saved ? "On your plan" : "Add to my plan"}
      </button>

      {/* Said once, under the control, and only before it has been used. After
          that the state itself is the explanation. */}
      {!compact && !saved && !error && (
        <p className="text-xs leading-relaxed text-ink-faint">
          Puts it in your plan so what you decide here becomes what you do next.
        </p>
      )}

      {/* The other half of the bridge: the map could already send a branch to
          the plan and could not receive one, so it could display the structure
          of a decision without helping anyone build it. The node carries the
          page's own path, which is all `mapNodeKind` needs to type it — no
          `kind` column here either. */}
      {!compact && saved && maps.length > 0 && (
        <div className="space-y-1.5 pt-0.5">
          {onMaps.length > 0 && (
            <p role="status" className="text-xs leading-relaxed text-ivy-ink">
              Added to {onMaps.join(", ")}.
            </p>
          )}

          {!pickingMap ? (
            <button
              type="button"
              onClick={() => setPickingMap(true)}
              className="inline-flex min-h-11 items-center text-xs font-medium text-ink-soft underline-offset-2 transition-colors hover:text-ink hover:underline focus-visible:focus-ring"
            >
              Also put it on a map
            </button>
          ) : (
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-faint">
                Which map?
              </p>
              <ul className="mt-1.5 space-y-1">
                {maps.map((m) => {
                  const done = onMaps.includes(m.label);
                  return (
                    <li key={m.id}>
                      <button
                        type="button"
                        disabled={pending || done}
                        onClick={() => putOnMap(m.id, m.label)}
                        className="inline-flex min-h-11 w-full items-center gap-2 rounded-lg border border-line px-3 text-left text-xs font-medium text-ink-soft transition-colors hover:border-accent hover:text-ink focus-visible:focus-ring disabled:opacity-50"
                      >
                        {done ? <CheckIcon /> : <PlusIcon />}
                        <span className="min-w-0 truncate">{m.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                onClick={() => setPickingMap(false)}
                className="mt-1 inline-flex min-h-11 items-center text-xs text-ink-faint underline-offset-2 hover:underline focus-visible:focus-ring"
              >
                Not now
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs leading-relaxed text-reach-ink">
          {error}
        </p>
      )}
    </div>
  );

  function putOnMap(mapId: string, mapLabel: string) {
    setError(null);
    startTransition(async () => {
      const res = await addNode({
        mapId,
        // The root's id IS the map id — that is what makes a map a root rather
        // than a second table. A subject arriving from the guide hangs off it,
        // and the student moves it where it belongs with the map's own arrows.
        parentId: mapId,
        label,
        // Computed from the pick, never taken from a caller — the same rule the
        // plan's own writes follow, and the reason `pickHref` exists.
        linkHref: pickHref(kind, id),
      });
      if (res.ok) {
        setOnMaps((prev) =>
          prev.includes(mapLabel) ? prev : [...prev, mapLabel],
        );
        setPickingMap(false);
      } else {
        setError(res.error);
      }
    });
  }
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
