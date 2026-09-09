// override-rate.test.ts — this number is published on the landing page and on /arbiter.
// It is the single figure the product's accountability claim rests on, so the definition is
// pinned here rather than left to whoever next edits a SQL view.

import { describe, expect, it } from "vitest";
import { computeOverrideStats, formatOverrideRate, type VerdictAction } from "./override-rate";

const row = (decision: string, posterAction: VerdictAction["posterAction"] = null): VerdictAction => ({
  decision, posterAction,
});

describe("computeOverrideStats", () => {
  it("counts a blocked release as an overturn", () => {
    const s = computeOverrideStats([row("RELEASE", "REJECT")]);
    expect(s).toEqual({ escalatedToHuman: 0, overturned: 1, decisiveReviewed: 1 });
  });

  it("counts paying out over a FAIL as an overturn", () => {
    const s = computeOverrideStats([row("FAIL", "APPROVE")]);
    expect(s).toEqual({ escalatedToHuman: 0, overturned: 1, decisiveReviewed: 1 });
  });

  it("does not count agreement as an overturn, but does count it as reviewed", () => {
    const s = computeOverrideStats([row("RELEASE", "APPROVE"), row("FAIL", "REJECT")]);
    expect(s).toEqual({ escalatedToHuman: 0, overturned: 0, decisiveReviewed: 2 });
  });

  it("never counts ESCALATE as an overturn — the arbiter stated no position to overturn", () => {
    // The exact shape of the three real actions on record as of 09/09/2026.
    const s = computeOverrideStats([
      row("ESCALATE", "REJECT"),
      row("ESCALATE", "APPROVE"),
      row("ESCALATE", "REJECT"),
    ]);
    expect(s.overturned).toBe(0);
    expect(s.decisiveReviewed).toBe(0);
    expect(s.escalatedToHuman).toBe(3);
    expect(formatOverrideRate(s)).toBe("none yet");
  });

  it("never counts REFUSE either — declining to judge is not a position", () => {
    const s = computeOverrideStats([row("REFUSE", "REJECT"), row("REFUSE", "APPROVE")]);
    expect(s.overturned).toBe(0);
    expect(s.decisiveReviewed).toBe(0);
  });

  it("counts escalated verdicts, not button presses", () => {
    // The old view counted rows in `escalations`, so an escalated verdict awaiting an
    // answer was invisible. Two escalated, only one answered — both are still "sent to a
    // human".
    const s = computeOverrideStats([row("ESCALATE", "REJECT"), row("ESCALATE", null)]);
    expect(s.escalatedToHuman).toBe(2);
  });

  it("ignores decisive verdicts nobody has answered", () => {
    const s = computeOverrideStats([row("RELEASE", null), row("FAIL", null)]);
    expect(s).toEqual({ escalatedToHuman: 0, overturned: 0, decisiveReviewed: 0 });
  });

  it("handles an empty record", () => {
    expect(computeOverrideStats([])).toEqual({ escalatedToHuman: 0, overturned: 0, decisiveReviewed: 0 });
  });

  it("reproduces what the old view claimed, and what is actually true", () => {
    const real = [row("ESCALATE", "REJECT"), row("ESCALATE", "APPROVE"), row("ESCALATE", "REJECT")];
    // agent_stats counted every REJECT as an override over every action: "2 of 3".
    const oldViewWouldSay = `${real.filter((r) => r.posterAction === "REJECT").length} of ${real.filter((r) => r.posterAction).length}`;
    expect(oldViewWouldSay).toBe("2 of 3");
    expect(formatOverrideRate(computeOverrideStats(real))).toBe("none yet");
  });
});

describe("formatOverrideRate", () => {
  it("stays a fraction — small n makes a percentage overstate", () => {
    expect(formatOverrideRate({ escalatedToHuman: 0, overturned: 1, decisiveReviewed: 3 })).toBe("1 of 3");
  });

  it("says so plainly when there is nothing to express as a ratio", () => {
    expect(formatOverrideRate({ escalatedToHuman: 5, overturned: 0, decisiveReviewed: 0 })).toBe("none yet");
  });
});
