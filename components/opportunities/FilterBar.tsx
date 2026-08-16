"use client";

import { useId, useMemo, useState } from "react";
import {
  COST_OPTIONS,
  LEVEL_OPTIONS,
  MATCH_OPTIONS,
  NO_FILTERS,
  TIMING_OPTIONS,
  activeChips,
  activeFilterCount,
  opportunityFacets,
  toggleFilter,
  withoutChip,
  type OpportunityFilters,
} from "@/lib/data/opportunity-filter";
import type { Opportunity } from "@/lib/data/key-dates";

// The search box and the "Filters" button for the Opportunities section.
//
// The list was browsable by kind and by nothing else, so "the free ones", "the
// ones closing this month" and "that thing I saw called ISEF" all came down to
// scrolling. Everything this filters on is already printed on every card —
// money, when it closes, what level it is, whether you can enter yet — so this
// adds no new claims about an opportunity, only a way to ask for one.
//
// Shape, deliberately:
//  • the search field is ALWAYS visible; the criteria are one tap behind a
//    button, because a wall of eleven chips on arrival is the choice overload
//    this section spends the rest of its design avoiding;
//  • every option carries its count, so picking one is a decision rather than a
//    guess — the same reason the category tabs carry theirs;
//  • whatever is on shows as a removable chip even when the panel is shut. A
//    filter you can't see is one you forget you set, and then an empty list
//    reads as "Compass has nothing for me".
//
// Not a modal on purpose: this state has no URL, and a dialog that blanks the
// list you are filtering hides the only feedback the filter has.

