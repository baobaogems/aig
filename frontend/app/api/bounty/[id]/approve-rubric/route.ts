// /app/api/bounty/[id]/approve-rubric/route.ts — F1 tail: poster approves the rubric.
//
// POST → { ok, note, lock? }
//
// What changed in Phase 03: the server no longer locks the money. The poster signs
// createBounty from their OWN wallet, so the escrow's `poster` is the person who actually
// owns the funds — previously it was the AIG server wallet paying on their behalf, which
// made every bounty a withdrawal from one shared pot.
//
// So this route does the off-chain half only:
//   dry-run → freeze the rubric, open the bounty, no chain at all
//   live    → freeze NOTHING yet; hand back the parameters the client must sign.
//             /confirm-lock finishes the job once the chain says the money is really there.

import { NextRequest } from "next/server";
import { freezeRubric, getBountyDetail } from "@/lib/arbiter/store";
import { isDryRun } from "@/lib/escrow";
import { requirePoster } from "@/lib/auth/require-role";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;

    // Freezing the rubric is what commits the money. Only the poster may do it.
    const gate = await requirePoster(req, id);
    if (gate instanceof Response) return gate;

    const detail = await getBountyDetail(id);

    if (detail.bounty.status !== "DRAFT")
      return Response.json({ error: `bounty is ${detail.bounty.status}, expected DRAFT` }, { status: 409 });
    if (!detail.rubric) return Response.json({ error: "bounty has no rubric" }, { status: 409 });
    if (detail.rubric.frozen) return Response.json({ error: "rubric already frozen" }, { status: 409 });

    if (isDryRun()) {
      await freezeRubric(id);
      return Response.json({ ok: true, note: "DRY_RUN — rubric frozen, bounty open, no USDC locked" });
    }

    // Live: nothing is committed until the poster's own transaction lands. Returning the
    // parameters (rather than letting the client invent them) keeps the amount and deadline
    // the ones the rubric was approved against.
    return Response.json({
      ok: true,
      note: "Sign two transactions to lock the USDC. The rubric freezes only after the funds reach escrow.",
      lock: {
        bountyId: id,
        worker: detail.bounty.worker_id, // null = open bounty, anyone may claim
        amountUsdc: Number(detail.bounty.amount_usdc),
        deadlineUnix: Math.floor(new Date(detail.bounty.deadline).getTime() / 1000),
      },
    });
  } catch (err) {
    console.error("[API /bounty/approve-rubric]:", err);
    return Response.json({ error: err instanceof Error ? err.message : "unknown error" }, { status: 500 });
  }
}
