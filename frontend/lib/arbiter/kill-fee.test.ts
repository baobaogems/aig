// kill-fee.test.ts — the ladder decides real money, so it gets the same treatment as tiers.ts.

import { describe, expect, it } from "vitest";
import { BPS_DENOMINATOR, T1_OBJECTION_BPS, T2_MAX_BPS, killFeeBps, posterAmountUsdc, workerAmountUsdc } from "./kill-fee";

describe("killFeeBps — the rungs", () => {
  it.each([
    [39, "T3", 0],
    [80, "T3", 0], // out-of-scope can score well and still earn nothing
    [39, "T2", 0], // below the fail line, whatever the tier says
    [40, "T2", 0],
    [69, "T2", T2_MAX_BPS],
    [70, "T1", T1_OBJECTION_BPS],
    [95, "T1", T1_OBJECTION_BPS],
  ] as const)("score %i in %s → %i bps", (totalScore, tier, expected) => {
    expect(killFeeBps({ totalScore, tier })).toBe(expected);
  });

  it("climbs through the middle of the T2 band", () => {
    const mid = killFeeBps({ totalScore: 55, tier: "T2" });
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(T2_MAX_BPS);
  });
});

describe("killFeeBps — properties that must hold for any input", () => {
  it("never decreases as the score rises", () => {
    let previous = -1;
    for (let score = 0; score <= 100; score++) {
      const bps = killFeeBps({ totalScore: score, tier: "T2" });
      expect(bps).toBeGreaterThanOrEqual(previous);
      previous = bps;
    }
  });

  it("always returns a settle()-safe integer", () => {
    for (const totalScore of [-50, 0, 40.5, 69.9, 100, 1e9, NaN, Infinity]) {
      for (const tier of ["T1", "T2", "T3"] as const) {
        const bps = killFeeBps({ totalScore, tier });
        expect(Number.isInteger(bps)).toBe(true);
        expect(bps).toBeGreaterThanOrEqual(0);
        expect(bps).toBeLessThanOrEqual(BPS_DENOMINATOR);
      }
    }
  });

  it("a rejected T2 deliverable never earns more than an objected-to T1 one", () => {
    for (let score = 40; score <= 69; score++) {
      expect(killFeeBps({ totalScore: score, tier: "T2" })).toBeLessThan(T1_OBJECTION_BPS);
    }
  });
});

describe("splitting the escrow", () => {
  it("the two shares always add back to the whole", () => {
    for (const amount of [1, 5, 10, 33.33, 49.99, 50]) {
      for (const bps of [0, 1, 1234, 3000, 5000, 9999, 10000]) {
        const worker = workerAmountUsdc(amount, bps);
        const poster = posterAmountUsdc(amount, bps);
        expect(Math.round((worker + poster) * 1e6)).toBe(Math.round(amount * 1e6));
      }
    }
  });

  it("rounds the worker's share down, like the contract does", () => {
    // 1 USDC at 3333 bps = 333300 micro-USDC exactly; a half-micro would floor, not round up.
    expect(workerAmountUsdc(1, 3333)).toBeCloseTo(0.3333, 6);
    expect(workerAmountUsdc(0.000001, 5000)).toBe(0); // dust cannot be split, poster keeps it
    expect(posterAmountUsdc(0.000001, 5000)).toBe(0.000001);
  });
});
