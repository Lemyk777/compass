import type { Tier, Confidence } from "@/lib/ai/schema";

// Single source of truth for the semantic tier scale (§9). Used identically
// everywhere — gauges, chips, comparison bars.
export const TIER_META: Record<
  Tier,
  { label: string; color: string; soft: string; text: string }
> = {
  reach: { label: "Reach", color: "var(--reach)", soft: "var(--reach-soft, #FBE7E2)", text: "#A93B2A" },
  target: { label: "Target", color: "var(--target)", soft: "var(--target-soft, #FAEEDB)", text: "#8A5410" },
  likely: { label: "Likely", color: "var(--likely)", soft: "var(--likely-soft, #E1F1E9)", text: "#2C6B4D" },
};

export const TIER_HEX: Record<Tier, string> = {
  reach: "#E0664F",
  target: "#D98A2B",
  likely: "#3F9B6E",
};

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  low: "Low confidence",
  medium: "Medium confidence",
  high: "High confidence",
};

export const TIER_ORDER: Record<Tier, number> = {
  likely: 0,
  target: 1,
  reach: 2,
};

export const ACCENT = "#2F6FED";
