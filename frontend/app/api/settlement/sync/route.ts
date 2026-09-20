// /app/api/settlement/sync/route.ts — copy the chain's view of a bounty into the database.
//
// POST { bounty_id } → { changed, status }
//
// Two of v3's actions are permissionless and happen entirely on-chain: a worker calling
// `timeoutRelease` from their own wallet, and anyone calling `expireClaim`. The server is not
// in that loop by design — that is the whole point of those functions. So the database can
// legitimately be behind, and this is how it catches up.
//
// DIRECTION IS ONE-WAY: chain → database, never the reverse. The request body carries only a
// bounty id. Nothing a caller says about what happened is believed; we go and look.
// Consequently this is safe to leave open, and safe to call twice.

import { NextRequest } from "next/server";
import { getBounty } from "@/lib/escrow";
import { getBountyDetail, setVerdictSettlement, updateBountyStatus } from "@/lib/arbiter/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { bounty_id } = await req.json();
    if (typeof bounty_id !== "string" || !bounty_id)
      return Response.json({ error: "bounty_id required" }, { status: 400 });

    const detail = await getBountyDetail(bounty_id);
    const onChain = await getBounty(bounty_id);
    if (!onChain) return Response.json({ changed: false, status: detail.bounty.status, note: "chưa có trên chain" });

    let changed = false;
    let status = detail.bounty.status;

    if (onChain.settled && status !== "RELEASED") {
      // Settled without us: a timeoutRelease from the worker's own wallet. We do not know the
      // tx hash from a read, and inventing one would be worse than leaving it null — the
      // Settled event on-chain is the record, and worker_bps 10000 is what that path pays.
      await updateBountyStatus(bounty_id, "RELEASED");
      if (detail.verdict && !detail.verdict.release_tx) {
        await setVerdictSettlement(detail.verdict.id, "on-chain:timeoutRelease", 10_000);
      }
      status = "RELEASED";
      changed = true;
    } else if (onChain.refunded && status !== "REFUNDED") {
      await updateBountyStatus(bounty_id, "REFUNDED");
      status = "REFUNDED";
      changed = true;
    }

    return Response.json({ changed, status });
  } catch (err) {
    console.error("[API /settlement/sync]:", err);
    return Response.json({ error: err instanceof Error ? err.message : "unknown error" }, { status: 500 });
  }
}
