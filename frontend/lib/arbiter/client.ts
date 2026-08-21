// client.ts — thin Anthropic wrapper. Low temperature, returns parsed JSON + token usage.
// One model, versioned prompt (PRD §9). No streaming here — the arbiter needs the whole
// verdict object before it decides anything.

import Anthropic from "@anthropic-ai/sdk";

export const MODEL = process.env.ARBITER_MODEL ?? "claude-opus-4-8";
export const PROMPT_VERSION = process.env.PROMPT_VERSION ?? "v1.0";

let client: Anthropic | null = null;
function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set (put it in frontend/.env.local)");
  if (!client) client = new Anthropic({ apiKey });
  return client;
}

export interface LlmJsonResult {
  data: unknown; // parsed JSON (may still fail domain validation downstream)
  usage: { input_tokens: number; output_tokens: number };
  /**
   * Set when the reply could not be parsed as JSON at all (prose-only answer, truncated
   * output, syntax error). `data` is then `undefined`. This is NOT thrown: off-schema is a
   * verdict outcome, not a crash — the caller degrades it to REFUSE and still bills the
   * tokens that were actually spent.
   */
  parseError?: string;
}

/**
 * Call the model and parse its reply as JSON. The model is told to emit ONLY JSON, but we
 * still defensively strip code fences and extract the outermost {...} — belt and suspenders.
 * Throws only on TRANSPORT failure (network, auth, rate limit). A reply that is not valid
 * JSON comes back as `parseError`, so callers can turn it into a REFUSE verdict.
 */
export async function callJson(system: string, user: string): Promise<LlmJsonResult> {
  // NOTE: no temperature param — deprecated/rejected on Opus 4.8 (API 400s if sent).
  // Determinism for the money gate comes from tiers.ts + zod, not sampling params.
  const resp = await getClient().messages.create({
    model: MODEL,
    max_tokens: 2048,
    system,
    messages: [{ role: "user", content: user }],
  });

  const text = resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  const usage = { input_tokens: resp.usage.input_tokens, output_tokens: resp.usage.output_tokens };

  const slice = extractJson(text);
  if (slice === null) return { data: undefined, usage, parseError: "no JSON object in model reply" };

  try {
    return { data: JSON.parse(slice), usage };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: undefined, usage, parseError: "malformed JSON in model reply: " + message };
  }
}

/**
 * Pull the outermost JSON object out of a model reply (handles ```json fences / stray prose).
 * Returns null when there is no object at all — the caller decides what that means.
 */
function extractJson(text: string): string | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  return body.slice(start, end + 1);
}
