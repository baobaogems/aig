// route.test.ts — POST /api/refund, and the one line in it that mattered.
//
// v2's worst behaviour lived here: a poster who had already received the deliverable could
// wait out the deadline and take the money back, keeping both. This is the test that says
// they cannot.

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/arbiter/store", async () => (await import("@/lib/test-support/route-doubles")).storeModule);
vi.mock("@/lib/agent", async () => {
  const { supabaseDouble } = await import("@/lib/test-support/route-doubles");
  return { getSupabaseClient: () => supabaseDouble };
});
const refundEscrow = vi.fn(async () => ({ txHash: "0xrefund" as const }));
vi.mock("@/lib/escrow", () => ({ isDryRun: () => false, refundEscrow }));

import { POSTER, STRANGER, WORKER, resetState, seedBounty, state } from "@/lib/test-support/route-doubles";
import { apiRequest, setTestSessionSecret } from "@/lib/test-support/route-request";

const past = () => new Date(Date.now() - 1000).toISOString();

async function post(body: unknown, as: string | null = POSTER) {
  const { POST } = await import("./route");
  return POST(await apiRequest("http://localhost:3000/api/refund", { body, as }));
}

beforeEach(() => {
  setTestSessionSecret();
  resetState();
  refundEscrow.mockClear();
});

describe("the v2 hole, closed", () => {
  it("refuses a refund once work was handed in, however long the poster waits", async () => {
    const b = seedBounty({ status: "JUDGED", deadline: past(), submitted_at: new Date().toISOString() });
    const res = await post({ bounty_id: b.id });

    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/đã có bài nộp/);
    expect(refundEscrow).not.toHaveBeenCalled();
  });

  it("still refunds when nothing was ever submitted — that money is genuinely theirs", async () => {
    const b = seedBounty({ status: "OPEN", deadline: past(), submitted_at: null });
    const res = await post({ bounty_id: b.id });

    expect(res.status).toBe(200);
    expect(refundEscrow).toHaveBeenCalledWith(b.id);
    expect(state.bounties.get(b.id)!.status).toBe("REFUNDED");
  });
});

describe("the older guards still hold", () => {
  it("409s before the deadline", async () => {
    const b = seedBounty({ status: "OPEN" });
    expect((await post({ bounty_id: b.id })).status).toBe(409);
  });

  it("409s a bounty already released or refunded", async () => {
    for (const status of ["RELEASED", "REFUNDED"] as const) {
      const b = seedBounty({ status, deadline: past() });
      expect((await post({ bounty_id: b.id })).status).toBe(409);
    }
  });

  it("403s the worker and a stranger, 401s an anonymous caller", async () => {
    const b = seedBounty({ status: "OPEN", deadline: past() });
    expect((await post({ bounty_id: b.id }, WORKER)).status).toBe(403);
    expect((await post({ bounty_id: b.id }, STRANGER)).status).toBe(403);
    expect((await post({ bounty_id: b.id }, null)).status).toBe(401);
    expect(refundEscrow).not.toHaveBeenCalled();
  });

  it("400s without a bounty_id", async () => {
    expect((await post({})).status).toBe(400);
  });
});
