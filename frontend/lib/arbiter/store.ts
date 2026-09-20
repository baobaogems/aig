// store.ts — Supabase persistence for the arbiter flows (PRD §8, migration 006).
// All DB reads/writes for bounties/rubrics/submissions/verdicts/escalations live HERE so the
// API routes stay thin and the spend ledger (spend-ledger.ts) can trust `verdicts.release_tx`
// as the single source of truth for money that actually moved.

import { getSupabaseClient } from "../agent";
import { computeOverrideStats } from "./override-rate";
import type { RubricItem } from "./rubric";
import type { Verdict } from "./verdict-schema";

export type BountyStatus = "DRAFT" | "OPEN" | "SUBMITTED" | "JUDGED" | "RELEASED" | "REFUNDED" | "REFUSED";

export interface BountyRow {
  id: string;
  poster_id: string;
  /** null while the bounty is open and nobody has claimed it. */
  worker_id: string | null;
  claim_tx?: string | null;
  brief: string;
  amount_usdc: number;
  deadline: string;
  status: BountyStatus;
  escrow_tx: string | null;
  created_at: string;
}

export interface RubricRow {
  id: string;
  bounty_id: string;
  items_json: RubricItem[];
  approved_at: string | null;
  frozen: boolean;
}

export interface SubmissionRow {
  id: string;
  bounty_id: string;
  content_snapshot: string;
  source_url: string | null;
  submitted_at: string;
}

export interface VerdictRow {
  id: string;
  submission_id: string;
  verdict_json: Verdict;
  decision: string;
  confidence: number;
  total_score: number;
  verdict_hash: string;
  release_tx: string | null;
  created_at: string;
}

export interface EscalationRow {
  id: string;
  verdict_id: string;
  poster_action: "APPROVE" | "REJECT";
  acted_at: string;
  note: string | null;
}

export interface AgentStats {
  total_verdicts: number;
  t1_auto_release: number;
  refused: number;
  /** Verdicts the arbiter escalated. Recomputed — see getAgentStats. */
  human_reviewed: number;
  /** Poster decisions that went AGAINST a decisive verdict. Recomputed — see getAgentStats. */
  overridden: number;
  override_rate: number;
  /** Decisive verdicts (RELEASE/FAIL) a poster answered — the override denominator. */
  decisive_reviewed: number;
}

function db() {
  return getSupabaseClient();
}

/** Throw with a readable prefix — routes convert to HTTP 500/4xx. */
function must<T>(data: T | null, error: { message: string } | null, op: string): T {
  if (error) throw new Error(`${op}: ${error.message}`);
  if (data === null) throw new Error(`${op}: no row returned`);
  return data;
}

// ---------------- bounties + rubrics (F1) ----------------

export async function createBountyWithRubric(input: {
  poster_id: string;
  /** null = open to whoever claims it first (the normal case since Phase 04). */
  worker_id: string | null;
  brief: string;
  amount_usdc: number;
  deadline: string;
  rubric: RubricItem[];
}): Promise<{ bounty: BountyRow; rubric: RubricRow }> {
  const { data: b, error: be } = await db()
    .from("bounties")
    .insert({
      poster_id: input.poster_id,
      worker_id: input.worker_id ?? null,
      brief: input.brief,
      amount_usdc: input.amount_usdc,
      deadline: input.deadline,
      status: "DRAFT",
    })
    .select()
    .single();
  const bounty = must(b, be, "insert bounty") as BountyRow;

  const { data: r, error: re } = await db()
    .from("rubrics")
    .insert({ bounty_id: bounty.id, items_json: input.rubric, frozen: false })
    .select()
    .single();
  return { bounty, rubric: must(r, re, "insert rubric") as RubricRow };
}

/**
 * Record the on-chain claim. Conditional on worker_id still being null, so two people
 * confirming at once cannot overwrite each other — the loser gets zero rows and can re-read
 * the chain to see who actually won.
 */
export async function setBountyWorker(bountyId: string, worker: string, claimTx: string): Promise<boolean> {
  const { data, error } = await db()
    .from("bounties")
    .update({ worker_id: worker, claim_tx: claimTx })
    .eq("id", bountyId)
    .is("worker_id", null)
    .select("id");
  if (error) throw new Error(`set bounty worker: ${error.message}`);
  return (data?.length ?? 0) === 1;
}

/** Which slice of the board a reader wants. */
export type BountyView = "all" | "marketplace" | "mine-posted" | "mine-claimed";

/** Freeze the rubric (one-way) and move the bounty DRAFT → OPEN. */
export async function freezeRubric(bountyId: string, escrowTx?: string): Promise<void> {
  const { error: re } = await db()
    .from("rubrics")
    .update({ frozen: true, approved_at: new Date().toISOString() })
    .eq("bounty_id", bountyId);
  if (re) throw new Error(`freeze rubric: ${re.message}`);

  const { error: be } = await db()
    .from("bounties")
    .update({ status: "OPEN", ...(escrowTx ? { escrow_tx: escrowTx } : {}) })
    .eq("id", bountyId)
    .eq("status", "DRAFT");
  if (be) throw new Error(`open bounty: ${be.message}`);
}

export async function updateBountyStatus(bountyId: string, status: BountyStatus): Promise<void> {
  const { error } = await db().from("bounties").update({ status }).eq("id", bountyId);
  if (error) throw new Error(`update bounty status: ${error.message}`);
}

// ---------------- submissions (F2 — snapshot at submit time) ----------------

export async function insertSubmission(input: {
  bounty_id: string;
  content_snapshot: string;
  source_url?: string | null;
}): Promise<SubmissionRow> {
  const { data, error } = await db()
    .from("submissions")
    .insert({ bounty_id: input.bounty_id, content_snapshot: input.content_snapshot, source_url: input.source_url ?? null })
    .select()
    .single();
  return must(data, error, "insert submission") as SubmissionRow;
}