export function FilterBar({
  items,
  value,
  onChange,
  resultCount,
}: {
  /**
   * The pool the counts are computed over — the WHOLE annotated catalog, not
   * the student's own slice. It has to be, or the "Matched to you" group could
   * not say how many rows it is removing.
   */
  items: Opportunity[];
  value: OpportunityFilters;
  onChange: (next: OpportunityFilters) => void;
  /** How many rows survive `value` right now, including the kind tabs. */
  resultCount: number;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const active = activeFilterCount(value);
  const chips = activeChips(value);
  const facets = useMemo(() => opportunityFacets(items, value), [items, value]);

  return (
    <div className="rounded-2xl border border-line bg-card p-2.5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-[11rem] flex-1">
          <span className="sr-only">Search your opportunities</span>
          <SearchIcon />
          <input
            type="search"
            value={value.query}
            onChange={(e) => onChange({ ...value, query: e.target.value })}
            onKeyDown={(e) => {
              // Escape clears the box rather than closing something — there is
              // nothing open to close, and re-selecting the text to delete it is
              // the fiddliest thing on a phone.
              if (e.key === "Escape" && value.query !== "") {
                e.preventDefault();
                onChange({ ...value, query: "" });
              }
            }}
            placeholder="Search by name, subject or keyword"
            className="h-10 w-full rounded-xl border border-line bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus-visible:focus-ring"
          />
        </label>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={panelId}
          className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border px-3.5 text-sm font-medium transition-colors focus-visible:focus-ring ${
            open || active > 0
              ? "border-accent bg-accent-soft text-accent-ink"
              : "border-line bg-card text-ink-soft hover:border-ink/30 hover:text-ink"
          }`}
        >
          <FilterIcon />
          Filters
          {active > 0 && (
            <span
              data-num
              className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold tabular-nums text-on-fill"
            >
              {active}
            </span>
          )}
          <Chevron open={open} />
        </button>
      </div>

      {/* The verdict line: what the filters did, in numbers, before the list. */}
      {active > 0 && (
        <p className="mt-2 px-0.5 text-xs text-ink-soft">
          <span data-num className="font-semibold text-ink">
            {resultCount}
          </span>{" "}
          {resultCount === 1 ? "matches" : "match"} your filters — of{" "}
          {/* `items` is the whole annotated catalog now, not the student's own
              slice, so "matched to you" would be a lie by one word. Matching
              stopped hiding rows; this panel is what narrows them. */}
          <span data-num>{items.length}</span> we track.
        </p>
      )}

      {chips.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => onChange(withoutChip(value, chip))}
              aria-label={`Remove filter: ${chip.label}`}
              className="inline-flex h-7 items-center gap-1.5 rounded-full border border-accent/40 bg-accent-soft px-2.5 text-xs font-medium text-accent-ink transition-colors hover:border-accent focus-visible:focus-ring"
            >
              {chip.label}
              <span aria-hidden className="text-accent-ink/60">
                &times;
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => onChange(NO_FILTERS)}
            className="ml-0.5 text-xs font-medium text-ink-faint underline-offset-2 hover:text-ink hover:underline focus-visible:focus-ring"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Two deliberate choices. No open/close animation: an animated height
          holds the panel at 0 until a rAF-driven tween runs, so the criteria
          would sit in the accessibility tree while being invisible on screen —
          the same "content depends on an animation finishing" trap the landing
          page's scroll-reveals were removed for. And `hidden` rather than an
          unmount, so the `aria-controls` above always points at something real
          (a hidden element is out of the tab order, so nothing is reachable
          that isn't visible). */}
      <div
        hidden={!open}
        id={panelId}
        className="mt-2.5 divide-y divide-line border-t border-line pt-1"
      >
        <Group
          label="Money"
          // The rule this group runs on, stated where it is applied. It used to
          // live ONLY in a `title` attribute — which does not exist on a
          // touchscreen, is not reliably announced by a screen reader, and is
          // unreachable from the keyboard. So the product's single most
          // load-bearing piece of honesty ("free" never covers a cost we have
          // not verified) was legible to a mouse and invisible to everyone else,
          // on the surface most likely to be opened on a phone.
          note="“Free” means free the whole way through. Anything whose cost we have not verified is in no money bucket at all — so widening this filter is how you see those."
        >
          {COST_OPTIONS.map((o) => (
            <Toggle
              key={o.id}
              on={value.cost.includes(o.id)}
              count={facets.cost[o.id]}
              title={o.hint}
              onClick={() => onChange(toggleFilter(value, "cost", o.id))}
            >
              {o.label}
            </Toggle>
          ))}
        </Group>

        <Group label="When">
          {TIMING_OPTIONS.map((o) => (
            <Toggle
              key={o.id}
              on={value.timing.includes(o.id)}
              count={facets.timing[o.id]}
              title={o.hint}
              onClick={() => onChange(toggleFilter(value, "timing", o.id))}
            >
              {o.label}
            </Toggle>
          ))}
        </Group>

        <Group label="Level">
          {LEVEL_OPTIONS.map((o) => (
            <Toggle
              key={o.id}
              on={value.levels.includes(o.id)}
              count={facets.levels[o.id]}
              onClick={() => onChange(toggleFilter(value, "levels", o.id))}
            >
              {o.label}
            </Toggle>
          ))}
        </Group>

        {/* The not-yet-eligible rows stay in the list by default — a younger
              student should be able to see what they are aiming at. This is the
              switch for the other mood: only what I can act on today. */}
        <Group
          label="Entry"
          note="Off, the list also shows what you are not old enough for yet — on purpose, so you can see what you are aiming at."
        >
          <Toggle
            on={value.openOnly}
            count={facets.openNow}
            title="Hides the ones you are not old enough or far enough through school for yet."
            onClick={() => onChange({ ...value, openOnly: !value.openOnly })}
          >
            Only what I can enter now
          </Toggle>
        </Group>

        {/* The two narrowings that used to be invisible. They ran inside
            matching, before this panel saw a row, so a student was shown a
            smaller catalog than we have with no way to ask why and no route to
            the rest — the one control that looked like the way there said "Show
            everything we track for you", where "everything" was false.

            Both are ON by default, which is the one place in this panel where a
            switched-on toggle is the neutral state: the honest default is still
            the student's own list. Turning one off widens, and the count says
            by how much. */}
        <Group
          label="Matched to you"
          note="On, you see your own list. Off, the ones in other subjects or other countries come back — the count says how many."
        >
          {MATCH_OPTIONS.map((o) => (
            <Toggle
              key={o.id}
              on={value.matched.includes(o.id)}
              count={facets.matched[o.id]}
              title={
                o.id === "field"
                  ? "Off, the list also shows opportunities outside the fields you picked."
                  : "Off, the list also shows local opportunities run in other countries."
              }
              onClick={() =>
                onChange({
                  ...value,
                  // Rebuilt in MATCH_OPTIONS order rather than pushed, so this
                  // set-shaped field keeps one canonical order and two equal
                  // states never compare unequal.
                  matched: MATCH_OPTIONS.map((x) => x.id).filter((id) =>
                    id === o.id
                      ? !value.matched.includes(o.id)
                      : value.matched.includes(id),
                  ),
                })
              }
            >
              {o.label}
            </Toggle>
          ))}
        </Group>
      </div>
    </div>
  );
}

function Group({
  label,
  note,
  children,
}: {
  label: string;
  /**
   * The rule this group applies, always on screen.
   *
   * Not a tooltip. `title` survives only where a pointer does, and this panel
   * is opened on a phone more often than anywhere else — so a hint delivered
   * that way is a hint most students never receive. It stays on the individual
   * chips for the per-option detail, but anything a person needs in order to
   * trust the result belongs in the layout.
   */
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 py-2.5 sm:flex-row sm:items-baseline sm:gap-3">
      <p className="w-16 shrink-0 pt-1 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-ink-faint">
        {label}
      </p>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap gap-1.5">{children}</div>
        {note && (
          <p className="mt-1.5 max-w-[60ch] text-xs leading-relaxed text-ink-faint">
            {note}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * One criterion, with how many rows it would leave.
 *
 * A zero-count option is dimmed but stays clickable: hiding it would make the
 * row of chips reflow on every keystroke, and a student who taps one gets the
 * empty state with a Clear button, which explains itself.
 */
function Toggle({
  on,
  count,
  title,
  onClick,
  children,
}: {
  on: boolean;
  count: number;
  title?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      title={title}
      onClick={onClick}
      className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors focus-visible:focus-ring ${
        on
          ? "border-accent bg-accent-soft text-accent-ink"
          : "border-line bg-card text-ink-soft hover:border-ink/30 hover:text-ink"
      } ${count === 0 && !on ? "opacity-50" : ""}`}
    >
      {children}
      <span
        data-num
        className={`tabular-nums ${on ? "text-accent-ink/70" : "text-ink-faint"}`}
      >
        {count}
      </span>
    </button>
  );
}

function SearchIcon() {
  return (
    <svg
      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 5h18l-7 8v6l-4 2v-8Z" />
    </svg>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
