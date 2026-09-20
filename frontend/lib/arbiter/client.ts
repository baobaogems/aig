// client.ts — thin Anthropic wrapper. Low temperature, returns parsed JSON + token usage.
// One model, versioned prompt (PRD §9). No streaming here — the arbiter needs the whole
// verdict object before it decides anything.

import Anthropic from "@anthropic-ai/sdk";

export const MODEL = process.env.ARBITER_MODEL ?? "claude-opus-4-8";
export const PROMPT_VERSION = process.env.PROMPT_VERSION ?? "v1.0";

/** The one env var this module reads. Named once so diagnostics can quote it accurately. */
export const API_KEY_ENV = "ANTHROPIC_API_KEY";

/**
 * A description of the key that is safe to put in a log or hand to a user.
 *
 * Never returns the key. The prefix is capped at 10 characters — enough to tell
 * `sk-ant-api03` from a truncated value or a pasted placeholder, far short of anything
 * usable. Length is the other half: a key cut off by a stray quote or a trailing space in
 * .env looks right at the front and is the wrong length.
 */
export function describeApiKey(): { envName: string; keyPresent: boolean; keyLen: number; keyPrefix: string } {
  const key = process.env[API_KEY_ENV];
  return {
    envName: API_KEY_ENV,
    keyPresent: Boolean(key),
    keyLen: key?.length ?? 0,
    keyPrefix: key ? key.slice(0, 10) : "",
  };
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  const apiKey = process.env[API_KEY_ENV];
  if (!apiKey) {
    console.error("[anthropic] thiếu khoá:", describeApiKey());
    throw new Error(
      `Chưa gắn khoá Anthropic trên môi trường này (${API_KEY_ENV}). ` +
        `Máy của bạn: đặt vào frontend/.env.local rồi khởi động lại npm run dev. ` +
        `Trên Vercel: thêm biến rồi Redeploy — đổi biến thôi chưa đủ.`,
    );
  }
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
  let resp;
  try {
    resp = await getClient().messages.create({
      model: MODEL,
      max_tokens: 2048,
      system,
      messages: [{ role: "user", content: user }],
    });
  } catch (err) {
    throw translateTransportError(err);
  }

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

/**
 * Turn an SDK failure into something a person can act on.
 *
 * The raw Anthropic body used to reach the UI verbatim — a poster clicking "Tạo việc" got
 * `401 {"type":"error","error":{"type":"authentication_error",...}}`, which says nothing
 * about WHICH key on WHICH environment. This keeps the diagnosis in the server log (where
 * the prefix and length are safe and useful) and gives the user a sentence with a next step.
 *
 * Only the cases worth distinguishing are translated; anything else passes through unchanged
 * rather than being flattened into a vague message.
 */
function translateTransportError(err: unknown): Error {
  const status = (err as { status?: number })?.status;

  if (status === 401 || status === 403) {
    // Prefix + length, never the key. This is the line that tells you whether the running
    // process picked up the key you think it did — the usual answer when local works and a
    // deployment does not is that they are simply different keys.
    console.error("[anthropic] bị từ chối xác thực:", { status, ...describeApiKey() });
    return new Error(
      `Khoá Anthropic không hợp lệ hoặc chưa gắn trên môi trường này (${API_KEY_ENV}). ` +
        `Kiểm tra đúng nơi đang chạy: máy của bạn đọc frontend/.env.local, bản deploy đọc biến môi trường của nó — ` +
        `hai nơi có thể đang giữ hai khoá khác nhau. Xem log máy chủ để biết độ dài và 10 ký tự đầu của khoá đang dùng.`,
    );
  }

  if (status === 429) {
    console.error("[anthropic] quá hạn mức:", { status, ...describeApiKey() });
    return new Error("Anthropic đang giới hạn tần suất (429). Thử lại sau ít phút.");
  }

  if (typeof status === "number" && status >= 500) {
    console.error("[anthropic] lỗi phía Anthropic:", { status });
    return new Error(`Anthropic đang lỗi (${status}). Đây không phải lỗi của bounty — thử lại sau.`);
  }

  return err instanceof Error ? err : new Error(String(err));
}
