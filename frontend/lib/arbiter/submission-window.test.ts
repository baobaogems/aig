// submission-window.test.ts — the retry loop is the product, so its rule is pinned here.
//
// A worker who fails must be able to fix the work and hand it in again; a worker who has
// been PAID must not; a poster mid-decision must not have the verdict pulled out from under
// them. Each of those is a separate line below, because each has a different reason.

import { describe, expect, it } from "vitest";
import { submissionWindow } from "./submission-window";

const T0 = new Date("2026-09-20T12:00:00Z").getTime();
const future = new Date(T0 + 86_400_000).toISOString();
const past = new Date(T0 - 1000).toISOString();
const win = (status: string, lastDecision?: string | null, deadline = future) =>
  submissionWindow({ status, lastDecision, deadline, now: T0 });

describe("first attempt", () => {
  it("is allowed on an open bounty, and is not a retry", () => {
    expect(win("OPEN")).toMatchObject({ allowed: true, isRetry: false });
  });
});

describe("the retry loop", () => {
  it("allows another attempt after FAIL — this is the whole point of the feedback", () => {
    expect(win("JUDGED", "FAIL")).toMatchObject({ allowed: true, isRetry: true });
  });

  it("allows another attempt after REFUSE", () => {
    // REFUSE means the arbiter could not read it or it was off-topic: precisely the case
    // where fixing and resubmitting is the right move.
    expect(win("REFUSED", "REFUSE")).toMatchObject({ allowed: true, isRetry: true });
  });

  it("refuses while the arbiter is still grading", () => {
    const w = win("SUBMITTED");
    expect(w.allowed).toBe(false);
    expect(w.reason).toMatch(/đang được chấm/);
  });

  it("refuses while the poster is deciding an escalated verdict", () => {
    // Accepting here would invalidate the very verdict the poster has open.
    const w = win("JUDGED", "ESCALATE");
    expect(w.allowed).toBe(false);
    expect(w.reason).toMatch(/Người đăng đang xem xét/);
  });
});

describe("terminal states", () => {
  it("refuses once the money has been paid", () => {
    expect(win("RELEASED", "RELEASE").allowed).toBe(false);
  });

  it("refuses once the escrow has been refunded", () => {
    expect(win("REFUNDED", "FAIL").allowed).toBe(false);
  });

  it("refuses past the deadline even after a retryable verdict", () => {
    // Deadline beats retry: the contract will not pay after it either.
    const w = win("JUDGED", "FAIL", past);
    expect(w.allowed).toBe(false);
    expect(w.reason).toMatch(/quá hạn/);
  });

  it("refuses past the deadline on a bounty nobody ever submitted to", () => {
    expect(win("OPEN", null, past).allowed).toBe(false);
  });
});

describe("every refusal explains itself", () => {
  it("never returns an empty reason when it says no", () => {
    for (const [s, d] of [["SUBMITTED", null], ["JUDGED", "ESCALATE"], ["RELEASED", "RELEASE"],
                          ["REFUNDED", "FAIL"], ["JUDGED", null]] as const) {
      const w = win(s, d);
      expect(w.allowed).toBe(false);
      expect(w.reason.length, `${s}/${d} phải nói lý do`).toBeGreaterThan(0);
    }
  });
});
