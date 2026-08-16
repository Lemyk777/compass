import type { Tier, Confidence } from "@/lib/ai/schema";

// Single source of truth for the semantic tier LABELS and for the CSS custom
// properties that carry the colours. The values themselves live in
// app/globals.css and change with the theme, so nothing here may be a literal:
// a hex frozen in this file would stay light-mode red on a dark page.
//
// `text` used to be the one place that knew coloured text needed a darker
// value than the fill. That knowledge is a real token now (`--reach-ink` and
// friends, `text-reach-ink` in Tailwind), so this points at it rather than
// holding a copy.
export const TIER_META: Record<
  Tier,
  { label: string; color: string; soft: string; text: string }
> = {
  reach: {
    label: "Reach",
    color: "rgb(var(--reach))",
    soft: "rgb(var(--reach-soft))",
    text: "rgb(var(--reach-ink))",
  },
  target: {
    label: "Target",
    color: "rgb(var(--target))",
    soft: "rgb(var(--target-soft))",
    text: "rgb(var(--target-ink))",
  },
  likely: {
    label: "Likely",
    color: "rgb(var(--likely))",
    soft: "rgb(var(--likely-soft))",
    text: "rgb(var(--likely-ink))",
  },
};

/** Fills for Recharts `<Cell>`, which needs a colour string, not a class. */
export const TIER_HEX: Record<Tier, string> = {
  reach: "rgb(var(--reach))",
  target: "rgb(var(--target))",
  likely: "rgb(var(--likely))",
};

/** Chart fill for the brand accent. A variable, so it lightens in dark mode. */
export const ACCENT = "rgb(var(--accent))";
