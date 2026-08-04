// /app/api/settle/route.ts — F5 tail: carry out a RELEASE verdict that has not settled yet
// (day-cap deferral at judge time, or a release send that died mid-flight). Idempotent:
// the contract only ever releases a bounty once, and we refuse when release_tx is recorded.
//
// POST { bounty_id } → { release_tx } | { note }

import { NextRequest } from "next/server";
import { getBountyDetail, setVerdictReleaseTx, updateBountyStatus } from "@/lib/arbiter/store";
import { isDryRun } from "@/lib/escrow";
import { awardBountyPoints } from "@/lib/points";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { bounty_id } = await req.json();
    if (typeof bounty_id !== "string" || !bounty_id)
      return Response.json({ error: "bounty_id required" }, { status: 400 });

    const detail = await getBountyDetail(bounty_id);
    if (!detail.verdict) return Response.json({ error: "no verdict yet — judge first" }, { status: 409 });
    if (detail.verdict.release_tx)
      return Response.json({ error: `already settled: ${detail.verdict.release_tx}` }, { status: 409 });

    // Only a RELEASE decision, or an APPROVE override, authorises settlement.
    const approved = detail.escalation?.poster_action === "APPROVE";
    if (detail.verdict.decision !== "RELEASE" && !approved)
      return Response.json({ error: `decision=${detail.verdict.decision} without poster APPROVE — nothing to settle` }, { status: 409 });

    if (isDryRun())
      return Response.json({ note: "DRY_RUN — settlement blocked, no USDC moved" });

    const { releaseEscrow } = await import("@/lib/escrow");
    const release = await releaseEscrow(bounty_id, detail.verdict.verdict_hash as `0x${string}`);
    await setVerdictReleaseTx(detail.verdict.id, release.txHash);
    await updateBountyStatus(bounty_id, "RELEASED");
    await awardBountyPoints(detail.bounty.worker_id, bounty_id, release.amountUsdc);
    return Response.json({ release_tx: release.txHash });
  } catch (err) {
    console.error("[API /settle]:", err);
    return Response.json({ error: err instanceof Error ? err.message : "unknown error" }, { status: 500 });
  }
}
