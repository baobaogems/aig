// route.test.ts — POST /api/submission.
//
// Two promises this handler makes, both of which need the handler running to check:
//   1. only the assigned worker may hand work in (the authz gate, for real, via the cookie)
//   2. a FAIL is the start of a loop — a second attempt must be accepted, an ESCALATE must not

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/arbiter/store", async () => (await import("@/lib/test-support/route-doubles")).storeModule);
vi.mock("@/lib/agent", async () => {
  const { supabaseDouble } = await import("@/lib/test-support/route-doubles");
  return { getSupabaseClient: () => supabaseDouble };
});

const fetchDeliverable = vi.fn();
vi.mock("@/lib/arbiter/fetch-deliverable", async () => {
  const actual = await vi.importActual<typeof import("@/lib/arbiter/fetch-deliverable")>(
    "@/lib/arbiter/fetch-deliverable",
  );
  // DeliverableFetchError stays the real class — the handler's 400-vs-500 split is an
  // `instanceof` check, and a stand-in class would quietly turn a 400 into a 500.
  return { ...actual, fetchDeliverable };
});

import { POSTER, STRANGER, WORKER, resetState, seedBounty, state } from "@/lib/test-support/route-doubles";
import { apiRequest, setTestSessionSecret } from "@/lib/test-support/route-request";

const URL = "http://localhost:3000/api/submission";
const GOOD_TEXT = "Đây là bài nộp, đủ dài để được chấm.";

async function post(body: unknown, as: string | null = WORKER) {
  const { POST } = await import("./route");
  return POST(await apiRequest(URL, { body, as }));
}

beforeEach(() => {
  setTestSessionSecret();
  resetState();
  fetchDeliverable.mockReset();
});

describe("POST /api/submission — who may submit", () => {
  it("accepts the assigned worker", async () => {
    const b = seedBounty({ status: "OPEN" });
    const res = await post({ bounty_id: b.id, content: GOOD_TEXT });
    expect(res.status).toBe(200);
    expect((await res.json()).isRetry).toBe(false);
    expect(state.bounties.get(b.id)!.status).toBe("SUBMITTED");
  });

  it("403s the poster — posting a job is not doing it", async () => {
    const b = seedBounty({ status: "OPEN" });
    expect((await post({ bounty_id: b.id, content: GOOD_TEXT }, POSTER)).status).toBe(403);
  });

  it("403s a stranger and writes nothing", async () => {
    const b = seedBounty({ status: "OPEN" });
    expect((await post({ bounty_id: b.id, content: GOOD_TEXT }, STRANGER)).status).toBe(403);
    expect(state.writes.filter((w) => w.op === "insertSubmission")).toHaveLength(0);
  });

  it("401s an anonymous caller", async () => {
    const b = seedBounty({ status: "OPEN" });
    expect((await post({ bounty_id: b.id, content: GOOD_TEXT }, null)).status).toBe(401);
  });

  it("404s an unknown bounty, without saying whether it exists", async () => {
    const res = await post({ bounty_id: "no-such-bounty", content: GOOD_TEXT });
    expect(res.status).toBe(404);
    expect((await res.json()).error).not.toMatch(/quyền/);
  });

  it("400s a missing bounty_id before touching the database", async () => {
    expect((await post({ content: GOOD_TEXT })).status).toBe(400);
  });
});

describe("POST /api/submission — the retry loop", () => {
  const judged = (decision: string) =>
    seedBounty({ status: "JUDGED" }, { submission: {}, verdict: { decision } });

  it("accepts a second attempt after a FAIL, flagged as a retry", async () => {
    const b = judged("FAIL");
    const res = await post({ bounty_id: b.id, content: "Bản sửa lại, đã bám sát tiêu chí." });
    expect(res.status).toBe(200);
    expect((await res.json()).isRetry).toBe(true);
  });

  it("409s while the previous attempt is still being judged", async () => {
    const b = seedBounty({ status: "SUBMITTED" }, { submission: {} });
    const res = await post({ bounty_id: b.id, content: GOOD_TEXT });
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/đang được chấm/);
  });

  it("409s an ESCALATE — the poster is mid-decision", async () => {
    expect((await post({ bounty_id: judged("ESCALATE").id, content: GOOD_TEXT })).status).toBe(409);
  });

  it("409s a bounty already paid out", async () => {
    const b = seedBounty({ status: "RELEASED" });
    expect((await post({ bounty_id: b.id, content: GOOD_TEXT })).status).toBe(409);
  });

  it("409s past the deadline, whatever the status", async () => {
    const b = seedBounty({ status: "OPEN", deadline: new Date(Date.now() - 1000).toISOString() });
    const res = await post({ bounty_id: b.id, content: GOOD_TEXT });
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/quá hạn/);
  });
});

describe("POST /api/submission — what gets frozen", () => {
  it("stores pasted text trimmed, with no source_url", async () => {
    const b = seedBounty({ status: "OPEN" });
    await post({ bounty_id: b.id, content: `  ${GOOD_TEXT}  ` });
    const w = state.writes.find((x) => x.op === "insertSubmission")!.args as Record<string, string | null>;
    expect(w.content_snapshot).toBe(GOOD_TEXT);
    expect(w.source_url).toBeNull();
  });

  it("fetches a source_url server-side and freezes what came back", async () => {
    fetchDeliverable.mockResolvedValue({ text: "Nội dung lấy từ link công khai." });
    const b = seedBounty({ status: "OPEN" });
    const res = await post({ bounty_id: b.id, source_url: "https://example.com/bai-viet" });
    expect(res.status).toBe(200);
    expect(fetchDeliverable).toHaveBeenCalledWith("https://example.com/bai-viet");
    const w = state.writes.find((x) => x.op === "insertSubmission")!.args as Record<string, string>;
    expect(w.content_snapshot).toBe("Nội dung lấy từ link công khai.");
    expect(w.source_url).toBe("https://example.com/bai-viet");
  });

  it("turns a blocked URL into a 400 the submitter can act on, not a 500", async () => {
    const { DeliverableFetchError } = await import("@/lib/arbiter/fetch-deliverable");
    fetchDeliverable.mockRejectedValue(new DeliverableFetchError("link trỏ vào mạng nội bộ"));
    const b = seedBounty({ status: "OPEN" });
    const res = await post({ bounty_id: b.id, source_url: "http://169.254.169.254/" });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/nội bộ/);
    expect(state.writes.filter((x) => x.op === "insertSubmission")).toHaveLength(0);
  });

  it("500s an unexpected fetch crash instead of judging an empty page", async () => {
    fetchDeliverable.mockRejectedValue(new TypeError("socket hang up"));
    const b = seedBounty({ status: "OPEN" });
    expect((await post({ bounty_id: b.id, source_url: "https://example.com/x" })).status).toBe(500);
  });

  it("400s when neither text nor link is given", async () => {
    const b = seedBounty({ status: "OPEN" });
    const res = await post({ bounty_id: b.id, content: "   " });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/content required/);
  });

  it("400s content too short to grade", async () => {
    const b = seedBounty({ status: "OPEN" });
    expect((await post({ bounty_id: b.id, content: "ngắn" })).status).toBe(400);
  });

  it("prefers pasted text over a link when both arrive", async () => {
    const b = seedBounty({ status: "OPEN" });
    await post({ bounty_id: b.id, content: GOOD_TEXT, source_url: "https://example.com/x" });
    expect(fetchDeliverable).not.toHaveBeenCalled();
  });
});
