// route.test.ts — POST /api/judge.
//
// Judging is an SSE stream, so a failure inside the stream still arrives as HTTP 200 with an
// `error` event. That is exactly the shape a test can miss by checking `res.status` alone —
// every test here reads the events.
//
// SINCE v3 THIS ROUTE MOVES NO MONEY, and these tests exist mostly to keep it that way. What
// a plausible verdict does instead is start the clock: record the submission on-chain, which
// shuts the poster's unilateral refund and opens their window. The assertions below are
// therefore about what must NOT happen (no payout, no points) and about the one thing that
// must (the clock starts, and only for work the arbiter found plausible).

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/arbiter/store", async () => (await import("@/lib/test-support/route-doubles")).storeModule);
vi.mock("@/lib/agent", async () => {
  const { supabaseDouble } = await import("@/lib/test-support/route-doubles");
  return { getSupabaseClient: () => supabaseDouble };
});

const judgeAndSettle = vi.fn();
const awardBountyPoints = vi.fn(async () => {});
vi.mock("@/lib/arbiter/run", () => ({ judgeAndSettle }));
vi.mock("@/lib/points", () => ({ awardBountyPoints }));

import { POSTER, STRANGER, WORKER, resetState, seedBounty, state } from "@/lib/test-support/route-doubles";
import { apiRequest, setTestSessionSecret } from "@/lib/test-support/route-request";

const URL = "http://localhost:3000/api/judge";

/** Read an SSE body into [{event, data}] so a test can assert on what the browser saw. */
async function events(res: Response): Promise<Array<{ event: string; data: Record<string, unknown> }>> {
  const text = await res.text();
  return text.split("\n\n").filter(Boolean).map((block) => {
    const event = /^event: (.+)$/m.exec(block)![1];
    const data = /^data: (.+)$/m.exec(block)![1];
    return { event, data: JSON.parse(data) };
  });
}

function verdict(over: Record<string, unknown> = {}) {
  return { decision: "RELEASE", total_score: 88, confidence: 90, ...over };
}

function settleResult(over: Record<string, unknown> = {}) {
  return {
    judge: { verdict: verdict(), hash: "0xdeadbeef" },
    dryRun: false,
    clockStarted: true,
    ...over,
  };
}

/** A bounty in the one state judging accepts. */
const judgeable = (over = {}) =>
  seedBounty({ status: "SUBMITTED", ...over }, { submission: {} });

async function post(body: unknown, as: string | null = POSTER) {
  const { POST } = await import("./route");
  return POST(await apiRequest(URL, { body, as }));
}

beforeEach(() => {
  setTestSessionSecret();
  resetState();
  judgeAndSettle.mockReset();
  awardBountyPoints.mockReset();
});

describe("POST /api/judge — who may trigger it", () => {
  beforeEach(() => judgeAndSettle.mockResolvedValue(settleResult()));

  it.each([["poster", POSTER], ["worker", WORKER]])("lets the %s judge", async (_who, as) => {
    const b = judgeable();
    const res = await post({ bounty_id: b.id }, as);
    expect(res.status).toBe(200);
    expect((await events(res)).at(-1)!.event).toBe("done");
  });

  it("403s a passer-by — grading costs tokens and can pay out", async () => {
    const b = judgeable();
    expect((await post({ bounty_id: b.id }, STRANGER)).status).toBe(403);
    expect(judgeAndSettle).not.toHaveBeenCalled();
  });

  it("401s an anonymous caller", async () => {
    expect((await post({ bounty_id: judgeable().id }, null)).status).toBe(401);
  });

  it("400s a missing bounty_id", async () => {
    expect((await post({})).status).toBe(400);
  });

  it("429s past the judge rate limit", async () => {
    for (let i = 0; i < 20; i++) expect((await post({ bounty_id: judgeable().id })).status).toBe(200);
    expect((await post({ bounty_id: judgeable().id })).status).toBe(429);
  });
});

describe("POST /api/judge — states it refuses, before spending anything", () => {
  const cases: Array<[string, () => string, RegExp]> = [
    ["a bounty still OPEN", () => seedBounty({ status: "OPEN" }).id, /expected SUBMITTED/],
    ["a bounty already RELEASED", () => seedBounty({ status: "RELEASED" }).id, /expected SUBMITTED/],
    [
      "a rubric the poster never froze",
      () => seedBounty({ status: "SUBMITTED" }, { submission: {}, rubric: { frozen: false } }).id,
      /not frozen/,
    ],
    [
      "a bounty with no submission snapshot",
      () => seedBounty({ status: "SUBMITTED" }).id,
      /no submission/,
    ],
    [
      "a submission already judged",
      () => seedBounty({ status: "SUBMITTED" }, { submission: {}, verdict: {} }).id,
      /already judged/,
    ],
  ];

  it.each(cases)("409s %s", async (_label, make, message) => {
    const res = await post({ bounty_id: make() });
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(message);
    expect(judgeAndSettle).not.toHaveBeenCalled();
  });
});

