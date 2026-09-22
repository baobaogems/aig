// /app/api/bounty/route.ts — F1 create (brief → rubric gen → DRAFT) + reads for the /arbiter page.
//
// POST { worker_id?, brief, amount_usdc, deadline } → { bounty, rubric }
//   poster_id is NOT read from the body — it comes from the session cookie.
//   worker_id omitted = an OPEN bounty anyone may claim (the normal case since Phase 04).
// GET                 → { bounties, stats }   (list + agent_stats view, one payload for the page)
// GET ?id=<uuid>      → BountyDetail          (bounty + rubric + submission + verdict + escalation)

import { NextRequest } from "next/server";
import { generateRubric } from "@/lib/arbiter/rubric";
import { createBountyWithRubric, getAgentStats, getBountyDetail, listBounties, type BountyView } from "@/lib/arbiter/store";
import { requireSession } from "@/lib/auth/require-role";
import { scopeDetailToViewer } from "@/lib/arbiter/bounty-view";
import { countPendingDecisions } from "@/lib/arbiter/track-record";
import { SESSION_COOKIE, openSession } from "@/lib/auth/siwe-session";
import { LIMIT_CREATE_BOUNTY, enforceRateLimit } from "@/lib/auth/rate-limit";
import { CLAIM_WINDOW_MS, minimumDeadlineMs } from "@/lib/arbiter/settlement-clock";

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

    // worker_id is optional now. Omitted = an OPEN bounty anyone may claim, which is the
    // normal case; a named worker stays supported for a job promised to one person.
    if (worker_id != null && !ADDR_RE.test(worker_id))
      return Response.json({ error: "worker_id must be a wallet address" }, { status: 400 });

    if (typeof brief !== "string" || brief.trim().length < 20)
      return Response.json({ error: "brief required (≥20 chars)" }, { status: 400 });
    const amount = Number(amount_usdc);
    if (!Number.isFinite(amount) || amount <= 0 || amount > PER_BOUNTY_CAP)
      return Response.json({ error: `amount_usdc must be in (0, ${PER_BOUNTY_CAP}]` }, { status: 400 });
    const dl = new Date(deadline ?? "");
    if (Number.isNaN(dl.getTime()) || dl.getTime() <= Date.now())
      return Response.json({ error: "deadline must be a future datetime" }, { status: 400 });
    // A deadline inside the claim window makes `expireClaim` useless: someone could take the
    // job, go quiet, and by the time the bounty could be reopened it is too late to claim it
    // at all. Refusing here is cheaper than shipping a bounty nobody can rescue.
    if (dl.getTime() < minimumDeadlineMs(Date.now()))
      return Response.json(
        { error: `hạn chót phải cách ít nhất ${CLAIM_WINDOW_MS / 3_600_000} giờ, để việc bị nhận rồi bỏ còn cứu được` },
        { status: 400 },
      );

    // Arbiter proposes the rubric; the poster reviews and freezes it in the next step (F1).
    const gen = await generateRubric(brief.trim());
    const created = await createBountyWithRubric({
      poster_id, worker_id: worker_id ?? null, brief: brief.trim(), amount_usdc: amount,
      deadline: dl.toISOString(), rubric: gen.items,
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
      // The record is public — the deliverable is not. That rule lives in one place
      // (lib/arbiter/bounty-view.ts) because the detail page enforces it too.
      const viewer = openSession(req.cookies.get(SESSION_COOKIE)?.value);
      const { detail, isParty } = scopeDetailToViewer(await getBountyDetail(id), viewer);
      return Response.json({ ...detail, viewer_is_party: isParty });
    }
    // Which slice of the board: the public marketplace, or one of the caller's own lists.
    const view = (req.nextUrl.searchParams.get("view") ?? "all") as BountyView;
    const viewer = openSession(req.cookies.get(SESSION_COOKIE)?.value);
    // pending_decisions không tính từ `bounties`: khi view là "mine-claimed" danh sách
    // đó không chứa bounty mình ĐĂNG, nên đếm trên nó sẽ ra 0 và huy hiệu nav biến mất
    // đúng lúc người dùng cần nó nhất. Hỏi riêng một truy vấn, độc lập với view.
    const [bounties, stats, posted] = await Promise.all([
      listBounties(view, viewer),
      getAgentStats(),
      viewer ? listBounties("mine-posted", viewer) : Promise.resolve([]),
    ]);
    return Response.json({
      bounties,
      stats,
      viewer,
      pending_decisions: countPendingDecisions(posted, viewer),
    });
  } catch (err) {
    console.error("[API /bounty] GET:", err);
    return Response.json({ error: err instanceof Error ? err.message : "unknown error" }, { status: 500 });
  }
}
