// route.test.ts — /api/settlement/sync.
//
// The route exists because two v3 actions bypass this server entirely: a worker calling
// timeoutRelease from their own wallet, and anyone calling expireClaim. So the only thing
// worth testing hard is the direction of trust — the chain is read, the caller is not
// believed, and running it twice changes nothing the second time.

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/arbiter/store", async () => (await import("@/lib/test-support/route-doubles")).storeModule);
vi.mock("@/lib/agent", async () => {
  const { supabaseDouble } = await import("@/lib/test-support/route-doubles");
  return { getSupabaseClient: () => supabaseDouble };
});

const chain = { settled: false, refunded: false, exists: true };
vi.mock("@/lib/escrow", () => ({
  getBounty: vi.fn(async () =>
    chain.exists ? { settled: chain.settled, refunded: chain.refunded } : null,
  ),
}));

import { STRANGER, resetState, seedBounty, state } from "@/lib/test-support/route-doubles";
import { apiRequest, setTestSessionSecret } from "@/lib/test-support/route-request";

async function sync(body: unknown, as: string | null = null) {
  const { POST } = await import("./route");
  return POST(await apiRequest("http://localhost:3000/api/settlement/sync", { body, as }));
}

beforeEach(() => {
  setTestSessionSecret();
  resetState();
  chain.settled = false;
  chain.refunded = false;
  chain.exists = true;
});

describe("chain → database, one way", () => {
  it("records a settlement this server never performed", async () => {
    const b = seedBounty({ status: "JUDGED" }, { submission: {}, verdict: { decision: "RELEASE" } });
    chain.settled = true;

    const json = await (await sync({ bounty_id: b.id }, STRANGER)).json();
    expect(json.changed).toBe(true);
    expect(state.bounties.get(b.id)!.status).toBe("RELEASED");
    const write = state.writes.find((w) => w.op === "setVerdictSettlement")!.args as { workerBps: number };
    expect(write.workerBps).toBe(10_000); // timeoutRelease pays in full or not at all
  });

  it("records a refund taken directly on-chain", async () => {
    const b = seedBounty({ status: "OPEN" });
    chain.refunded = true;
    expect((await (await sync({ bounty_id: b.id })).json()).status).toBe("REFUNDED");
  });

  it("changes nothing when the chain says nothing happened", async () => {
    const b = seedBounty({ status: "JUDGED" }, { submission: {}, verdict: {} });
    const json = await (await sync({ bounty_id: b.id })).json();
    expect(json.changed).toBe(false);
    expect(state.writes).toHaveLength(0);
  });

  it("is idempotent — the second call writes nothing", async () => {
    const b = seedBounty({ status: "JUDGED" }, { submission: {}, verdict: {} });
    chain.settled = true;
    await sync({ bounty_id: b.id });
    const after = state.writes.length;
    const json = await (await sync({ bounty_id: b.id })).json();
    expect(json.changed).toBe(false);
    expect(state.writes).toHaveLength(after);
  });

  it("believes nothing the caller says about what happened", async () => {
    const b = seedBounty({ status: "JUDGED" }, { submission: {}, verdict: {} });
    // chain.settled stays false: the body is lying.
    const json = await (await sync({ bounty_id: b.id, settled: true, status: "RELEASED" })).json();
    expect(json.changed).toBe(false);
    expect(state.bounties.get(b.id)!.status).toBe("JUDGED");
  });

  it("reports plainly when the bounty was never created on-chain", async () => {
    chain.exists = false;
    const b = seedBounty({ status: "DRAFT" });
    const json = await (await sync({ bounty_id: b.id })).json();
    expect(json.changed).toBe(false);
  });

  it("400s without a bounty_id", async () => {
    expect((await sync({})).status).toBe(400);
  });
});
