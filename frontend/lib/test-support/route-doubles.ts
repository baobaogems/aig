// =============================================================================
// route-doubles.ts — the in-memory stand-ins that let route handlers run for real.
//
// Why this file exists: 83 tests passed while POST /api/bounty was returning 400 to every
// caller for half a day, because no test ever called a route handler. Tests that only read
// the source catch "a stale line was left behind"; they cannot catch "the handler rejects
// valid input". These doubles close that gap.
//
// What is REAL in a route test built on this file:
//   - the handler itself, its validation order, its status codes
//   - the session cookie (real HMAC via sealSession) and the whole require-role gate
//   - submission-window, bounty-view, and every other pure rule the handler calls
//
// What is DOUBLED (and nothing else):
//   - Supabase   → these maps
//   - the LLM    → fixed rubrics/verdicts, so a test asserts on the handler, not on a model
//   - the chain  → judgeAndSettle's release is whatever the test says it is
//
// Doubles imitate the CONTRACT of the real module, never its convenience: unknown bounty id
// throws here exactly as store.getBountyDetail throws, because require-role's 404 depends on
// that throw and a forgiving double would hide it.
// =============================================================================

import type { BountyRow, BountyDetail, BountyStatus, RubricRow, SubmissionRow, VerdictRow } from "@/lib/arbiter/store";

/** A secret only these tests use. Set before any module that reads it is imported. */
export const TEST_SESSION_SECRET = "test-secret-at-least-32-characters-long-xxxx";

export const POSTER = "0x0809a724862D6636874809775Ba3623080c5ceF8";
export const WORKER = "0xF4780Ce1B4C5Ff5aB62cfF1A1D2Dc0e46C6De321";
export const STRANGER = "0x1111111111111111111111111111111111111111";

interface State {
  bounties: Map<string, BountyRow>;
  rubrics: Map<string, RubricRow>;
  submissions: Map<string, SubmissionRow>;
  verdicts: Map<string, VerdictRow>;
  /** Everything written through the doubles, in order — assertions read this. */
  writes: Array<{ op: string; args: unknown }>;
  /** Rate-limit rows, keyed by bucket. The limiter counts these for real. */
  rateRows: Array<{ bucket: string; created_at: string }>;
}

export const state: State = {
  bounties: new Map(), rubrics: new Map(), submissions: new Map(),
  verdicts: new Map(), writes: [], rateRows: [],
};

export function resetState(): void {
  state.bounties.clear(); state.rubrics.clear(); state.submissions.clear();
  state.verdicts.clear(); state.writes = []; state.rateRows = [];
}

let seq = 0;
const nextId = (p: string) => `${p}-${++seq}`;

export function seedBounty(over: Partial<BountyRow> = {}, extra: {
  rubric?: Partial<RubricRow> | null;
  submission?: Partial<SubmissionRow> | null;
  verdict?: Partial<VerdictRow> | null;
} = {}): BountyRow {
  const id = over.id ?? nextId("bounty");
  const bounty: BountyRow = {
    id, poster_id: POSTER.toLowerCase(), worker_id: WORKER.toLowerCase(),
    brief: "Viết một bài giới thiệu sản phẩm dài khoảng 300 chữ.",
    amount_usdc: 5, deadline: new Date(Date.now() + 86_400_000).toISOString(),
    status: "OPEN" as BountyStatus, escrow_tx: null, created_at: new Date().toISOString(),
    ...over,
  };
  state.bounties.set(id, bounty);

  if (extra.rubric !== null) {
    state.rubrics.set(id, {
      id: nextId("rubric"), bounty_id: id, frozen: true, approved_at: new Date().toISOString(),
      items_json: [
        { item_id: "r1", criterion: "Đúng chủ đề", weight: 50 },
        { item_id: "r2", criterion: "Đủ độ dài", weight: 50 },
      ],
      ...extra.rubric,
    });
  }
  if (extra.submission) {
    const sid = extra.submission.id ?? nextId("submission");
    state.submissions.set(id, {
      id: sid, bounty_id: id, content_snapshot: "nội dung bài nộp đủ dài để chấm",
      source_url: null, submitted_at: new Date().toISOString(), ...extra.submission,
    });
  }
  if (extra.verdict) {
    state.verdicts.set(id, {
      id: nextId("verdict"), submission_id: state.submissions.get(id)?.id ?? "none",
      verdict_json: {} as VerdictRow["verdict_json"], decision: "FAIL", confidence: 80,
      total_score: 40, verdict_hash: "0xhash", release_tx: null,
      created_at: new Date().toISOString(), ...extra.verdict,
    });
  }
  return bounty;
}

