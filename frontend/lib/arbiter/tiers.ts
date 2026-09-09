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
  // Split-profile cap. One requirement wholly unmet while another is strongly met is the
  // POSTER's call, not the arbiter's — so confidence is held below autoReleaseConfidence,
  // which forces T2. See applySplitProfileCap.
  splitUnmetAtOrBelow: 20,
  splitStrongAtOrAbove: 80,
  splitConfidenceCeiling: 70,
} as const;

export interface ScoredItem {
  /** Score AFTER the no-evidence rule has been applied — see applySplitProfileCap. */
  score: number;
}

/**
 * Hold confidence down when the deliverable is split: some requirement essentially unmet
 * (≤20) while another is strongly met (≥80).
 *
 * grade-v2.ts already instructs the model to cap itself at 70 here, and in live runs it
 * has both obeyed (said "capped at 70", returned 70) and ignored itself (said "capped at
 * 70", returned 90). A prompt is a request; this is the rule. Without it a deliverable
 * scoring 75 overall with one requirement flatly violated could reach T1 on a confidence
 * number the model simply asserted, and the money would move with no human in the loop.
 *
 * IMPORTANT: `items` must carry EFFECTIVE scores, i.e. after judge.ts has zeroed items that
 * cited no evidence. Checking the model's raw scores would leave the cap trivially avoidable
 * — claim 85 on an item, cite nothing, and the item counts as 0 toward the total while never
 * looking "unmet" to this check.
 */
export function applySplitProfileCap(confidence: number, items: ScoredItem[]): number {
  const t = TIER_THRESHOLDS;
  const hasUnmet = items.some((i) => i.score <= t.splitUnmetAtOrBelow);
  const hasStrong = items.some((i) => i.score >= t.splitStrongAtOrAbove);
  if (hasUnmet && hasStrong) return Math.min(confidence, t.splitConfidenceCeiling);
  return confidence;
}

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
