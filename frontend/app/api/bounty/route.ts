// /app/api/bounty/route.ts — F1 create (brief → rubric gen → DRAFT) + reads for the /arbiter page.
//
// POST { poster_id, worker_id, brief, amount_usdc, deadline } → { bounty, rubric }
// GET                 → { bounties, stats }   (list + agent_stats view, one payload for the page)
// GET ?id=<uuid>      → BountyDetail          (bounty + rubric + submission + verdict + escalation)

import { NextRequest } from "next/server";
import { generateRubric } from "@/lib/arbiter/rubric";
import { createBountyWithRubric, getAgentStats, getBountyDetail, listBounties } from "@/lib/arbiter/store";
import { requireSession, sameAddress } from "@/lib/auth/require-role";
import { SESSION_COOKIE, openSession } from "@/lib/auth/siwe-session";
import { LIMIT_CREATE_BOUNTY, enforceRateLimit } from "@/lib/auth/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Rubric generation is one LLM call (~10-20s) — needs more than the default window.
export const maxDuration = 60;

const ADDR_RE = /^0x[0-9a-fA-F]{40}$/;
const PER_BOUNTY_CAP = Number(process.env.PER_BOUNTY_CAP_USDC ?? 50);

export async function POST(req: NextRequest) {
  try {
    // The poster is whoever signed in. A poster_id in the body is ignored outright — trusting
    // it was the hole that let anyone post as anyone (see lib/auth/require-role.ts).
    const poster_id = requireSession(req);
    if (poster_id instanceof Response) return poster_id;

    const limited = await enforceRateLimit("bounty", poster_id, LIMIT_CREATE_BOUNTY);
    if (limited) return limited;

    const { worker_id, brief, amount_usdc, deadline } = await req.json();

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
    if (id) {
      const detail = await getBountyDetail(id);
      // The record is public — the deliverable is not. Anyone may audit what the arbiter
      // decided and why; only the two parties may read the work itself.
      const viewer = openSession(req.cookies.get(SESSION_COOKIE)?.value);
      const isParty =
        sameAddress(detail.bounty.poster_id, viewer) || sameAddress(detail.bounty.worker_id, viewer);
      if (!isParty && detail.submission) {
        detail.submission = { ...detail.submission, content_snapshot: "" };
      }
      return Response.json({ ...detail, viewer_is_party: isParty });
    }
    const [bounties, stats] = await Promise.all([listBounties(), getAgentStats()]);
    return Response.json({ bounties, stats });
  } catch (err) {
    console.error("[API /bounty] GET:", err);
    return Response.json({ error: err instanceof Error ? err.message : "unknown error" }, { status: 500 });
  }
}
