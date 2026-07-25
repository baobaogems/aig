// tiers.ts — confidence tiers + spend-cap gating (PRD §5). Pure, deterministic, no I/O.
// This is the safety spine: the LLM proposes scores/confidence; THIS decides what happens
// to the money. The calibration invariant ("no clear-fail in T1") is enforced by these numbers.

import type { Decision } from "./verdict-schema";

export const TIER_THRESHOLDS = {
  // T1 auto-release requires BOTH high confidence AND a clear pass score.
  autoReleaseConfidence: 85,
  autoReleaseScore: 70,
  // T3 floor: below either → not release; clear fail if score < 40.
  refuseConfidence: 50,
  failScore: 40,
} as const;

export interface TierInput {
  totalScore: number; // 0–100
  confidence: number; // 0–100
  outOfScope: boolean; // deliverable unreadable / outside rubric
}

export type Tier = "T1" | "T2" | "T3";

export interface TierResult {
  tier: Tier;
  decision: Decision;
}

/** Map (score, confidence, scope) → tier + decision, per PRD §5 table. */
export function decideTier(input: TierInput): TierResult {
  const { totalScore, confidence, outOfScope } = input;
  const t = TIER_THRESHOLDS;

  // T3 — refuse/fail. Out-of-scope or too-low confidence/score.
  if (outOfScope || confidence < t.refuseConfidence || totalScore < t.failScore) {
    // Clear FAIL (readable, on-topic, just not good enough) vs REFUSE (can't/shouldn't judge).
    const decision: Decision = outOfScope ? "REFUSE" : totalScore < t.failScore ? "FAIL" : "REFUSE";
    return { tier: "T3", decision };
  }

  // T1 — autonomous release. High confidence AND clear pass.
  if (confidence >= t.autoReleaseConfidence && totalScore >= t.autoReleaseScore) {
    return { tier: "T1", decision: "RELEASE" };
  }

  // T2 — escalate to poster (the whole 40–69 score band, or 50–84 confidence).
  return { tier: "T2", decision: "ESCALATE" };
}

export interface SpendCaps {
  perBountyUsdc: number; // hard cap (also enforced in contract)
  perDayRemainingUsdc: number; // server-tracked headroom for T1 auto-release today
}

/**
 * A T1 auto-release is only allowed if it fits BOTH caps. Over cap → downgrade to T2
 * (escalate to a human) rather than block outright. Non-T1 tiers pass through unchanged.
 */
export function applySpendCap(result: TierResult, amountUsdc: number, caps: SpendCaps): TierResult {
  if (result.tier !== "T1") return result;
  const overBounty = amountUsdc > caps.perBountyUsdc;
  const overDay = amountUsdc > caps.perDayRemainingUsdc;
  if (overBounty || overDay) {
    return { tier: "T2", decision: "ESCALATE" };
  }
  return result;
}
