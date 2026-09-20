// /app/api/settlement/finalize/route.ts — the clock ran out; pay the worker in full.
//
// POST { bounty_id } → settlement outcome
//
// This is the rule that fixes the worst behaviour of v2: a poster who received a deliverable
// and then said nothing used to keep both the work and the money. Silence was the cheapest
// strategy available and it won. Here silence pays the worker.
//
// DELIBERATELY OPEN TO ANY CALLER. It takes one argument and has exactly one outcome, so a
// stranger calling it can only bring about what the poster's own silence already decided.
// Restricting it to the worker would mean a worker without gas or without an account is
// stuck, and restricting it to the server would put the payout back behind the availability
// of the very platform this rule is meant to make unnecessary. The contract's own
// `timeoutRelease` is the same bet, one layer down.
//
// Idempotent: a second call finds the settlement recorded and refuses instead of paying twice.

import { NextRequest } from "next/server";
import { getBountyDetail } from "@/lib/arbiter/store";
import { settlementState } from "@/lib/arbiter/settlement-clock";
import { SpendCapReached, settleBounty } from "@/lib/arbiter/settle-bounty";
import { decideTier } from "@/lib/arbiter/tiers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { bounty_id } = await req.json();
    if (typeof bounty_id !== "string" || !bounty_id)
      return Response.json({ error: "bounty_id required" }, { status: 400 });

    const detail = await getBountyDetail(bounty_id);
    const { bounty, verdict } = detail;
    if (!verdict) return Response.json({ error: "chưa có kết quả chấm" }, { status: 409 });
    if (verdict.release_tx)
      return Response.json({ error: `đã thanh toán: ${verdict.release_tx}` }, { status: 409 });
    if (bounty.status === "RELEASED" || bounty.status === "REFUNDED")
      return Response.json({ error: `bounty is ${bounty.status}` }, { status: 409 });

    const tier = decideTier({
      totalScore: verdict.total_score,
      confidence: verdict.confidence,
      outOfScope: verdict.decision === "REFUSE",
    }).tier;

    const clock = settlementState({
      tier,
      submittedAtMs: bounty.submitted_at ? new Date(bounty.submitted_at).getTime() : null,
      resolved: false,
      nowMs: Date.now(),
    });
    if (clock.phase !== "auto-release-due")
      return Response.json(
        {
          error:
            clock.phase === "closed"
              ? "việc này không có đồng hồ thanh toán đang chạy"
              : `chưa tới hạn — còn ${clock.secondsLeft}s để người đăng quyết`,
        },
        { status: 409 },
      );

    // enforceDayCap: this payout is the arbiter's own doing, so it counts against what the
    // system may spend unattended. A poster settling by hand is not capped — see settle-bounty.
    const outcome = await settleBounty(detail, 10_000, "window elapsed — paid in full", true);
    return Response.json(outcome);
  } catch (err) {
    if (err instanceof SpendCapReached) {
      // Fail closed and say so plainly. The worker is still owed; the contract's
      // permissionless timeoutRelease is the way through when this path is capped.
      console.warn(`[API /settlement/finalize] spend cap: ${err.message}`);
      return Response.json({ error: err.message }, { status: 409 });
    }
    console.error("[API /settlement/finalize]:", err);
    return Response.json({ error: err instanceof Error ? err.message : "unknown error" }, { status: 500 });
  }
}