describe("POST /api/judge — what it must NOT do any more", () => {
  it("does not pay, does not award points, and leaves the bounty JUDGED on a T1 verdict", async () => {
    judgeAndSettle.mockResolvedValue(settleResult());
    const b = judgeable();
    const evs = await events(await post({ bounty_id: b.id }));

    expect(evs.map((e) => e.event)).toEqual(["judging", "verdict", "done"]);
    expect(evs[2].data.status).toBe("JUDGED");
    expect(state.bounties.get(b.id)!.status).toBe("JUDGED");
    expect(awardBountyPoints).not.toHaveBeenCalled();
    expect(state.writes.some((w) => w.op === "setVerdictSettlement")).toBe(false);
  });

  it("records no release tx on the verdict it writes", async () => {
    judgeAndSettle.mockResolvedValue(settleResult());
    await events(await post({ bounty_id: judgeable().id }));
    const write = state.writes.find((w) => w.op === "insertVerdict")!.args as { release_tx: unknown };
    expect(write.release_tx).toBeNull();
  });
});

describe("POST /api/judge — starting the clock", () => {
  it("marks the submission once the chain has it, so the poster can no longer refund alone", async () => {
    judgeAndSettle.mockResolvedValue(settleResult());
    const b = judgeable();
    const evs = await events(await post({ bounty_id: b.id }));

    expect(evs[1].data.clock_started).toBe(true);
    expect(state.bounties.get(b.id)!.submitted_at).toBeTruthy();
  });

  it("starts no clock for work the arbiter found implausible — the poster's refund stays open", async () => {
    judgeAndSettle.mockResolvedValue(
      settleResult({ judge: { verdict: verdict({ decision: "FAIL", total_score: 20 }), hash: "0xh" },
        clockStarted: false, settlementNote: "not plausible" }),
    );
    const b = judgeable();
    const evs = await events(await post({ bounty_id: b.id }));

    expect(evs[1].data.clock_started).toBe(false);
    expect(state.bounties.get(b.id)!.submitted_at).toBeNull();
    expect(state.writes.some((w) => w.op === "markBountySubmitted")).toBe(false);
  });

  it("maps REFUSE to REFUSED and everything else to JUDGED", async () => {
    for (const [decision, expected] of [["REFUSE", "REFUSED"], ["FAIL", "JUDGED"], ["ESCALATE", "JUDGED"], ["RELEASE", "JUDGED"]]) {
      judgeAndSettle.mockResolvedValue(settleResult({
        judge: { verdict: verdict({ decision }), hash: "0xh" },
        clockStarted: decision === "ESCALATE" || decision === "RELEASE",
      }));
      const b = judgeable();
      const evs = await events(await post({ bounty_id: b.id }));
      expect(evs.at(-1)!.data.status, decision).toBe(expected);
    }
  });

  it("writes the verdict row BEFORE the status change, so the ledger cannot miss it", async () => {
    judgeAndSettle.mockResolvedValue(settleResult());
    await events(await post({ bounty_id: judgeable().id }));
    const ops = state.writes.map((w) => w.op);
    expect(ops.indexOf("insertVerdict")).toBeLessThan(ops.lastIndexOf("updateBountyStatus"));
  });

  it("reports a grading crash as an SSE error event, not a silent 200", async () => {
    judgeAndSettle.mockRejectedValue(new Error("Anthropic 401 invalid key"));
    const b = judgeable();
    const evs = await events(await post({ bounty_id: b.id }));

    expect(evs.at(-1)!.event).toBe("error");
    expect(evs.at(-1)!.data.message).toMatch(/401/);
    expect(state.bounties.get(b.id)!.status).toBe("SUBMITTED"); // unchanged — nothing was decided
  });

  /// A failed mark costs the worker timeoutRelease, their only right that does not depend on
  /// this server. It must never be swallowed into a cheerful "done".
  it("surfaces a failed on-chain mark as an error, never as done", async () => {
    judgeAndSettle.mockRejectedValue(new Error("markSubmitted: tx reverted on-chain"));
    const evs = await events(await post({ bounty_id: judgeable().id }));
    expect(evs.at(-1)!.event).toBe("error");
    expect(evs.at(-1)!.data.message).toMatch(/markSubmitted/);
  });
});
