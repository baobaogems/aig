// /app/api/escalation/route.ts — F4: the poster acts on a verdict.
//
// POST { verdict_id, bounty_id, poster_action: APPROVE|REJECT, note?, criteria? }
//
// APPROVE → the worker is paid in full.
// REJECT  → the worker is paid the KILL FEE for the score the arbiter gave, and the poster
//           gets the rest back. Rejecting is always allowed; it is never free.
//
// WHY REJECTING COSTS SOMETHING
// -----------------------------
// In v2 a rejection cost the poster nothing: the money stayed locked and came home at the
// deadline, while the deliverable was already in their hands. Free work, with no way to tell
// an honest rejection from a theft. There is no court here to make that distinction, so the
// only honest lever is to price EVERY rejection, and let the arbiter's own score set the
// price. A deliverable the arbiter scored below the fail line still costs nothing to refuse.
//
// EVERY action lands in `escalations` — that table IS the override_rate (agent_stats view).

import { NextRequest } from "next/server";
import { getBountyDetail, insertEscalation } from "@/lib/arbiter/store";
import { killFeeBps } from "@/lib/arbiter/kill-fee";
import { isCurrentVersion } from "@/lib/escrow-version";
import { settleBounty } from "@/lib/arbiter/settle-bounty";
import { decideTier } from "@/lib/arbiter/tiers";
import { requirePoster } from "@/lib/auth/require-role";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // settling waits for the receipt

export async function POST(req: NextRequest) {
  try {
    const { verdict_id, bounty_id, poster_action, note } = await req.json();

    if (typeof verdict_id !== "string" || !verdict_id)
      return Response.json({ error: "verdict_id required" }, { status: 400 });
    if (typeof bounty_id !== "string" || !bounty_id)
      return Response.json({ error: "bounty_id required" }, { status: 400 });
    if (poster_action !== "APPROVE" && poster_action !== "REJECT")
      return Response.json({ error: "poster_action must be APPROVE or REJECT" }, { status: 400 });

    // Both branches move real USDC. Poster only — this was the most dangerous open route.
    const gate = await requirePoster(req, bounty_id);
    if (gate instanceof Response) return gate;

    const detail = await getBountyDetail(bounty_id);
    if (!detail.verdict || detail.verdict.id !== verdict_id)
      return Response.json({ error: "verdict not found for this bounty" }, { status: 404 });
    if (detail.escalation)
      return Response.json({ error: `already acted: ${detail.escalation.poster_action}` }, { status: 409 });
    if (detail.bounty.status !== "JUDGED")
      return Response.json({ error: `bounty is ${detail.bounty.status}, expected JUDGED` }, { status: 409 });
    if (detail.verdict.release_tx)
      return Response.json({ error: `already settled: ${detail.verdict.release_tx}` }, { status: 409 });

    // A rejection must be answerable: say which frozen criterion the work missed. The rubric
    // was frozen before anyone claimed the job, so this is a check against a fixed target
    // rather than an opinion formed after seeing the work.
    if (poster_action === "REJECT" && (typeof note !== "string" || note.trim().length < 10)) {
      return Response.json(
        { error: "a refusal needs a reason (at least 10 characters) against the frozen criteria" },
        { status: 400 },
      );
    }

    // Record the human action FIRST — the override stat must survive a failed settlement.
    const escalation = await insertEscalation({ verdict_id, poster_action, note: note ?? null });

    // A v2 bounty predates the kill fee and its contract cannot split, so a refusal there is
    // the all-or-nothing it always was: nothing paid now, poster refunds after the deadline.
    const legacy = !isCurrentVersion(detail.bounty.escrow_version);
    const bps =
      poster_action === "APPROVE"
        ? 10_000
        : legacy
        ? 0
        : killFeeBps({
            totalScore: detail.verdict.total_score,
            // Recomputed from the stored numbers, never taken from the request: the price of
            // a rejection is not something the person paying it gets to choose.
            tier: decideTier({
              totalScore: detail.verdict.total_score,
              confidence: detail.verdict.confidence,
              outOfScope: detail.verdict.decision === "REFUSE",
            }).tier,
          });

    const outcome = await settleBounty(detail, bps, `poster ${poster_action}`);
    return Response.json({ escalation, ...outcome });
  } catch (err) {
    console.error("[API /escalation]:", err);
    return Response.json({ error: err instanceof Error ? err.message : "unknown error" }, { status: 500 });
  }
}
