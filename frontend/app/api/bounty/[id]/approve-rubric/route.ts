// /app/api/bounty/[id]/approve-rubric/route.ts — F1 tail: poster approves → rubric FREEZES → OPEN.
//
// POST → { ok, escrow_tx? , note }
// Money: when DRY_RUN=false the server wallet locks the USDC (seed-bounty path,
// lib/escrow-poster.ts). In dry-run the bounty opens with no on-chain lock — the whole
// flow stays walkable without money, per plan.

import { NextRequest } from "next/server";
import { freezeRubric, getBountyDetail } from "@/lib/arbiter/store";
import { isDryRun } from "@/lib/escrow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // on-chain approve+create (live mode) can take ~30s with RPC retries

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const detail = await getBountyDetail(id);

    if (detail.bounty.status !== "DRAFT")
      return Response.json({ error: `bounty is ${detail.bounty.status}, expected DRAFT` }, { status: 409 });
    if (!detail.rubric) return Response.json({ error: "bounty has no rubric" }, { status: 409 });
    if (detail.rubric.frozen) return Response.json({ error: "rubric already frozen" }, { status: 409 });

    if (isDryRun()) {
      await freezeRubric(id);
      return Response.json({ ok: true, note: "DRY_RUN — rubric frozen, bounty OPEN, no USDC locked" });
    }

    // Live: lock the USDC before opening. Dynamic import keeps the money layer out of dry-run.
    const { createSeedBounty } = await import("@/lib/escrow-poster");
    const deadlineUnix = Math.floor(new Date(detail.bounty.deadline).getTime() / 1000);
    const lock = await createSeedBounty(
      id,
      detail.bounty.worker_id as `0x${string}`,
      Number(detail.bounty.amount_usdc),
      deadlineUnix,
    );
    await freezeRubric(id, lock.createTxHash);
    return Response.json({ ok: true, escrow_tx: lock.createTxHash, note: "USDC locked in escrow" });
  } catch (err) {
    console.error("[API /bounty/approve-rubric]:", err);
    return Response.json({ error: err instanceof Error ? err.message : "unknown error" }, { status: 500 });
  }
}
