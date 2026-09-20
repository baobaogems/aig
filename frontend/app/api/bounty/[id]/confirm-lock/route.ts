// /app/api/bounty/[id]/confirm-lock/route.ts — the poster says "I signed it"; we go and look.
//
// POST { txHash? } → { ok, escrow_tx }
//
// The client is not believed. The server reads getBounty() straight from the chain and only
// opens the bounty when the escrow record matches what was approved: the right poster, the
// right amount, the right deadline. A fabricated txHash proves nothing and changes nothing.
//
// Idempotent on purpose: the transaction can land while the browser is closing. Calling this
// again — from a "check again" button, or a later page load — finishes the job.

import { NextRequest } from "next/server";
import { freezeRubric, getBountyDetail } from "@/lib/arbiter/store";
import { getBounty, isDryRun, usdcToUnits } from "@/lib/escrow";
import { requirePoster, sameAddress } from "@/lib/auth/require-role";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // an on-chain read behind RPC retries

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;

    const caller = await requirePoster(req, id);
    if (caller instanceof Response) return caller;

    // Read the body once; a missing or malformed one is fine, the tx hash is only bookkeeping.
    const body = (await req.json().catch(() => ({}))) as { txHash?: unknown };
    const txHash = typeof body.txHash === "string" && body.txHash.startsWith("0x") ? body.txHash : undefined;

    if (isDryRun())
      return Response.json({ error: "DRY_RUN — không có tiền on-chain để xác nhận" }, { status: 409 });

    const detail = await getBountyDetail(id);
    if (detail.bounty.status === "OPEN")
      return Response.json({ ok: true, escrow_tx: detail.bounty.escrow_tx, note: "đã mở từ trước" });
    if (detail.bounty.status !== "DRAFT")
      return Response.json({ error: `bounty is ${detail.bounty.status}, expected DRAFT` }, { status: 409 });

    const onChain = await getBounty(id);
    if (!onChain || onChain.poster === "0x0000000000000000000000000000000000000000")
      return Response.json({ error: "chưa thấy escrow trên chain — giao dịch chưa vào block?" }, { status: 409 });

    // Three things must agree, or the rubric does not freeze. Each mismatch is its own
    // message: "something went wrong" would leave the poster with money locked and no idea why.
    if (!sameAddress(onChain.poster, caller))
      return Response.json(
        { error: `escrow do ví khác khoá (${onChain.poster}), không phải ví đang đăng nhập` },
        { status: 409 },
      );
    const expected = usdcToUnits(Number(detail.bounty.amount_usdc));
    if (onChain.amount !== expected)
      return Response.json(
        { error: `số tiền on-chain (${onChain.amount}) khác số đã duyệt (${expected})` },
        { status: 409 },
      );
    const expectedDeadline = Math.floor(new Date(detail.bounty.deadline).getTime() / 1000);
    if (Number(onChain.deadline) !== expectedDeadline)
      return Response.json(
        { error: `hạn chót on-chain khác hạn đã duyệt` },
        { status: 409 },
      );

    await freezeRubric(id, txHash);
    return Response.json({ ok: true, escrow_tx: txHash ?? null, note: "USDC đã vào escrow, rubric đóng băng, bounty mở" });
  } catch (err) {
    console.error("[API /bounty/confirm-lock]:", err);
    return Response.json({ error: err instanceof Error ? err.message : "unknown error" }, { status: 500 });
  }
}
