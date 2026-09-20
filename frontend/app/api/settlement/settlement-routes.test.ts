// settlement-routes.test.ts — /api/settlement/object and /api/settlement/finalize.
//
// These two routes carry the rule that makes v3 different from v2:
//   - object   : a T1 payout can be stopped, but only inside the window and only at a price
//   - finalize : when the poster says nothing, the worker gets paid. Silence no longer wins.

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/arbiter/store", async () => (await import("@/lib/test-support/route-doubles")).storeModule);
vi.mock("@/lib/agent", async () => {
  const { supabaseDouble } = await import("@/lib/test-support/route-doubles");
  return { getSupabaseClient: () => supabaseDouble };
});
vi.mock("@/lib/escrow", async () => (await import("@/lib/test-support/settlement-doubles")).escrowDouble);
vi.mock("@/lib/arbiter/spend-ledger", async () => (await import("@/lib/test-support/settlement-doubles")).ledgerDouble);
vi.mock("@/lib/points", () => ({ awardBountyPoints: vi.fn(async () => {}) }));

import { POSTER, STRANGER, WORKER, resetState, seedBounty, state } from "@/lib/test-support/route-doubles";
import { ledgerDouble, resetChain, settled } from "@/lib/test-support/settlement-doubles";
import { apiRequest, setTestSessionSecret } from "@/lib/test-support/route-request";
import { OBJECTION_WINDOW_MS, T2_DECISION_WINDOW_MS } from "@/lib/arbiter/settlement-clock";

const REASON = "Bài bỏ qua hoàn toàn tiêu chí 2 về so sánh giá.";
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

/** A bounty with a T1 verdict (score 88 / confidence 90) submitted `submittedAgoMs` ago. */
function t1(submittedAgoMs: number) {
  const b = seedBounty(
    { status: "JUDGED", amount_usdc: 10, submitted_at: ago(submittedAgoMs) },
    { submission: {}, verdict: { decision: "RELEASE", total_score: 88, confidence: 90 } },
  );
  return b;
}

/** A T2 verdict: the arbiter was unsure and handed the call to the poster. */
function t2(submittedAgoMs: number) {
  return seedBounty(
    { status: "JUDGED", amount_usdc: 10, submitted_at: ago(submittedAgoMs) },
    { submission: {}, verdict: { decision: "ESCALATE", total_score: 55, confidence: 60 } },
  );
}

async function object_(body: unknown, as: string | null = POSTER) {
  const { POST } = await import("./object/route");
  return POST(await apiRequest("http://localhost:3000/api/settlement/object", { body, as }));
}
async function finalize(body: unknown, as: string | null = null) {
  const { POST } = await import("./finalize/route");
  return POST(await apiRequest("http://localhost:3000/api/settlement/finalize", { body, as }));
}

beforeEach(() => {
  setTestSessionSecret();
  resetState();
  resetChain();
  ledgerDouble.remainingUsdc = 1_000;
  ledgerDouble.degraded = false;
});

describe("object — the poster's answer to a T1 verdict", () => {
  it("stops the full payout at half the escrow", async () => {
    const b = t1(1000);
    const json = await (await object_({ bounty_id: b.id, note: REASON })).json();

    expect(json.workerBps).toBe(5_000);
    expect(json.workerAmountUsdc).toBe(5);
    expect(json.posterAmountUsdc).toBe(5);
    expect(state.bounties.get(b.id)!.status).toBe("RELEASED");
  });

  it("409s once the window has closed — by then the silence has spoken", async () => {
    const b = t1(OBJECTION_WINDOW_MS + 1000);
    const res = await object_({ bounty_id: b.id, note: REASON });
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/hết hạn/);
    expect(settled).toHaveLength(0);
  });

  it("400s without a reason", async () => {
    const res = await object_({ bounty_id: t1(1000).id, note: "" });
    expect(res.status).toBe(400);
  });

  it("403s the worker and a stranger, 401s an anonymous caller", async () => {
    const b = t1(1000);
    expect((await object_({ bounty_id: b.id, note: REASON }, WORKER)).status).toBe(403);
    expect((await object_({ bounty_id: b.id, note: REASON }, STRANGER)).status).toBe(403);
    expect((await object_({ bounty_id: b.id, note: REASON }, null)).status).toBe(401);
    expect(settled).toHaveLength(0);
  });

  it("409s a T2 verdict — that one goes through /api/escalation, at its own price", async () => {
    const res = await object_({ bounty_id: t2(1000).id, note: REASON });
    expect(res.status).toBe(409);
  });

  it("cannot be used twice", async () => {
    const b = t1(1000);
    expect((await object_({ bounty_id: b.id, note: REASON })).status).toBe(200);
    expect((await object_({ bounty_id: b.id, note: REASON })).status).toBe(409);
    expect(settled).toHaveLength(1);
  });
});

describe("finalize — silence pays the worker", () => {
  it("pays in full after the T1 window, called by a total stranger", async () => {
    const b = t1(OBJECTION_WINDOW_MS + 1000);
    const json = await (await finalize({ bounty_id: b.id }, STRANGER)).json();

    expect(json.workerBps).toBe(10_000);
    expect(json.workerAmountUsdc).toBe(10);
    expect(state.bounties.get(b.id)!.status).toBe("RELEASED");
  });

  it("pays in full after the longer T2 window", async () => {
    const b = t2(T2_DECISION_WINDOW_MS + 1000);
    expect((await finalize({ bounty_id: b.id })).status).toBe(200);
  });

  it("409s while the poster still has time", async () => {
    const res = await finalize({ bounty_id: t2(1000).id });
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/chưa tới hạn/);
    expect(settled).toHaveLength(0);
  });

  it("409s a bounty with no clock running — nothing was ever handed in", async () => {
    const b = seedBounty({ status: "JUDGED" }, { submission: {}, verdict: { decision: "FAIL", total_score: 20 } });
    const res = await finalize({ bounty_id: b.id });
    expect(res.status).toBe(409);
  });

  it("is idempotent: a second call refuses instead of paying twice", async () => {
    const b = t1(OBJECTION_WINDOW_MS + 1000);
    expect((await finalize({ bounty_id: b.id })).status).toBe(200);
    expect((await finalize({ bounty_id: b.id })).status).toBe(409);
    expect(settled).toHaveLength(1);
  });

  it("fails closed against the day cap, and says the worker is still owed", async () => {
    ledgerDouble.remainingUsdc = 1; // less than the 10 USDC this would pay
    const b = t1(OBJECTION_WINDOW_MS + 1000);
    const res = await finalize({ bounty_id: b.id });

    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/day cap/);
    expect(settled).toHaveLength(0);
    expect(state.bounties.get(b.id)!.status).toBe("JUDGED");
  });

  it("400s without a bounty_id", async () => {
    expect((await finalize({})).status).toBe(400);
  });
});
