// spend-ledger.ts — the second tier of the spend cap (PRD §5).
// The contract enforces the per-bounty cap; only the server can know how much the arbiter
// has ALREADY auto-released, so the per-day cap lives here.
//
// Window = rolling 24h, not a calendar day: no timezone/midnight-reset edge to exploit.
// FAILS CLOSED — if the ledger can't be read, headroom is 0, so every T1 downgrades to a
// human escalation. An arbiter that can't count its own spending doesn't get to spend.

import { getSupabaseClient } from "../agent";
import type { SpendCaps } from "./tiers";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface DaySpend {
  spentUsdc: number;
  remainingUsdc: number;
  capUsdc: number;
  /** True when the figure is a fail-closed fallback rather than a real reading. */
  degraded: boolean;
}

function dayCapUsdc(): number {
  return Number(process.env.PER_DAY_CAP_USDC ?? 150);
}

/** Sum of USDC the arbiter auto-released in the last 24h (verdicts that reached the chain). */
export async function getDaySpend(now: Date = new Date()): Promise<DaySpend> {
  const cap = dayCapUsdc();
  const since = new Date(now.getTime() - DAY_MS).toISOString();

  try {
    const { data, error } = await getSupabaseClient()
      .from("verdicts")
      .select("release_tx, created_at, submissions!inner(bounties!inner(amount_usdc))")
      .not("release_tx", "is", null)
      .gte("created_at", since);

    if (error) throw new Error(error.message);

    const spent = (data ?? []).reduce((acc, row) => acc + amountOf(row), 0);
    return { spentUsdc: spent, remainingUsdc: Math.max(0, cap - spent), capUsdc: cap, degraded: false };
  } catch {
    // Unreadable ledger → assume the cap is fully consumed (no autonomous release today).
    return { spentUsdc: cap, remainingUsdc: 0, capUsdc: cap, degraded: true };
  }
}

/** Supabase returns the embedded relations as objects or single-element arrays depending on the join. */
function amountOf(row: unknown): number {
  const sub = first((row as { submissions?: unknown }).submissions);
  const bounty = first((sub as { bounties?: unknown } | undefined)?.bounties);
  const amount = (bounty as { amount_usdc?: number | string } | undefined)?.amount_usdc;
  return Number(amount ?? 0);
}

function first(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : value;
}

/** Live caps for the judging pipeline: per-bounty from env, per-day from the ledger. */
export async function liveCaps(now: Date = new Date()): Promise<SpendCaps & { daySpend: DaySpend }> {
  const daySpend = await getDaySpend(now);
  return {
    perBountyUsdc: Number(process.env.PER_BOUNTY_CAP_USDC ?? 50),
    perDayRemainingUsdc: daySpend.remainingUsdc,
    daySpend,
  };
}
