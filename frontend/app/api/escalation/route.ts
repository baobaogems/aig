// /app/api/escalation/route.ts — F4: poster acts on a T2/T3 verdict.
//
// POST { verdict_id, bounty_id, poster_action: APPROVE|REJECT, note? }
//   APPROVE → release the escrow (live) and mark RELEASED; dry-run records the action only.
//   REJECT  → recorded; bounty stays JUDGED (refund is the poster's on-chain call after deadline).
// EVERY action lands in `escalations` — that table IS the override_rate (agent_stats view).

import { NextRequest } from "next/server";
import { getBountyDetail, insertEscalation, setVerdictReleaseTx, updateBountyStatus } from "@/lib/arbiter/store";
import { isDryRun } from "@/lib/escrow";
import { awardBountyPoints } from "@/lib/points";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // APPROVE in live mode waits for the release receipt

export async function POST(req: NextRequest) {
  try {
    const { verdict_id, bounty_id, poster_action, note } = await req.json();

    if (typeof verdict_id !== "string" || !verdict_id)
      return Response.json({ error: "verdict_id required" }, { status: 400 });
    if (typeof bounty_id !== "string" || !bounty_id)
      return Response.json({ error: "bounty_id required" }, { status: 400 });
    if (poster_action !== "APPROVE" && poster_action !== "REJECT")
      return Response.json({ error: "poster_action must be APPROVE or REJECT" }, { status: 400 });

    const detail = await getBountyDetail(bounty_id);
    if (!detail.verdict || detail.verdict.id !== verdict_id)
      return Response.json({ error: "verdict not found for this bounty" }, { status: 404 });
    if (detail.escalation)
      return Response.json({ error: `already acted: ${detail.escalation.poster_action}` }, { status: 409 });
    if (detail.bounty.status !== "JUDGED")
      return Response.json({ error: `bounty is ${detail.bounty.status}, expected JUDGED` }, { status: 409 });

    // Record the human action FIRST — the override stat must survive a failed release.
    const escalation = await insertEscalation({ verdict_id, poster_action, note: note ?? null });

    if (poster_action === "REJECT") {
      // Money stays locked; poster refunds on-chain after the deadline (PRD F4).
      return Response.json({ escalation, note: "recorded — bounty stays JUDGED; refund after deadline is on-chain" });
    }

    if (isDryRun()) {
      return Response.json({ escalation, note: "DRY_RUN — approval recorded, no USDC moved" });
    }

    const { releaseEscrow } = await import("@/lib/escrow");
    const release = await releaseEscrow(bounty_id, detail.verdict.verdict_hash as `0x${string}`);
    await setVerdictReleaseTx(verdict_id, release.txHash); // ledger counts it from here
    await updateBountyStatus(bounty_id, "RELEASED");
    await awardBountyPoints(detail.bounty.worker_id, bounty_id, release.amountUsdc);
    return Response.json({ escalation, release_tx: release.txHash });
  } catch (err) {
    console.error("[API /escalation]:", err);
    return Response.json({ error: err instanceof Error ? err.message : "unknown error" }, { status: 500 });
  }
}
