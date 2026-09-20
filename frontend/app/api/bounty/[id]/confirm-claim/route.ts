// /app/api/bounty/[id]/confirm-claim/route.ts — a worker says "I claimed it"; we go and look.
//
// POST { txHash? } → { ok, worker }
//
// Same stance as confirm-lock: worker_id is only ever written from an on-chain read. The
// chain already decided who won the race — this route copies that answer into the DB so the
// board can be listed without hitting an RPC for every row.
//
// Requires a session (you must be signed in as the wallet that claimed), but NOT a prior role
// on the bounty: before this call the caller has no role, which is the whole point.

import { NextRequest } from "next/server";
import { getBountyDetail, setBountyWorker } from "@/lib/arbiter/store";
import { getBounty, isDryRun } from "@/lib/escrow";
import { requireSession, sameAddress } from "@/lib/auth/require-role";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;

    const caller = requireSession(req);
    if (caller instanceof Response) return caller;

    const body = (await req.json().catch(() => ({}))) as { txHash?: unknown };
    const txHash = typeof body.txHash === "string" && body.txHash.startsWith("0x") ? body.txHash : "";

    const detail = await getBountyDetail(id);
    if (detail.bounty.status !== "OPEN")
      return Response.json({ error: `bounty is ${detail.bounty.status}, expected OPEN` }, { status: 409 });

    if (isDryRun()) {
      // No chain to consult. Record the claim so the flow stays walkable without money,
      // exactly as the rest of the dry-run path does.
      const won = await setBountyWorker(id, caller, txHash || "dry-run");
      return won
        ? Response.json({ ok: true, worker: caller, note: "DRY_RUN — đã nhận việc, không có giao dịch on-chain" })
        : Response.json({ error: "việc này đã có người nhận" }, { status: 409 });
    }

    const onChain = await getBounty(id);
    if (!onChain) return Response.json({ error: "không đọc được escrow trên chain" }, { status: 409 });
    if (onChain.worker === "0x0000000000000000000000000000000000000000")
      return Response.json({ error: "chain chưa ghi nhận ai nhận việc — giao dịch chưa vào block?" }, { status: 409 });

    if (!sameAddress(onChain.worker, caller))
      return Response.json(
        { error: `ví ${onChain.worker} đã nhận việc này trước bạn` },
        { status: 409 },
      );

    const won = await setBountyWorker(id, onChain.worker, txHash);
    if (!won) {
      // Someone else's confirm-claim wrote first. Not an error if the chain agrees it is them.
      const fresh = await getBountyDetail(id);
      if (sameAddress(fresh.bounty.worker_id, caller)) return Response.json({ ok: true, worker: caller });
      return Response.json({ error: "việc này đã có người nhận" }, { status: 409 });
    }
    return Response.json({ ok: true, worker: onChain.worker });
  } catch (err) {
    console.error("[API /bounty/confirm-claim]:", err);
    return Response.json({ error: err instanceof Error ? err.message : "unknown error" }, { status: 500 });
  }
}
