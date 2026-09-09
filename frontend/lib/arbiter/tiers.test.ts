// tiers.test.ts — the money decision, tested. These are pure functions with no I/O, which
// is exactly why the safety rules live here rather than in the prompt or the route.
//
// The two split-profile cases below are transcribed from real judging runs on 07/09/2026,
// where the same prompt produced obedience once and defiance once.

import { describe, expect, it } from "vitest";
import { applySpendCap, applySplitProfileCap, decideTier, TIER_THRESHOLDS } from "./tiers";

const item = (score: number) => ({ score });

describe("applySplitProfileCap", () => {
  it("caps a split profile at 70 even when the model claims 90", () => {
    // Observed live: model wrote "capped at 70" in its reasoning and then returned 90.
    expect(applySplitProfileCap(90, [item(0), item(95)])).toBe(70);
  });

  it("leaves an already-obedient 70 alone", () => {
    // Observed live: same prompt, same shape, model returned 70 by itself.
    expect(applySplitProfileCap(70, [item(10), item(88)])).toBe(70);
  });

  it("never raises confidence", () => {
    expect(applySplitProfileCap(35, [item(0), item(90)])).toBe(35);
  });

  it("does not fire on a uniformly weak deliverable", () => {
    // Nothing scores >= 80, so there is no split — just a bad submission.
    expect(applySplitProfileCap(88, [item(15), item(20), item(30)])).toBe(88);
  });

  it("does not fire on a uniformly strong deliverable", () => {
    expect(applySplitProfileCap(95, [item(85), item(90), item(100)])).toBe(95);
  });

  it("fires on the boundary values themselves", () => {
    expect(applySplitProfileCap(99, [item(20), item(80)])).toBe(70);
  });

  it("does not fire just outside the boundary", () => {
    expect(applySplitProfileCap(99, [item(21), item(79)])).toBe(99);
  });

  it("handles an empty item list without capping", () => {
    expect(applySplitProfileCap(90, [])).toBe(90);
  });
});

describe("the hole this closes", () => {
  const caps = { perBountyUsdc: 50, perDayRemainingUsdc: 150 };

  it("would auto-release a split deliverable if the model's claim were trusted", () => {
    // The pre-fix path: raw confidence straight into decideTier.
    const unguarded = decideTier({ totalScore: 75, confidence: 90, outOfScope: false });
    expect(unguarded).toEqual({ tier: "T1", decision: "RELEASE" });
    expect(applySpendCap(unguarded, 5, caps).tier).toBe("T1"); // money moves, no human
  });

  it("escalates the same deliverable once the cap is enforced", () => {
    const conf = applySplitProfileCap(90, [item(0), item(95)]);
    const guarded = decideTier({ totalScore: 75, confidence: conf, outOfScope: false });
    expect(guarded).toEqual({ tier: "T2", decision: "ESCALATE" });
  });

  it("holds confidence above the refuse floor, so a split profile escalates rather than fails", () => {
    // 70 is deliberately above refuseConfidence (50): a split profile is the poster's
    // judgment call, not a verdict that the work failed.
    expect(TIER_THRESHOLDS.splitConfidenceCeiling).toBeGreaterThan(TIER_THRESHOLDS.refuseConfidence);
    expect(TIER_THRESHOLDS.splitConfidenceCeiling).toBeLessThan(TIER_THRESHOLDS.autoReleaseConfidence);
  });

  it("cannot be dodged by citing no evidence, because callers pass effective scores", () => {
    // A model claiming 85 on an item while citing nothing has that item zeroed by judge.ts
    // before it reaches here — so the item reads as unmet and the cap still fires.
    const rawScoresWouldNotCap = applySplitProfileCap(90, [item(85), item(95)]);
    expect(rawScoresWouldNotCap).toBe(90);
    const effectiveScoresDoCap = applySplitProfileCap(90, [item(0), item(95)]);
    expect(effectiveScoresDoCap).toBe(70);
  });
});

describe("decideTier", () => {
  it("releases only when both gates are cleared", () => {
    expect(decideTier({ totalScore: 70, confidence: 85, outOfScope: false }).decision).toBe("RELEASE");
    expect(decideTier({ totalScore: 69, confidence: 85, outOfScope: false }).decision).toBe("ESCALATE");
    expect(decideTier({ totalScore: 70, confidence: 84, outOfScope: false }).decision).toBe("ESCALATE");
  });

  it("fails a clear miss and refuses what it cannot judge", () => {
    expect(decideTier({ totalScore: 39, confidence: 90, outOfScope: false })).toEqual({ tier: "T3", decision: "FAIL" });
    expect(decideTier({ totalScore: 95, confidence: 95, outOfScope: true })).toEqual({ tier: "T3", decision: "REFUSE" });
    expect(decideTier({ totalScore: 95, confidence: 49, outOfScope: false })).toEqual({ tier: "T3", decision: "REFUSE" });
  });
});

describe("applySpendCap", () => {
  it("downgrades an over-cap T1 to a human decision instead of blocking it", () => {
    const t1 = { tier: "T1", decision: "RELEASE" } as const;
    expect(applySpendCap(t1, 60, { perBountyUsdc: 50, perDayRemainingUsdc: 150 })).toEqual({ tier: "T2", decision: "ESCALATE" });
    expect(applySpendCap(t1, 20, { perBountyUsdc: 50, perDayRemainingUsdc: 10 })).toEqual({ tier: "T2", decision: "ESCALATE" });
    expect(applySpendCap(t1, 20, { perBountyUsdc: 50, perDayRemainingUsdc: 150 })).toEqual(t1);
  });

  it("leaves non-T1 tiers untouched", () => {
    const t3 = { tier: "T3", decision: "FAIL" } as const;
    expect(applySpendCap(t3, 9999, { perBountyUsdc: 1, perDayRemainingUsdc: 1 })).toEqual(t3);
  });
});
