// route.test.ts — POST /api/escalation: what the poster's verdict actually costs.
//
// The rule under test is the one the whole v3 redesign turns on: rejecting is allowed, and
// it is never free. A poster who received a deliverable can no longer end up holding both
// the work and all of the money.

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/arbiter/store", async () => (await import("@/lib/test-support/route-doubles")).storeModule);
vi.mock("@/lib/agent", async () => {
  const { supabaseDouble } = await import("@/lib/test-support/route-doubles");
  return { getSupabaseClient: () => supabaseDouble };
});
vi.mock("@/lib/escrow", async () => (await import("@/lib/test-support/settlement-doubles")).escrowDouble);
vi.mock("@/lib/arbiter/spend-ledger", async () => (await import("@/lib/test-support/settlement-doubles")).ledgerDouble);
const awardBountyPoints = vi.fn(async () => {});
vi.mock("@/lib/points", () => ({ awardBountyPoints }));

import { POSTER, STRANGER, WORKER, resetState, seedBounty, state } from "@/lib/test-support/route-doubles";
import { resetChain, settled } from "@/lib/test-support/settlement-doubles";
import { apiRequest, setTestSessionSecret } from "@/lib/test-support/route-request";

const URL = "http://localhost:3000/api/escalation";
const REASON = "Thiếu hẳn phần so sánh giá mà tiêu chí 2 yêu cầu.";

/** A judged bounty whose verdict scored `score`, waiting on the poster. */
function judged(score: number, confidence = 60) {
  const b = seedBounty(
    { status: "JUDGED", amount_usdc: 10, submitted_at: new Date().toISOString() },
    { submission: {}, verdict: { decision: "ESCALATE", total_score: score, confidence } },
  );
  return { bounty: b, verdictId: state.verdicts.get(b.id)!.id };
}

async function post(body: unknown, as: string | null = POSTER) {
  const { POST } = await import("./route");
  return POST(await apiRequest(URL, { body, as }));
}

beforeEach(() => {
  setTestSessionSecret();
  resetState();
  resetChain();
  awardBountyPoints.mockReset();
});

describe("APPROVE", () => {
  it("pays the worker in full", async () => {
    const { bounty, verdictId } = judged(65);
    const res = await post({ bounty_id: bounty.id, verdict_id: verdictId, poster_action: "APPROVE" });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.workerBps).toBe(10_000);
    expect(json.workerAmountUsdc).toBe(10);
    expect(json.posterAmountUsdc).toBe(0);
    expect(state.bounties.get(bounty.id)!.status).toBe("RELEASED");
    expect(awardBountyPoints).toHaveBeenCalledWith(WORKER.toLowerCase(), bounty.id, 10);
  });

  it("needs no written reason — approving is not the contested act", async () => {
    const { bounty, verdictId } = judged(65);
    expect((await post({ bounty_id: bounty.id, verdict_id: verdictId, poster_action: "APPROVE" })).status).toBe(200);
  });
});

describe("REJECT — allowed, never free", () => {
  it("pays the kill fee for the score the arbiter gave, and returns the rest", async () => {
    const { bounty, verdictId } = judged(69); // top of the T2 band → 30%
    const json = await (await post({
      bounty_id: bounty.id, verdict_id: verdictId, poster_action: "REJECT", note: REASON,
    })).json();

    expect(json.workerBps).toBe(3_000);
    expect(json.workerAmountUsdc).toBe(3);
    expect(json.posterAmountUsdc).toBe(7);
  });

  it("costs nothing when the arbiter itself scored the work below the fail line", async () => {
    const { bounty, verdictId } = judged(20);
    const json = await (await post({
      bounty_id: bounty.id, verdict_id: verdictId, poster_action: "REJECT", note: REASON,
    })).json();

    expect(json.workerBps).toBe(0);
    expect(json.workerAmountUsdc).toBe(0);
    expect(json.posterAmountUsdc).toBe(10);
    expect(awardBountyPoints).not.toHaveBeenCalled();
  });

  it("refuses a rejection with no reason — an unanswerable no is the abuse", async () => {
    const { bounty, verdictId } = judged(60);
    const res = await post({ bounty_id: bounty.id, verdict_id: verdictId, poster_action: "REJECT", note: "dở" });
    expect(res.status).toBe(400);
    expect(settled).toHaveLength(0);
  });

  it("ignores any bps the caller tries to supply — the price is not theirs to set", async () => {
    const { bounty, verdictId } = judged(69);
    const json = await (await post({
      bounty_id: bounty.id, verdict_id: verdictId, poster_action: "REJECT", note: REASON, workerBps: 0,
    })).json();
    expect(json.workerBps).toBe(3_000);
  });

  it("records the action even though money moved — override_rate must see it", async () => {
    const { bounty, verdictId } = judged(55);
    await post({ bounty_id: bounty.id, verdict_id: verdictId, poster_action: "REJECT", note: REASON });
    const write = state.writes.find((w) => w.op === "insertEscalation")!.args as { poster_action: string };
    expect(write.poster_action).toBe("REJECT");
  });
});

describe("who and when", () => {
  it("403s the worker — they do not get to approve their own work", async () => {
    const { bounty, verdictId } = judged(65);
    const res = await post({ bounty_id: bounty.id, verdict_id: verdictId, poster_action: "APPROVE" }, WORKER);
    expect(res.status).toBe(403);
    expect(settled).toHaveLength(0);
  });

  it("403s a stranger, 401s an anonymous caller", async () => {
    const { bounty, verdictId } = judged(65);
    const body = { bounty_id: bounty.id, verdict_id: verdictId, poster_action: "APPROVE" };
    expect((await post(body, STRANGER)).status).toBe(403);
    expect((await post(body, null)).status).toBe(401);
  });

  it("409s a second action on the same verdict — no paying twice", async () => {
    const { bounty, verdictId } = judged(65);
    const body = { bounty_id: bounty.id, verdict_id: verdictId, poster_action: "APPROVE" };
    expect((await post(body)).status).toBe(200);
    expect((await post(body)).status).toBe(409);
    expect(settled).toHaveLength(1);
  });

  it("404s a verdict that belongs to another bounty", async () => {
    const { bounty } = judged(65);
    const res = await post({ bounty_id: bounty.id, verdict_id: "someone-elses", poster_action: "APPROVE" });
    expect(res.status).toBe(404);
  });

  it("400s an action that is neither APPROVE nor REJECT", async () => {
    const { bounty, verdictId } = judged(65);
    const res = await post({ bounty_id: bounty.id, verdict_id: verdictId, poster_action: "MAYBE" });
    expect(res.status).toBe(400);
  });
});
