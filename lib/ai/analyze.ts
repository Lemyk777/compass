import Anthropic from "@anthropic-ai/sdk";
import { STATIC_SYSTEM_PROMPT } from "@/lib/ai/prompt";
import { analysisSchema, sanitizeAnalysis, type Analysis } from "@/lib/ai/schema";
import type { StudentProfileInput } from "@/lib/types";

const MODEL = "claude-haiku-4-5";
// Cost-safety cap, but large enough for the full report (7 factors + up to ~12
// schools + recommendations + benchmarks + gap analysis + timeline). 2500 was
// too small and truncated the JSON mid-array.
const MAX_TOKENS = 6000;

export type AnalyzeResult = {
  analysis: Analysis;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
  };
};

/**
 * Runs the AI analysis: cached static system block + the variable profile as
 * the only fresh content. Validates the JSON against the zod schema; on parse
 * failure, retries once with a stricter reminder, then throws a clean error.
 */
export async function analyzeProfile(
  profile: StudentProfileInput
): Promise<AnalyzeResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new AnalyzeError(
      "AI is not configured yet. Add ANTHROPIC_API_KEY to enable analysis."
    );
  }
  const anthropic = new Anthropic({ apiKey });

  // Send the model a compact, model-friendly view of the profile.
  const userPayload = JSON.stringify(buildModelInput(profile));

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userPayload },
  ];

  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt === 1) {
      // Stricter reminder on retry.
      messages.push({
        role: "assistant",
        content: "I will return only valid JSON.",
      });
      messages.push({
        role: "user",
        content:
          "Your previous reply was not valid JSON for the schema. Return ONLY the JSON object, no prose, no markdown fences, matching the schema exactly.",
      });
    }

    let message: Anthropic.Message;
    try {
      message = await anthropic.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: [
          {
            type: "text",
            text: STATIC_SYSTEM_PROMPT,
            // Prompt caching: the static block is ~90% cheaper on cache hits.
            cache_control: { type: "ephemeral" },
          },
        ],
        messages,
      });
    } catch (e) {
      // Surface API errors cleanly; the route maps these to a user message.
      throw mapApiError(e);
    }

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    try {
      const parsed = analysisSchema.parse(extractJson(text));
      return {
        analysis: sanitizeAnalysis(parsed),
        usage: {
          input_tokens: message.usage.input_tokens,
          output_tokens: message.usage.output_tokens,
          cache_read_input_tokens: message.usage.cache_read_input_tokens ?? 0,
          cache_creation_input_tokens:
            message.usage.cache_creation_input_tokens ?? 0,
        },
      };
    } catch (e) {
      lastErr = e;
      // loop and retry once
    }
  }

  throw new AnalyzeError(
    "The analysis came back in an unexpected format. Please try again.",
    lastErr
  );
}

/** Trim incidental markdown fences and isolate the JSON object. */
function extractJson(text: string): unknown {
  let t = text.trim();
  // Strip ```json ... ``` fences if the model added them.
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  // Isolate the outermost object.
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) t = t.slice(start, end + 1);
  return JSON.parse(t);
}

/** Compact, stable view of the profile for the model (drops empty fields). */
function buildModelInput(p: StudentProfileInput) {
  return {
    country: p.country,
    citizenship: p.citizenship,
    intended_major: p.intended_major,
    curriculum: p.curriculum,
    grades: p.grades,
    tests: p.tests,
    activities: p.activities
      .filter((a) => a.title.trim())
      .map((a) => (a.detail ? `${a.title} — ${a.detail}` : a.title)),
    target_schools: p.target_schools,
    needs_aid: p.needs_aid,
  };
}

export class AnalyzeError extends Error {
  cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "AnalyzeError";
    this.cause = cause;
  }
}

function mapApiError(e: unknown): AnalyzeError {
  if (e instanceof Anthropic.AuthenticationError) {
    return new AnalyzeError("AI authentication failed. Check ANTHROPIC_API_KEY.", e);
  }
  if (e instanceof Anthropic.RateLimitError) {
    return new AnalyzeError(
      "The analysis service is busy right now. Please try again in a moment.",
      e
    );
  }
  if (e instanceof Anthropic.APIError) {
    return new AnalyzeError("The analysis service had an error. Please retry.", e);
  }
  return new AnalyzeError("Could not reach the analysis service.", e);
}
