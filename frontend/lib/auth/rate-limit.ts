// =============================================================================
// rate-limit.ts — a sliding window over the two routes that cost money per call.
//
// Deliberately NOT a general-purpose limiter. It guards exactly the calls that spend
// Anthropic tokens or gas, keyed by the signed-in address (not IP — the address is the thing
// we can actually hold accountable, and it is already authenticated by the time we get here).
//
// Fails OPEN on a database error. That is the opposite of the money path's fail-closed rule,
// and it is deliberate: a limiter outage must not lock every honest user out of a product
// whose worst case here is a bigger-than-usual LLM bill. The money paths have their own
// fail-closed caps (per-bounty in the contract, per-day in spend-ledger.ts).
// =============================================================================

import "server-only";
import { getSupabaseClient } from "../agent";

export interface Limit {
  /** Max calls allowed inside the window. */
  max: number;
  /** Window length in minutes. */
  windowMins: number;
}

/** Rubric generation: one LLM call each. */
export const LIMIT_CREATE_BOUNTY: Limit = { max: 10, windowMins: 60 };
/** Grading: one LLM call each, and potentially an on-chain release. */
export const LIMIT_JUDGE: Limit = { max: 20, windowMins: 60 };

/**
 * Record this call and report whether the caller is over their limit.
 * Returns a ready-to-return 429 Response when over, otherwise null.
 */
export async function enforceRateLimit(
  route: string,
  address: string,
  limit: Limit,
): Promise<Response | null> {
  const db = getSupabaseClient();
  const bucket = `${route}:${address.toLowerCase()}`;
  const cutoff = new Date(Date.now() - limit.windowMins * 60_000).toISOString();

  try {
    const { count, error } = await db
      .from("rate_limits")
      .select("id", { count: "exact", head: true })
      .eq("bucket", bucket)
      .gte("created_at", cutoff);
    if (error) throw new Error(error.message);

    if ((count ?? 0) >= limit.max) {
      console.warn(`[rate-limit] ${bucket} over limit (${count}/${limit.max} per ${limit.windowMins}m)`);
      return Response.json(
        {
          error: `Bạn đã gọi ${route} quá ${limit.max} lần trong ${limit.windowMins} phút. Thử lại sau.`,
        },
        { status: 429 },
      );
    }

    await db.from("rate_limits").insert({ bucket });
    return null;
  } catch (err) {
    console.error("[rate-limit] failing open:", err);
    return null;
  }
}
