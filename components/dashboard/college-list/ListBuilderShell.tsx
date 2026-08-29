"use client";

import type { ReactNode } from "react";
import {
  AnalyzingOverlay,
  PickCard,
  SearchBar,
  StickyActionBar,
  type PickCardContent,
} from "@/components/dashboard/college-list/parts";
import type { ListSelection } from "@/components/dashboard/college-list/useListBuilder";

/**
 * The full builder layout, identical across countries: a sticky search bar,
 * optional country-specific controls, the grid of pick cards, and the sticky
 * action bar (plus the analyzing overlay). A builder only supplies its data
 * (`card`/`idOf`) and its extra `controls`; the selection wiring is handled here.
 */
export function ListBuilderShell<T>({
  sel,
  keyOf,
  card,
  placeholder,
  cap,
  countNoun,
  emptyMessage,
  controls,
  busy,
  error,
  onCta,
}: {
  sel: ListSelection<T>;
  /** React key for each item (defaults to the selection id). */
  keyOf?: (item: T) => string;
  /** The display content of an item's card. */
  card: (item: T) => PickCardContent;
  placeholder: string;
  cap: number;
  /** Noun for the "{n} schools selected" count line. */
  countNoun: "school" | "program";
  /** Message shown when nothing is selected yet. */
  emptyMessage: string;
  /** Country-specific controls rendered between the search bar and the grid. */
  controls?: ReactNode;
  busy: boolean;
  error: string | null;
  onCta: () => void;
}) {
  const key = keyOf ?? sel.idOf;
  const n = sel.selected.length;

  return (
    <div className="space-y-6">
      <SearchBar
        query={sel.query}
        onQuery={sel.setQuery}
        placeholder={placeholder}
        count={n}
        cap={cap}
      />

      {controls}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {sel.filtered.map((item) => {
          const id = sel.idOf(item);
          const on = sel.selected.includes(id);
          return (
            <PickCard
              key={key(item)}
              on={on}
              disabled={!on && sel.atCap}
              onClick={() => sel.toggle(id)}
              {...card(item)}
            />
          );
        })}
      </div>

      <StickyActionBar
        error={error}
        message={
          n === 0
            ? emptyMessage
            : `${n} ${n === 1 ? countNoun : `${countNoun}s`} selected`
        }
        ctaLabel="See my admission odds"
        ctaDisabled={n === 0 || busy}
        onCta={onCta}
      />
      {busy && <AnalyzingOverlay />}
    </div>
  );
}