// ---------------------------------------------------------------- store double

function detailOf(bountyId: string): BountyDetail {
  const bounty = state.bounties.get(bountyId);
  // The real store throws on an unknown id; require-role turns that throw into a 404 that
  // deliberately does not distinguish "missing" from "not yours".
  if (!bounty) throw new Error(`bounty not found: ${bountyId}`);
  return {
    bounty,
    rubric: state.rubrics.get(bountyId) ?? null,
    submission: state.submissions.get(bountyId) ?? null,
    verdict: state.verdicts.get(bountyId) ?? null,
    escalation: null,
  };
}

export const storeModule = {
  async getBountyDetail(bountyId: string) { return detailOf(bountyId); },

  async createBountyWithRubric(input: Record<string, unknown>) {
    state.writes.push({ op: "createBountyWithRubric", args: input });
    const bounty = seedBounty({
      poster_id: String(input.poster_id),
      worker_id: (input.worker_id as string | null) ?? null,
      brief: String(input.brief),
      amount_usdc: Number(input.amount_usdc),
      deadline: String(input.deadline),
      status: "DRAFT",
    }, { rubric: { frozen: false, approved_at: null, items_json: input.rubric as RubricRow["items_json"] } });
    return { bounty, rubric: state.rubrics.get(bounty.id)! };
  },

  async insertSubmission(input: { bounty_id: string; content_snapshot: string; source_url: string | null }) {
    state.writes.push({ op: "insertSubmission", args: input });
    const row: SubmissionRow = {
      id: nextId("submission"), bounty_id: input.bounty_id,
      content_snapshot: input.content_snapshot, source_url: input.source_url,
      submitted_at: new Date().toISOString(),
    };
    state.submissions.set(input.bounty_id, row);
    return row;
  },

  async insertVerdict(input: Record<string, unknown>) {
    state.writes.push({ op: "insertVerdict", args: input });
    const row = {
      id: nextId("verdict"), submission_id: String(input.submission_id),
      verdict_json: input.verdict, decision: (input.verdict as { decision: string }).decision,
      confidence: (input.verdict as { confidence: number }).confidence,
      total_score: (input.verdict as { total_score: number }).total_score,
      verdict_hash: String(input.verdict_hash), release_tx: (input.release_tx as string | null) ?? null,
      created_at: new Date().toISOString(),
    } as unknown as VerdictRow;
    return row;
  },

  async updateBountyStatus(bountyId: string, status: BountyStatus) {
    state.writes.push({ op: "updateBountyStatus", args: { bountyId, status } });
    const b = state.bounties.get(bountyId);
    if (b) state.bounties.set(bountyId, { ...b, status });
  },

  async listBounties() { return [...state.bounties.values()]; },
  async getAgentStats() { return { total_verdicts: state.verdicts.size, override_rate: 0 }; },
};

// ---------------------------------------------------------------- supabase double
//
// Only what rate-limit.ts uses: a counted select over `rate_limits`, and an insert.
// Everything else throws rather than returning a plausible-looking empty result.

export const supabaseDouble = {
  from(table: string) {
    if (table !== "rate_limits") throw new Error(`supabaseDouble: unexpected table ${table}`);
    let bucket = "";
    let cutoff = "";
    const q = {
      select: () => q,
      eq: (_col: string, v: string) => { bucket = v; return q; },
      gte: (_col: string, v: string) => { cutoff = v; return q; },
      then: (resolve: (r: { count: number; error: null }) => void) => {
        const count = state.rateRows.filter((r) => r.bucket === bucket && r.created_at >= cutoff).length;
        resolve({ count, error: null });
      },
      insert: (row: { bucket: string }) => {
        state.rateRows.push({ bucket: row.bucket, created_at: new Date().toISOString() });
        return Promise.resolve({ error: null });
      },
    };
    return q;
  },
};
