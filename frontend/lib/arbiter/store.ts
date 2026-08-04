// store.ts — Supabase persistence for the arbiter flows (PRD §8, migration 006).
// All DB reads/writes for bounties/rubrics/submissions/verdicts/escalations live HERE so the
// API routes stay thin and the spend ledger (spend-ledger.ts) can trust `verdicts.release_tx`
// as the single source of truth for money that actually moved.

import { getSupabaseClient } from "../agent";
import type { RubricItem } from "./rubric";
import type { Verdict } from "./verdict-schema";

export type BountyStatus = "DRAFT" | "OPEN" | "SUBMITTED" | "JUDGED" | "RELEASED" | "REFUNDED" | "REFUSED";

export interface BountyRow {
  id: string;
  poster_id: string;
  worker_id: string;
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
  human_reviewed: number;
  overridden: number;
  override_rate: number;
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
  worker_id: string;
  brief: string;
  amount_usdc: number;
  deadline: string;
  rubric: RubricItem[];
}): Promise<{ bounty: BountyRow; rubric: RubricRow }> {
  const { data: b, error: be } = await db()
    .from("bounties")
    .insert({
      poster_id: input.poster_id,
      worker_id: input.worker_id,
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

export async function listBounties(): Promise<BountyRow[]> {
  const { data, error } = await db().from("bounties").select().order("created_at", { ascending: false }).limit(50);
  if (error) throw new Error(`list bounties: ${error.message}`);
  return (data ?? []) as BountyRow[];
}

export async function getAgentStats(): Promise<AgentStats> {
  const { data, error } = await db().from("agent_stats").select().single();
  return must(data, error, "agent_stats") as AgentStats;
}
