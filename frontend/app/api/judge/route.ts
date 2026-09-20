// /app/api/judge/route.ts — F3: judge a SUBMITTED bounty. SSE stream (pattern from
// /api/agent/execute — ReadableStream.start() keeps the pipeline alive on Vercel).
//
// POST { bounty_id } → SSE events: judging → verdict → done | error
//
// THE GATE-2 GAP CLOSES HERE: the verdict row is persisted to Supabase in the same request
// that produced it, so the per-day spend ledger (verdicts.release_tx) counts every release.
//
// SINCE v3 THIS ROUTE MOVES NO MONEY. A plausible verdict (T1/T2) records the submission
// on-chain, which shuts the poster's unilateral refund and starts their window. Payment is a
// separate, later act — /api/settlement/* or /api/escalation.
//
// `markSubmitted` is not an afterthought that can be skipped: without it the worker has no
// `timeoutRelease`, which is their only right that does not depend on this server being
// alive. So a failed mark is an error the caller sees, never a silent "done".

import { NextRequest } from "next/server";
import { judgeAndSettle } from "@/lib/arbiter/run";
import {
  getBountyDetail, insertVerdict, markBountySubmitted, updateBountyStatus, type BountyStatus,
} from "@/lib/arbiter/store";
import { requireParty } from "@/lib/auth/require-role";
import { LIMIT_JUDGE, enforceRateLimit } from "@/lib/auth/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // one grade call (~15-25s) + optional on-chain release (~20s w/ retries)

export async function POST(req: NextRequest) {
  const { bounty_id } = await req.json();
  if (typeof bounty_id !== "string" || !bounty_id)
    return Response.json({ error: "bounty_id required" }, { status: 400 });

  // Judging costs LLM tokens and can release USDC. Either party to the bounty may trigger it;
  // a passer-by may not.
  const gate = await requireParty(req, bounty_id);
  if (gate instanceof Response) return gate;

  const limited = await enforceRateLimit("judge", gate, LIMIT_JUDGE);
  if (limited) return limited;

  const detail = await getBountyDetail(bounty_id);
  if (detail.bounty.status !== "SUBMITTED")
    return Response.json({ error: `bounty is ${detail.bounty.status}, expected SUBMITTED` }, { status: 409 });
  if (!detail.rubric?.frozen)
    return Response.json({ error: "rubric not frozen — approve it first (F1)" }, { status: 409 });
  if (!detail.submission)
    return Response.json({ error: "no submission snapshot found" }, { status: 409 });
  if (detail.verdict)
    return Response.json({ error: "submission already judged" }, { status: 409 });

  const { rubric, submission, bounty } = detail;
  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      let closed = false;
      const emit = (event: string, data: object) => {
        if (closed) return;
        try {
          controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
        }
      };
      try {
        emit("judging", { bounty_id, rubric_items: rubric.items_json.length });

        const result = await judgeAndSettle({
          bountyId: bounty.id,
          escrowVersion: bounty.escrow_version,
          submissionId: submission.id,
          brief: bounty.brief,
          rubric: rubric.items_json,
          deliverable: submission.content_snapshot,
          amountUsdc: Number(bounty.amount_usdc),
        });
        const v = result.judge.verdict;

        // Persist FIRST — the ledger and stats must see this verdict even if later steps fail.
        const row = await insertVerdict({
          submission_id: submission.id,
          verdict: v,
          verdict_hash: result.judge.hash,
          release_tx: null,
        });

        // The clock only exists in the database once it exists on-chain, never the other way
        // round: a window the contract does not honour would be a promise we cannot keep.
        if (result.clockStarted) await markBountySubmitted(bounty.id, new Date().toISOString());

        emit("verdict", {
          verdict_id: row.id, decision: v.decision, total_score: v.total_score,
          confidence: v.confidence, verdict_hash: result.judge.hash,
          clock_started: result.clockStarted, settlement_note: result.settlementNote ?? null,
        });

        // No payout happens here any more, so no bounty leaves this route RELEASED.
        // REFUSE closes it; everything else waits for a person or for the clock.
        const status: BountyStatus = v.decision === "REFUSE" ? "REFUSED" : "JUDGED";
        await updateBountyStatus(bounty.id, status);

        emit("done", { status, clock_started: result.clockStarted });
      } catch (err) {
        console.error("[API /judge]:", err);
        emit("error", { message: err instanceof Error ? err.message : String(err) });
      } finally {
        if (!closed) {
          try { controller.close(); } catch { /* already closed */ }
        }
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}
