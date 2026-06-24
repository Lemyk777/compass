// Per-analysis API cost, in USD. Single source of truth for the admin dashboard.
//
// The analysis is one claude-haiku-4-5 call (see lib/ai/analyze.ts). We bill on
// the four token buckets the API reports. The hard spend cap is set in the
// Anthropic console — this only estimates/reports, it doesn't enforce.

// Haiku 4.5 list price, USD per million tokens. Keep in sync with MODEL in
// lib/ai/analyze.ts if the model ever changes.
export const HAIKU_PRICE = {
  input: 1.0, // uncached input
  output: 5.0,
  cacheWrite: 1.25, // 5-min ephemeral cache write = 1.25× input
  cacheRead: 0.1, // cache read = 0.1× input
} as const;

export type AnalysisUsage = {
  input_tokens?: number;
  output_tokens?: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
};

/** Real USD cost of one analysis from its recorded token usage. */
export function analysisCostUSD(u: AnalysisUsage): number {
  return (
    ((u.input_tokens ?? 0) * HAIKU_PRICE.input +
      (u.output_tokens ?? 0) * HAIKU_PRICE.output +
      (u.cache_read_input_tokens ?? 0) * HAIKU_PRICE.cacheRead +
      (u.cache_creation_input_tokens ?? 0) * HAIKU_PRICE.cacheWrite) /
    1_000_000
  );
}

/** True when a row carries enough usage data to cost it for real. */
export function hasUsage(u: unknown): u is AnalysisUsage {
  return (
    !!u && typeof (u as AnalysisUsage).output_tokens === "number"
  );
}

/**
 * Fallback for analyses stored before usage was recorded (rows predating
 * migration 0007). Cached system prompt (~4.5k tokens) + small profile +
 * ~1.8k output on Haiku 4.5 ≈ this.
 */
export const EST_COST_PER_ANALYSIS = 0.012;
