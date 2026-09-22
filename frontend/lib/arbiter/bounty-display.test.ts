// bounty-display.test.ts — these three functions decide what a visitor believes about a
// bounty: how long they have, whether it is theirs to take, which one they are looking at.
// Each is wrong in a way that stays invisible until somebody acts on it, so each is pinned.

import { describe, expect, it } from "vitest";
import {
  STATE_LABEL,
  bountyState,
  isClaimable,
  isUrgent,
  shortCode,
  stripLabel,
  timeLeft,
} from "./bounty-display";

const T0 = new Date("2026-09-20T12:00:00Z").getTime();
const at = (offsetMs: number) => new Date(T0 + offsetMs).toISOString();
const MIN = 60_000, HOUR = 60 * MIN, DAY = 24 * HOUR;

describe("bountyState", () => {
  it("unclaimed when nobody has taken it and time remains", () => {
    expect(bountyState(null, "OPEN", at(DAY), T0)).toBe("unclaimed");
  });

  it("in-progress once a worker is on record", () => {
    expect(bountyState("0xabc", "OPEN", at(DAY), T0)).toBe("in-progress");
  });

  it("submitted outranks having a worker", () => {
    expect(bountyState("0xabc", "SUBMITTED", at(DAY), T0)).toBe("submitted");
  });

  it("expired once the deadline passes, claimed or not", () => {
    expect(bountyState(null, "OPEN", at(-1), T0)).toBe("expired");
    expect(bountyState("0xabc", "OPEN", at(-DAY), T0)).toBe("expired");
  });

  it("treats the exact deadline instant as expired", () => {
    // The contract refuses claim() when block.timestamp > deadline; being a second stricter
    // in the UI is safe, being a second looser offers a button that reverts.
    expect(bountyState(null, "OPEN", at(0), T0)).toBe("expired");
  });

  it("closed beats expired — a settled bounty is not 'overdue'", () => {
    for (const s of ["RELEASED", "REFUNDED", "REFUSED", "JUDGED"]) {
      expect(bountyState("0xabc", s, at(-DAY), T0)).toBe("closed");
    }
  });

  it("every state has a label", () => {
    for (const s of ["unclaimed", "in-progress", "submitted", "expired", "closed"] as const) {
      expect(STATE_LABEL[s]).toBeTruthy();
    }
  });
});

describe("isClaimable", () => {
  it("is true only for unclaimed", () => {
    expect(isClaimable("unclaimed")).toBe(true);
    for (const s of ["in-progress", "submitted", "expired", "closed"] as const) {
      expect(isClaimable(s)).toBe(false);
    }
  });
});

describe("timeLeft", () => {
  it("counts days when there are days", () => {
    expect(timeLeft(at(3 * DAY), T0)).toBe("3 days left");
  });

  it("stays in hours below two days — '1 day' would hide 47 hours", () => {
    expect(timeLeft(at(47 * HOUR), T0)).toBe("47 hours left");
    expect(timeLeft(at(48 * HOUR), T0)).toBe("2 days left");
  });

  it("switches to minutes under an hour", () => {
    expect(timeLeft(at(59 * MIN), T0)).toBe("59 minutes left");
    expect(timeLeft(at(60 * MIN), T0)).toBe("1 hour left");
  });

  it("switches to seconds in the last minute", () => {
    expect(timeLeft(at(59_000), T0)).toBe("59 seconds left");
    expect(timeLeft(at(60_000), T0)).toBe("1 minute left");
  });

  it("says so once the deadline has passed, including the exact instant", () => {
    expect(timeLeft(at(0), T0)).toBe("expired");
    expect(timeLeft(at(-1), T0)).toBe("expired");
  });

  it("does not render NaN for a malformed deadline", () => {
    const out = timeLeft("not a date", T0);
    expect(out).not.toMatch(/NaN/);
    expect(out).toBe("deadline unknown");
  });

  it("advances as the clock does — the board ticks by moving `now`", () => {
    const deadline = at(2 * MIN);
    expect(timeLeft(deadline, T0)).toBe("2 minutes left");
    expect(timeLeft(deadline, T0 + 61_000)).toBe("59 seconds left");
  });
});

describe("isUrgent", () => {
  it("is true inside six hours, false outside, false once past", () => {
    expect(isUrgent(at(5 * HOUR), T0)).toBe(true);
    expect(isUrgent(at(7 * HOUR), T0)).toBe(false);
    expect(isUrgent(at(-1), T0)).toBe(false);
  });
});

describe("shortCode", () => {
  const uuid = "3f9c2a1b-4d5e-6f70-8a9b-0c1d2e3f4a5b";

  it("is short, uppercase and prefixed", () => {
    expect(shortCode(uuid)).toBe("AIG-3F9C2A");
  });

  it("is stable — the same id always reads the same", () => {
    expect(shortCode(uuid)).toBe(shortCode(uuid));
  });

  it("traces back to the head of the id by eye", () => {
    expect(uuid.replace(/-/g, "").toUpperCase()).toContain(shortCode(uuid).slice(4));
  });
});

describe("stripLabel", () => {
  it("counts down while the bounty is still live", () => {
    expect(stripLabel("unclaimed", "OPEN", at(3 * DAY), T0)).toBe("3 days left");
    expect(stripLabel("in-progress", "OPEN", at(2 * HOUR), T0)).toBe("2 hours left");
  });

  it("reports the outcome once settled, never a countdown", () => {
    // A finished card showing "expired" contradicts its own "Closed" chip: both true,
    // together meaningless.
    for (const [status, expected] of [
      ["RELEASED", "released to worker"],
      ["REFUNDED", "refunded to poster"],
      ["REFUSED", "arbiter refused to grade"],
      ["JUDGED", "judged — pending poster decision"],
    ] as const) {
      expect(stripLabel("closed", status, at(-DAY), T0)).toBe(expected);
    }
  });

  it("never says 'expired' on a closed bounty, however long ago it ended", () => {
    for (const status of ["RELEASED", "REFUNDED", "REFUSED", "JUDGED"]) {
      expect(stripLabel("closed", status, at(-99 * DAY), T0)).not.toMatch(/expired/);
    }
  });

  it("still says so for work that merely ran out of time", () => {
    expect(stripLabel("expired", "OPEN", at(-1), T0)).toBe("expired");
  });
});
