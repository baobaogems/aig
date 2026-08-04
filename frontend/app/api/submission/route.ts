// /app/api/submission/route.ts — F2: worker submits → content SNAPSHOT frozen at submit time.
//
// POST { bounty_id, content, source_url? } → { submission }
// The snapshot is what gets judged — editing the source after submitting changes nothing (PRD F2).

import { NextRequest } from "next/server";
import { getBountyDetail, insertSubmission, updateBountyStatus } from "@/lib/arbiter/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { bounty_id, content, source_url } = await req.json();

    if (typeof bounty_id !== "string" || !bounty_id)
      return Response.json({ error: "bounty_id required" }, { status: 400 });
    if (typeof content !== "string" || content.trim().length < 10)
      return Response.json({ error: "content required (≥10 chars) — paste the deliverable text; a bare link is not judgeable" }, { status: 400 });

    const detail = await getBountyDetail(bounty_id);
    if (detail.bounty.status !== "OPEN")
      return Response.json({ error: `bounty is ${detail.bounty.status}, expected OPEN` }, { status: 409 });
    if (new Date(detail.bounty.deadline).getTime() < Date.now())
      return Response.json({ error: "bounty deadline has passed" }, { status: 409 });

    const submission = await insertSubmission({
      bounty_id,
      content_snapshot: content.trim(),
      source_url: typeof source_url === "string" && source_url ? source_url : null,
    });
    await updateBountyStatus(bounty_id, "SUBMITTED");
    return Response.json({ submission });
  } catch (err) {
    console.error("[API /submission]:", err);
    return Response.json({ error: err instanceof Error ? err.message : "unknown error" }, { status: 500 });
  }
}
