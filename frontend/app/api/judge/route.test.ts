// route.test.ts — POST /api/judge, the only route that can move money.
//
// Judging is an SSE stream, so a failure inside the stream still arrives as HTTP 200 with an
// `error` event. That is exactly the shape a test can miss by checking `res.status` alone —
// every test here reads the events.
//
// The money assertions are the point: status RELEASED only when USDC actually moved, points
// only alongside a real release, and the verdict row written BEFORE any status side-effect,
// so the spend ledger can never under-count a release.

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

describe("POST /api/judge — the money path", () => {
  it("RELEASED + points only when USDC actually moved", async () => {
    judgeAndSettle.mockResolvedValue(settleResult({
      release: { txHash: "0xtx", worker: WORKER.toLowerCase(), amountUsdc: 5 },
    }));
    const b = judgeable();
    const evs = await events(await post({ bounty_id: b.id }));

    expect(evs.map((e) => e.event)).toEqual(["judging", "verdict", "done"]);
    expect(evs[1].data.release_tx).toBe("0xtx");
    expect(evs[2].data.status).toBe("RELEASED");
    expect(state.bounties.get(b.id)!.status).toBe("RELEASED");
    expect(awardBountyPoints).toHaveBeenCalledWith(WORKER.toLowerCase(), b.id, 5);
  });

  it("a RELEASE verdict that did NOT pay out stays JUDGED, and awards nothing", async () => {
    // Dry run, spend cap, or a failed send — the verdict says release, the chain did not.
    judgeAndSettle.mockResolvedValue(settleResult({ dryRun: true, settlementNote: "DRY_RUN" }));
    const b = judgeable();
    const evs = await events(await post({ bounty_id: b.id }));

    expect(evs[2].data.status).toBe("JUDGED");
    expect(evs[1].data.release_tx).toBeNull();
    expect(awardBountyPoints).not.toHaveBeenCalled();
  });

  it("maps REFUSE to REFUSED and FAIL/ESCALATE to JUDGED", async () => {
    for (const [decision, expected] of [["REFUSE", "REFUSED"], ["FAIL", "JUDGED"], ["ESCALATE", "JUDGED"]]) {
      judgeAndSettle.mockResolvedValue(settleResult({
        judge: { verdict: verdict({ decision }), hash: "0xh" },
      }));
      const b = judgeable();
      const evs = await events(await post({ bounty_id: b.id }));
      expect(evs.at(-1)!.data.status, decision).toBe(expected);
    }
  });

  it("writes the verdict row BEFORE the status change, so the ledger cannot miss it", async () => {
    judgeAndSettle.mockResolvedValue(settleResult({
      release: { txHash: "0xtx", worker: WORKER.toLowerCase(), amountUsdc: 5 },
    }));
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
    expect(awardBountyPoints).not.toHaveBeenCalled();
  });

  it("does not award points when the chain paid but the DB has no worker", async () => {
    judgeAndSettle.mockResolvedValue(settleResult({
      release: { txHash: "0xtx", worker: WORKER.toLowerCase(), amountUsdc: 5 },
    }));
    const b = judgeable({ worker_id: null });
    const evs = await events(await post({ bounty_id: b.id }));
    expect(evs.at(-1)!.data.status).toBe("RELEASED");
    expect(awardBountyPoints).not.toHaveBeenCalled();
  });
});
