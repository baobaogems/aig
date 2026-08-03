// =============================================================================
// rpc-retry.ts — backoff for the Arc public RPC.
//
// Measured 03/08/2026: rpc.testnet.arc.network intermittently answers HTTP 200 with
// `{"error": "request limit reached"}` — roughly 1 call in 4, unrelated to call spacing.
// viem does NOT retry that (no 429, no -32005 code), so an unwrapped release() would fail
// at random. This module is the difference between a demo that settles and one that
// coin-flips in front of judges.
// =============================================================================

const TRANSIENT_PATTERNS = [
  "request limit reached",
  "rate limit",
  "too many requests",
  "429",
  "timeout",
  "socket hang up",
  "ECONNRESET",
  "fetch failed",
  "service unavailable",
];

export function isTransientRpcError(err: unknown): boolean {
  const msg = err instanceof Error ? `${err.message} ${(err as { details?: string }).details ?? ""}` : String(err);
  const lower = msg.toLowerCase();
  return TRANSIENT_PATTERNS.some((p) => lower.includes(p.toLowerCase()));
}

export interface RetryOptions {
  attempts?: number;
  baseDelayMs?: number;
  label?: string;
}

/**
 * Retry a transient-failing RPC call with exponential backoff.
 *
 * Safe for writes in THIS codebase because the contract is idempotent-guarded: a duplicate
 * createBounty reverts with BountyExists and a duplicate release reverts with AlreadySettled,
 * so a retry can never double-pay a worker. Do not reuse this around non-idempotent calls.
 */
export async function withRpcRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const attempts = opts.attempts ?? 4;
  const base = opts.baseDelayMs ?? 400;

  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isTransientRpcError(err) || i === attempts - 1) throw err;
      const delay = base * 2 ** i;
      if (opts.label) console.warn(`[rpc-retry] ${opts.label}: transient RPC error, retry ${i + 1}/${attempts - 1} in ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}
