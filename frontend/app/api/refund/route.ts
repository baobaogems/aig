// /app/api/refund/route.ts — F4 tail: return locked USDC to the poster after the deadline.
// The REJECT path's counterpart to /api/settle: a rejected (or never-released) bounty must not
// strand its escrow. Idempotent: the contract refunds a bounty once, ever.
//
// POST { bounty_id } → { refund_tx } | { note }
//
// Server-side path only works for bounties POSTED by the admin wallet (the pilot's seed
// bounties) — the contract requires msg.sender == poster. Community posters refund from
// their own wallet in the UI using the same ABI.

import { NextRequest } from "next/server";
import { getBountyDetail, updateBountyStatus } from "@/lib/arbiter/store";
import { isDryRun } from "@/lib/escrow";
import { requirePoster } from "@/lib/auth/require-role";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // one on-chain refund + receipt wait (w/ RPC retries)

export async function POST(req: NextRequest) {
  try {
    const { bounty_id } = await req.json();
    if (typeof bounty_id !== "string" || !bounty_id)
      return Response.json({ error: "bounty_id required" }, { status: 400 });

    // The contract also requires msg.sender == poster; refusing here gives a readable error
    // instead of a reverted transaction.
    const gate = await requirePoster(req, bounty_id);
    if (gate instanceof Response) return gate;

    const detail = await getBountyDetail(bounty_id);
    const { bounty } = detail;

    // Redundant with the contract's own reverts, on purpose — a clear server error beats
    // a reverted transaction (same stance as releaseEscrow's pre-flight checks).
    if (bounty.status === "RELEASED" || detail.verdict?.release_tx)
      return Response.json({ error: "bounty was released — nothing to refund" }, { status: 409 });
    if (bounty.status === "REFUNDED")
      return Response.json({ error: "already refunded" }, { status: 409 });
    // v3's central rule, and the reason this file needed changing at all: once work has been
    // handed in, the poster can no longer take the money back on their own. They keep every
    // other option — approve, reject at the kill fee, object to a T1 — but not this one.
    // The contract refuses it too; this is the readable version of that revert.
    if (bounty.submitted_at)
      return Response.json(
        { error: "a submission exists — a unilateral refund is no longer possible. Approve it, or refuse it with a reason." },
        { status: 409 },
      );
    if (new Date(bounty.deadline).getTime() > Date.now())
      return Response.json(
        { error: `deadline not reached (${bounty.deadline}) — the contract only refunds after it` },
        { status: 409 },
      );

    if (isDryRun()) return Response.json({ note: "DRY_RUN — refund blocked, no USDC moved" });

    const { refundEscrow } = await import("@/lib/escrow");
    const refund = await refundEscrow(bounty_id);
    await updateBountyStatus(bounty_id, "REFUNDED");
    return Response.json({ refund_tx: refund.txHash });
  } catch (err) {
    console.error("[API /refund]:", err);
    return Response.json({ error: err instanceof Error ? err.message : "unknown error" }, { status: 500 });
  }
}
