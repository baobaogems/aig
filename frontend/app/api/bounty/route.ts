// /app/api/bounty/route.ts — F1 create (brief → rubric gen → DRAFT) + reads for the /arbiter page.
//
// POST { poster_id, worker_id, brief, amount_usdc, deadline } → { bounty, rubric }
// GET                 → { bounties, stats }   (list + agent_stats view, one payload for the page)
// GET ?id=<uuid>      → BountyDetail          (bounty + rubric + submission + verdict + escalation)

import { NextRequest } from "next/server";
import { generateRubric } from "@/lib/arbiter/rubric";
import { createBountyWithRubric, getAgentStats, getBountyDetail, listBounties } from "@/lib/arbiter/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Rubric generation is one LLM call (~10-20s) — needs more than the default window.
export const maxDuration = 60;

const ADDR_RE = /^0x[0-9a-fA-F]{40}$/;
const PER_BOUNTY_CAP = Number(process.env.PER_BOUNTY_CAP_USDC ?? 50);

export async function POST(req: NextRequest) {
  try {
    const { poster_id, worker_id, brief, amount_usdc, deadline } = await req.json();

    if (!ADDR_RE.test(poster_id ?? "")) return Response.json({ error: "poster_id must be a wallet address" }, { status: 400 });
    if (!ADDR_RE.test(worker_id ?? "")) return Response.json({ error: "worker_id must be a wallet address" }, { status: 400 });
    if (typeof brief !== "string" || brief.trim().length < 20)
      return Response.json({ error: "brief required (≥20 chars)" }, { status: 400 });
    const amount = Number(amount_usdc);
    if (!Number.isFinite(amount) || amount <= 0 || amount > PER_BOUNTY_CAP)
      return Response.json({ error: `amount_usdc must be in (0, ${PER_BOUNTY_CAP}]` }, { status: 400 });
    const dl = new Date(deadline ?? "");
    if (Number.isNaN(dl.getTime()) || dl.getTime() <= Date.now())
      return Response.json({ error: "deadline must be a future datetime" }, { status: 400 });

    // Arbiter proposes the rubric; the poster reviews and freezes it in the next step (F1).
    const gen = await generateRubric(brief.trim());
    const created = await createBountyWithRubric({
      poster_id, worker_id, brief: brief.trim(), amount_usdc: amount, deadline: dl.toISOString(), rubric: gen.items,
    });
    return Response.json(created);
  } catch (err) {
    console.error("[API /bounty] POST:", err);
    return Response.json({ error: err instanceof Error ? err.message : "unknown error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (id) return Response.json(await getBountyDetail(id));
    const [bounties, stats] = await Promise.all([listBounties(), getAgentStats()]);
    return Response.json({ bounties, stats });
  } catch (err) {
    console.error("[API /bounty] GET:", err);
    return Response.json({ error: err instanceof Error ? err.message : "unknown error" }, { status: 500 });
  }
}
