// /app/api/settlement/object/route.ts — the poster's answer to a T1 verdict.
//
// POST { bounty_id, note } → settlement outcome
//
// The arbiter judged the work good enough to pay for. v2 acted on that inside the judging
// request, so the poster learned about it after the money was gone. Now they get a window,
// and inside it they can stop the full payment — at a price.
//
// The price is half the escrow, and it is deliberately steep: objecting to work the arbiter
// scored highly should hurt, or the objection button becomes a free "no" and we are back to
// v2. It is not free-of-charge dissent, and it is not impossible either, because the arbiter
// is sometimes wrong and a poster with no recourse at all is how this product loses the
// people who fund it.
//
// Outside the window this returns 409: past that point the silence has already spoken.

import { NextRequest } from "next/server";
import { getBountyDetail, insertEscalation } from "@/lib/arbiter/store";
import { T1_OBJECTION_BPS } from "@/lib/arbiter/kill-fee";
import { settlementState } from "@/lib/arbiter/settlement-clock";
import { settleBounty } from "@/lib/arbiter/settle-bounty";
import { decideTier } from "@/lib/arbiter/tiers";
import { requirePoster } from "@/lib/auth/require-role";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { bounty_id, note } = await req.json();
    if (typeof bounty_id !== "string" || !bounty_id)
      return Response.json({ error: "bounty_id required" }, { status: 400 });

    const gate = await requirePoster(req, bounty_id);
    if (gate instanceof Response) return gate;

    const detail = await getBountyDetail(bounty_id);
    const { bounty, verdict } = detail;
    if (!verdict) return Response.json({ error: "no grading result to object to yet" }, { status: 409 });
    if (verdict.release_tx)
      return Response.json({ error: `already paid out: ${verdict.release_tx}` }, { status: 409 });
    if (detail.escalation)
      return Response.json({ error: `already handled: ${detail.escalation.poster_action}` }, { status: 409 });

    // An objection must say what was wrong, against the rubric frozen before anyone claimed
    // the job. Unanswerable rejections are what the whole mechanism exists to discourage.
    if (typeof note !== "string" || note.trim().length < 10)
      return Response.json({ error: "an objection needs a reason (at least 10 characters)" }, { status: 400 });

    const tier = decideTier({
      totalScore: verdict.total_score,
      confidence: verdict.confidence,
      outOfScope: verdict.decision === "REFUSE",
    }).tier;
    if (tier !== "T1")
      return Response.json(
        { error: "only an automatic (T1) result can be objected to; use /api/escalation for this case" },
        { status: 409 },
      );

    const clock = settlementState({
      tier,
      submittedAtMs: bounty.submitted_at ? new Date(bounty.submitted_at).getTime() : null,
      resolved: false,
      nowMs: Date.now(),
    });
    if (clock.phase !== "objection")
      return Response.json(
        { error: "the objection window has closed — the automatic result now stands" },
        { status: 409 },
      );

    await insertEscalation({ verdict_id: verdict.id, poster_action: "OBJECT", note: note.trim() });
    const outcome = await settleBounty(detail, T1_OBJECTION_BPS, "poster OBJECT (T1)");
    return Response.json(outcome);
  } catch (err) {
    console.error("[API /settlement/object]:", err);
    return Response.json({ error: err instanceof Error ? err.message : "unknown error" }, { status: 500 });
  }
}
