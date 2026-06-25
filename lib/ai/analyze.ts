import Anthropic from "@anthropic-ai/sdk";
import { STATIC_SYSTEM_PROMPT } from "@/lib/ai/prompt";
import { modelAnalysisSchema, type Analysis } from "@/lib/ai/schema";
import { assembleAnalysis } from "@/lib/ai/assemble";
import { LIMITS } from "@/lib/limits";
import type { StudentProfileInput } from "@/lib/types";

const MODEL = "claude-haiku-4-5";
// Output cap. This is a CEILING, not a target — the model stops at end_turn when
// the JSON is complete, so a higher cap doesn't slow or cost more on normal
// profiles (you pay for tokens generated, not the cap). It only prevents a rich
// profile (7 factors with reasoning + up to 12 schools + recommendations + gap +
// timeline) from being truncated mid-JSON, which surfaced as the "very long
// analysis" error. 16000 is well under Haiku 4.5's 64K output limit and the call
// is streamed, so large generations don't hit an SDK/HTTP timeout.
const MAX_TOKENS = 16000;

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
 * Runs the AI analysis: cached static system block + the (size-bounded) profile
 * as the only fresh content.
 *
 * Robustness, by design:
 *  - the response is STREAMED, so long generations don't hit the platform's
 *    response-buffering/idle timeout (the cause of the non-JSON "An error…"
 *    page the client used to choke on);
 *  - the SDK retries 429/5xx/timeouts with exponential backoff, so a burst of
 *    concurrent requests degrades gracefully instead of failing hard;
 *  - the model returns only qualitative JSON; the overall score and benchmarks
 *    are computed in code (assembleAnalysis);
 *  - on a parse failure we retry once; if the reply was cut off by the token
 *    cap we fail fast with an actionable message (a same-budget retry can't fix
 *    truncation).
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
  // maxRetries: one graceful backoff on 429/529/5xx. Kept low on purpose — this
  // call runs inside a bounded serverless function, and stacking 3 exponential
  // backoffs could push past the function's time budget and turn a transient
  // "service busy" into a hard 504 timeout. One retry, then fail fast with the
  // actionable "service is busy" message.
  const anthropic = new Anthropic({ apiKey, maxRetries: 1 });

  // Send the model a compact, SIZE-BOUNDED view of the profile.
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
      // Stream and await the assembled final message — keeps the connection
      // alive for long generations instead of buffering a single response.
      message = await anthropic.messages
        .stream({
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
        })
        .finalMessage();
    } catch (e) {
      // Surface API errors cleanly; the route maps these to a user message.
      throw mapApiError(e);
    }

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    try {
      const parsed = modelAnalysisSchema.parse(extractJson(text));
      return {
        analysis: assembleAnalysis(parsed, profile),
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
      if (message.stop_reason === "max_tokens") {
        // The reply was cut off mid-JSON; retrying with the same budget would
        // cut off again. Tell the user how to shrink the request.
        throw new AnalyzeError(
          "Your profile produced a very long analysis. Try trimming activity details or shortening your target-school list, then run it again.",
          e
        );
      }
      // otherwise loop and retry once
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

/** Clamp a string to a max length (after trimming); preserves undefined. */
function clamp(s: string | undefined | null, max: number): string | undefined {
  if (s == null) return undefined;
  const t = s.trim();
  return t.length > max ? t.slice(0, max) : t;
}

/**
 * Compact, stable, SIZE-BOUNDED view of the profile for the model. This is the
 * last line of defense: even if an oversized profile somehow reached here, it
 * can never blow up the request (drops empty fields, caps counts and lengths).
 */
function buildModelInput(p: StudentProfileInput) {
  return {
    country: clamp(p.country, LIMITS.shortText),
    citizenship: clamp(p.citizenship, LIMITS.shortText),
    // Country-first signals: where they're applying and what they'll study.
    // These tell the model how to frame the scorecard and whether to produce
    // US school likelihoods (only when target_schools is non-empty).
    destinations: p.destinations,
    faculties: p.faculties,
    intended_major: clamp(p.intended_major, LIMITS.shortText) || undefined,
    curriculum: p.curriculum,
    grades: { ...p.grades, raw: clamp(p.grades?.raw, LIMITS.grades) ?? "" },
    tests: { ...p.tests, subjects: clamp(p.tests?.subjects, LIMITS.subjects) },
    // Common App activities — structured so the model can weigh role, scale,
    // commitment (hours x weeks) and continuation.
    activities: p.activities
      .filter((a) => a.position?.trim())
      .slice(0, LIMITS.activities)
      .map((a) => ({
        type: a.type || undefined,
        position: clamp(a.position, LIMITS.activityPosition),
        organization: clamp(a.organization, LIMITS.activityOrganization),
        description: clamp(a.description, LIMITS.activityDescription),
        grades: a.grades?.length ? a.grades : undefined,
        timing: a.timing?.length ? a.timing : undefined,
        hours_per_week: a.hours_per_week || undefined,
        weeks_per_year: a.weeks_per_year || undefined,
        continue_in_college: a.continue_in_college || undefined,
      })),
    // Common App honors — title + grade levels + level of recognition; feeds
    // the "awards" factor (school -> regional -> national -> international).
    honors: (p.honors ?? [])
      .filter((h) => h.title?.trim())
      .slice(0, LIMITS.honors)
      .map((h) => ({
        title: clamp(h.title, LIMITS.honorTitle),
        grades: h.grades?.length ? h.grades : undefined,
        levels: h.levels?.length ? h.levels : undefined,
      })),
    target_schools: p.target_schools.slice(0, LIMITS.targetSchools),
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