// ---------------- verdicts (F3 — the row the spend ledger counts) ----------------

export async function insertVerdict(input: {
  submission_id: string;
  verdict: Verdict;
  verdict_hash: string;
  release_tx?: string | null;
}): Promise<VerdictRow> {
  const { data, error } = await db()
    .from("verdicts")
    .insert({
      submission_id: input.submission_id,
      verdict_json: input.verdict,
      decision: input.verdict.decision,
      confidence: input.verdict.confidence,
      total_score: input.verdict.total_score,
      verdict_hash: input.verdict_hash,
      release_tx: input.release_tx ?? null,
    })
    .select()
    .single();
  return must(data, error, "insert verdict") as VerdictRow;
}

export async function setVerdictReleaseTx(verdictId: string, releaseTx: string): Promise<void> {
  const { error } = await db().from("verdicts").update({ release_tx: releaseTx }).eq("id", verdictId);
  if (error) throw new Error(`set release_tx: ${error.message}`);
}

// ---------------- escalations (F4 — feeds override_rate) ----------------

export async function insertEscalation(input: {
  verdict_id: string;
  poster_action: "APPROVE" | "REJECT";
  note?: string | null;
}): Promise<EscalationRow> {
  const { data, error } = await db()
    .from("escalations")
    .insert({ verdict_id: input.verdict_id, poster_action: input.poster_action, note: input.note ?? null })
    .select()
    .single();
  return must(data, error, "insert escalation") as EscalationRow;
}

// ---------------- reads (page + stats) ----------------

export interface BountyDetail {
  bounty: BountyRow;
  rubric: RubricRow | null;
  submission: SubmissionRow | null;
  verdict: VerdictRow | null;
  escalation: EscalationRow | null;
}

export async function getBountyDetail(bountyId: string): Promise<BountyDetail> {
  const { data: b, error: be } = await db().from("bounties").select().eq("id", bountyId).single();
  const bounty = must(b, be, "get bounty") as BountyRow;

  const { data: r } = await db().from("rubrics").select().eq("bounty_id", bountyId).maybeSingle();
  // MVP is one submission per bounty; take the latest defensively.
  const { data: s } = await db()
    .from("submissions").select().eq("bounty_id", bountyId)
    .order("submitted_at", { ascending: false }).limit(1).maybeSingle();
  const { data: v } = s
    ? await db().from("verdicts").select().eq("submission_id", s.id)
        .order("created_at", { ascending: false }).limit(1).maybeSingle()
    : { data: null };
  const { data: e } = v
    ? await db().from("escalations").select().eq("verdict_id", v.id).maybeSingle()
    : { data: null };

  return {
    bounty,
    rubric: (r as RubricRow) ?? null,
    submission: (s as SubmissionRow) ?? null,
    verdict: (v as VerdictRow) ?? null,
    escalation: (e as EscalationRow) ?? null,
  };
}

export async function listBounties(view: BountyView = "all", address?: string | null): Promise<BountyRow[]> {
  let q = db().from("bounties").select().order("created_at", { ascending: false }).limit(50);

  if (view === "marketplace") {
    // The board shows work that is funded and still in time — including bounties somebody has
    // already taken. Filtering those out made the board look empty whenever the community was
    // busiest, and hid the one signal that tells a newcomer this thing is actually used.
    // Whether a row can be CLAIMED is a separate question, answered per-card by bountyState().
    //
    // Past the deadline it drops off: the contract refuses claim() there, so showing it would
    // only offer a button that reverts.
    q = q.in("status", ["OPEN", "SUBMITTED"]).gt("deadline", new Date().toISOString());
  } else if (view === "mine-posted") {
    if (!address) return [];
    q = q.ilike("poster_id", address);
  } else if (view === "mine-claimed") {
    if (!address) return [];
    q = q.ilike("worker_id", address);
  }

  const { data, error } = await q;
  if (error) throw new Error(`list bounties: ${error.message}`);
  return (data ?? []) as BountyRow[];
}

/**
 * The agent_stats view still supplies the plain counts, but its override figures are
 * replaced here. The view counts every REJECT as an override over every recorded action
 * ("MVP simplification", its own comment) — which billed three answers to ESCALATE
 * questions as two overturned verdicts. computeOverrideStats holds the real definition.
 *
 * Read-only, and the view is left untouched: the raw counts it computes are still correct,
 * and rewriting a live view is a migration this does not need.
 */
export async function getAgentStats(): Promise<AgentStats> {
  const { data, error } = await db().from("agent_stats").select().single();
  const view = must(data, error, "agent_stats") as AgentStats;

  const { data: verdicts, error: ve } = await db().from("verdicts").select("id,decision");
  if (ve) throw new Error(`agent_stats verdicts: ${ve.message}`);
  const { data: escalations, error: ee } = await db().from("escalations").select("verdict_id,poster_action");
  if (ee) throw new Error(`agent_stats escalations: ${ee.message}`);

  const actionByVerdict = new Map(
    (escalations ?? []).map((e) => [e.verdict_id as string, e.poster_action as "APPROVE" | "REJECT"]),
  );
  const stats = computeOverrideStats(
    (verdicts ?? []).map((v) => ({
      decision: v.decision as string,
      posterAction: actionByVerdict.get(v.id as string) ?? null,
    })),
  );

  return {
    ...view,
    human_reviewed: stats.escalatedToHuman,
    overridden: stats.overturned,
    decisive_reviewed: stats.decisiveReviewed,
    override_rate: stats.decisiveReviewed === 0 ? 0 : stats.overturned / stats.decisiveReviewed,
  };
}
