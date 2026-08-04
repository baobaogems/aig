// /app/api/judge/route.ts — F3: judge a SUBMITTED bounty. SSE stream (pattern from
// /api/agent/execute — ReadableStream.start() keeps the pipeline alive on Vercel).
//
// POST { bounty_id } → SSE events: judging → verdict → done | error
//
// THE GATE-2 GAP CLOSES HERE: the verdict row is persisted to Supabase in the same request
// that produced it, so the per-day spend ledger (verdicts.release_tx) counts every release.
// Persist-order safety: verdict row is written BEFORE any status/points side-effects; if the
// release happened (live T1), release_tx lands in the same insert.

import { NextRequest } from "next/server";
import { judgeAndSettle } from "@/lib/arbiter/run";
import { getBountyDetail, insertVerdict, updateBountyStatus, type BountyStatus } from "@/lib/arbiter/store";
import { awardBountyPoints } from "@/lib/points";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // one grade call (~15-25s) + optional on-chain release (~20s w/ retries)

export async function POST(req: NextRequest) {
  const { bounty_id } = await req.json();
  if (typeof bounty_id !== "string" || !bounty_id)
    return Response.json({ error: "bounty_id required" }, { status: 400 });

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
          release_tx: result.release?.txHash ?? null,
        });
        emit("verdict", {
          verdict_id: row.id, decision: v.decision, total_score: v.total_score,
          confidence: v.confidence, verdict_hash: result.judge.hash,
          release_tx: result.release?.txHash ?? null, settlement_note: result.settlementNote ?? null,
        });

        // Status: RELEASED only when USDC actually moved; REFUSE → REFUSED; everything else
        // (ESCALATE / FAIL / dry-run RELEASE) waits for a human → JUDGED.
        const status: BountyStatus = result.release ? "RELEASED" : v.decision === "REFUSE" ? "REFUSED" : "JUDGED";
        await updateBountyStatus(bounty.id, status);

        if (result.release) {
          // Real money moved → real points (F5). Dry-run never reaches here.
          await awardBountyPoints(bounty.worker_id, bounty.id, result.release.amountUsdc);
        }
        emit("done", { status });
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
