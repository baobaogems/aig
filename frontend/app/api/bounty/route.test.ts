// route.test.ts — POST/GET /api/bounty, the handler itself.
//
// The first test in this file is the one that was missing: a form payload with NO worker_id
// must create a bounty. For half a day it returned 400 to everyone, and 83 green tests said
// nothing, because none of them called a handler.

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/arbiter/store", async () => (await import("@/lib/test-support/route-doubles")).storeModule);
vi.mock("@/lib/agent", async () => {
  const { supabaseDouble } = await import("@/lib/test-support/route-doubles");
  return { getSupabaseClient: () => supabaseDouble };
});
vi.mock("@/lib/arbiter/rubric", () => ({
  generateRubric: vi.fn(async () => ({
    items: [
      { item_id: "r1", criterion: "Đúng chủ đề", weight: 60 },
      { item_id: "r2", criterion: "Đủ độ dài", weight: 40 },
    ],
    usage: { input_tokens: 10, output_tokens: 10 },
  })),
}));

import { POSTER, WORKER, resetState, seedBounty, state } from "@/lib/test-support/route-doubles";
import { apiRequest, futureDeadline, setTestSessionSecret } from "@/lib/test-support/route-request";

const URL = "http://localhost:3000/api/bounty";

/** What the create form actually sends: no worker_id key at all. */
const formBody = (over: Record<string, unknown> = {}) => ({
  brief: "Viết một bài giới thiệu sản phẩm dài khoảng 300 chữ cho người mới.",
  amount_usdc: 5,
  deadline: futureDeadline(),
  ...over,
});

async function post(body: unknown, as: string | null = POSTER) {
  const { POST } = await import("./route");
  return POST(await apiRequest(URL, { body, as }));
}

beforeEach(() => {
  setTestSessionSecret();
  resetState();
  // No vi.resetModules(): the doubles hold their state in module scope, and a fresh registry
  // would hand the handler a different copy from the one these assertions read.
});

describe("POST /api/bounty — the create path", () => {
  it("creates an OPEN bounty when worker_id is absent (the regression)", async () => {
    const res = await post(formBody());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.bounty.worker_id).toBeNull();
    expect(json.rubric.items_json).toHaveLength(2);
  });

  it("takes the poster from the cookie and ignores poster_id in the body", async () => {
    const res = await post(formBody({ poster_id: "0xdeadbeef00000000000000000000000000000000" }));
    expect(res.status).toBe(200);
    const write = state.writes.find((w) => w.op === "createBountyWithRubric");
    expect((write!.args as { poster_id: string }).poster_id).toBe(POSTER.toLowerCase());
  });

  it("accepts an explicit worker_id for a job promised to one person", async () => {
    const res = await post(formBody({ worker_id: WORKER }));
    expect(res.status).toBe(200);
    expect((await res.json()).bounty.worker_id).toBe(WORKER);
  });

  it("401s an anonymous caller before doing any work", async () => {
    const res = await post(formBody(), null);
    expect(res.status).toBe(401);
    expect(state.writes).toHaveLength(0);
  });
});

describe("POST /api/bounty — input the handler must refuse", () => {
  const cases: Array<[string, Record<string, unknown>, number, RegExp]> = [
    ["a worker_id that is not an address", { worker_id: "vitalik" }, 400, /wallet address/],
    ["a brief under 20 chars", { brief: "ngắn quá" }, 400, /brief required/],
    ["a non-numeric amount", { amount_usdc: "nhiều" }, 400, /amount_usdc/],
    ["a zero amount", { amount_usdc: 0 }, 400, /amount_usdc/],
    ["an amount over the per-bounty cap", { amount_usdc: 9_999 }, 400, /amount_usdc/],
    ["a deadline in the past", { deadline: new Date(Date.now() - 1000).toISOString() }, 400, /deadline/],
    ["a deadline that is not a date", { deadline: "thứ ba tuần sau" }, 400, /deadline/],
    // Shorter than CLAIM_WINDOW: someone could claim it, go quiet, and by the time
    // expireClaim could free it there would be no time left to claim it again.
    ["a deadline inside the claim window", { deadline: new Date(Date.now() + 3_600_000).toISOString() }, 400, /hạn chót/],
  ];

  it.each(cases)("rejects %s", async (_label, over, status, message) => {
    const res = await post(formBody(over));
    expect(res.status).toBe(status);
    expect((await res.json()).error).toMatch(message);
  });

  it("refuses null worker_id? no — null means open, and that must keep working", async () => {
    const res = await post(formBody({ worker_id: null }));
    expect(res.status).toBe(200);
  });
});

describe("POST /api/bounty — rate limit", () => {
  it("429s after the 10th create in the window, and does not write an 11th", async () => {
    for (let i = 0; i < 10; i++) expect((await post(formBody())).status).toBe(200);
    const res = await post(formBody());
    expect(res.status).toBe(429);
    expect(state.writes.filter((w) => w.op === "createBountyWithRubric")).toHaveLength(10);
  });
});

describe("GET /api/bounty", () => {
  async function get(query: string, as: string | null = null) {
    const { GET } = await import("./route");
    return GET(await apiRequest(`${URL}${query}`, { method: "GET", as }));
  }

  it("hides the deliverable from a passer-by on the detail read", async () => {
    const b = seedBounty({ status: "SUBMITTED" }, { submission: {} });
    const json = await (await get(`?id=${b.id}`)).json();
    expect(json.viewer_is_party).toBe(false);
    // The row still exists — "a submission was handed in" is public. Its text is not.
    expect(json.submission.content_snapshot).toBe("");
  });

  it("shows the deliverable to a party", async () => {
    const b = seedBounty({ status: "SUBMITTED" }, { submission: {} });
    const json = await (await get(`?id=${b.id}`, POSTER)).json();
    expect(json.viewer_is_party).toBe(true);
    expect(json.submission.content_snapshot).toContain("nội dung");
  });

  it("500s rather than inventing a record for an unknown id", async () => {
    expect((await get("?id=does-not-exist")).status).toBe(500);
  });
});
