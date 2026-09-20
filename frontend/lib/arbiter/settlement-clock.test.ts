// settlement-clock.test.ts — the clocks decide who gets paid when nobody acts.

import { describe, expect, it } from "vitest";
import {
  CLAIM_WINDOW_MS, OBJECTION_WINDOW_MS, T2_DECISION_WINDOW_MS,
  minimumDeadlineMs, settlementState,
} from "./settlement-clock";

const T0 = 1_700_000_000_000;
const state = (over: Partial<Parameters<typeof settlementState>[0]> = {}) =>
  settlementState({ tier: "T1", submittedAtMs: T0, resolved: false, nowMs: T0, ...over });

describe("nothing is ticking", () => {
  it("before anything is handed in", () => {
    expect(state({ submittedAtMs: null }).phase).toBe("closed");
  });

  it("once the bounty is resolved", () => {
    expect(state({ resolved: true }).phase).toBe("closed");
  });

  it("for a T3 verdict — the poster's refund path stays open, no countdown to paying", () => {
    expect(state({ tier: "T3" }).phase).toBe("closed");
  });

  it("when there is no verdict yet", () => {
    expect(state({ tier: null }).phase).toBe("closed");
  });
});

describe("T1 — the objection window", () => {
  it("is open right after submission", () => {
    const s = state({ nowMs: T0 + 1000 });
    expect(s.phase).toBe("objection");
    expect(s.posterCanAct).toBe(true);
    expect(s.deadlineMs).toBe(T0 + OBJECTION_WINDOW_MS);
  });

  it("is still open exactly on the boundary — matches the contract's `<=`", () => {
    expect(state({ nowMs: T0 + OBJECTION_WINDOW_MS }).phase).toBe("objection");
  });

  it("falls to the worker one millisecond later", () => {
    const s = state({ nowMs: T0 + OBJECTION_WINDOW_MS + 1 });
    expect(s.phase).toBe("auto-release-due");
    expect(s.posterCanAct).toBe(false);
  });
});

describe("T2 — waiting on the poster", () => {
  it("gets the longer window", () => {
    const s = state({ tier: "T2", nowMs: T0 + OBJECTION_WINDOW_MS + 1 });
    expect(s.phase).toBe("awaiting-poster");
    expect(s.deadlineMs).toBe(T0 + T2_DECISION_WINDOW_MS);
  });

  it("silence past the window pays the worker — the whole point of the redesign", () => {
    expect(state({ tier: "T2", nowMs: T0 + T2_DECISION_WINDOW_MS + 1 }).phase).toBe("auto-release-due");
  });
});

describe("countdown", () => {
  it("is never negative", () => {
    for (const nowMs of [T0, T0 + OBJECTION_WINDOW_MS, T0 + OBJECTION_WINDOW_MS * 10]) {
      expect(state({ nowMs }).secondsLeft).toBeGreaterThanOrEqual(0);
    }
  });

  it("reads zero once the window has passed", () => {
    expect(state({ nowMs: T0 + OBJECTION_WINDOW_MS + 1 }).secondsLeft).toBe(0);
  });
});

describe("minimumDeadlineMs", () => {
  it("is at least a full claim window away, or expireClaim can never rescue the bounty", () => {
    expect(minimumDeadlineMs(T0)).toBe(T0 + CLAIM_WINDOW_MS);
  });
});
