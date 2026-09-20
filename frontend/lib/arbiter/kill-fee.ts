// =============================================================================
// kill-fee.ts — what a rejection costs. Pure, deterministic, no I/O.
//
// Sibling of tiers.ts, and the same division of labour: the model proposes a score, a plain
// function decides what happens to the money. tiers.ts answers "who decides"; this answers
// "what does overruling the default cost".
//
// WHY A PRICE AND NOT A PENALTY
// -----------------------------
// There is no court here. Nobody rules on whether a rejection was honest, so nothing can
// punish a dishonest one specifically. The only lever left is to put a price on EVERY
// rejection, and let the machine's own score set that price.
//
// The ladder does four jobs with one number:
//   1. partial payment exists at all — "this is half-decent" used to be unrepresentable
//   2. rejecting costs something, without anyone having to adjudicate
//   3. junk spam earns nothing: below the fail line the fee is zero, so blasting cheap
//      submissions at every open bounty has no payoff
//   4. a sloppy brief produces poor work and then costs the poster a fee, which puts the
//      price of a lazy rubric on the person who wrote it
// =============================================================================

import { TIER_THRESHOLDS } from "./tiers";
import type { Tier } from "./tiers";

/** Basis points, matching ArbiterEscrow.BPS_DENOMINATOR. */
export const BPS_DENOMINATOR = 10_000;

/**
 * Objecting to work the arbiter scored highly costs the poster half the escrow.
 *
 * Deliberately steep. A T1 verdict means high confidence AND a clear pass, so overriding it
 * should hurt — but not be impossible, because the machine is sometimes wrong and a poster
 * with no recourse at all is how the product loses the people paying for it.
 */
export const T1_OBJECTION_BPS = 5_000;

/** Ceiling of the T2 ladder: the most a rejected-but-plausible deliverable can earn. */
export const T2_MAX_BPS = 3_000;

export interface KillFeeInput {
  /** Total score from the verdict, 0–100. */
  totalScore: number;
  tier: Tier;
}

/**
 * The worker's share, in basis points, when the poster refuses to pay.
 *
 *   T3 (score < 40, or unjudgeable)  → 0
 *   T2 (40–69)                       → 0 … 3000, straight line
 *   T1 (poster objected in window)   → 5000
 *
 * Returns a value that is always a valid `workerBps` for `settle()`: an integer in
 * [0, 10000]. Garbage input clamps rather than throwing — this sits on the money path, and
 * a NaN arriving from a malformed verdict must not become an exception mid-settlement.
 */
export function killFeeBps({ totalScore, tier }: KillFeeInput): number {
  if (tier === "T1") return T1_OBJECTION_BPS;
  if (tier === "T3") return 0;

  const { failScore, autoReleaseScore } = TIER_THRESHOLDS;
  const score = Number.isFinite(totalScore) ? totalScore : 0;
  if (score < failScore) return 0;

  // The band is [40, 69]: 70 and above is T1 territory, so the ladder's top rung is the last
  // score that is still T2. Using autoReleaseScore here (not a literal 69) keeps this in step
  // with tiers.ts if the thresholds are ever retuned.
  const topOfBand = autoReleaseScore - 1;
  if (score >= topOfBand) return T2_MAX_BPS;

  const ratio = (score - failScore) / (topOfBand - failScore);
  return Math.round(ratio * T2_MAX_BPS);
}

/** USDC the worker receives at this split. Mirrors the contract's integer arithmetic. */
export function workerAmountUsdc(amountUsdc: number, bps: number): number {
  const micros = Math.floor((Math.round(amountUsdc * 1e6) * bps) / BPS_DENOMINATOR);
  return micros / 1e6;
}

/** USDC returned to the poster. Computed as the remainder, exactly as `settle()` does it,
 *  so what the UI promises can never be a rounding step away from what the chain pays. */
export function posterAmountUsdc(amountUsdc: number, bps: number): number {
  return Math.round(amountUsdc * 1e6 - workerAmountUsdc(amountUsdc, bps) * 1e6) / 1e6;
}
