// /app/api/submission/route.ts — F2: worker submits → content SNAPSHOT frozen at submit time.
//
// POST { bounty_id, content? , source_url? } → { submission, isRetry }
//
// Three ways to hand work in, one thing stored: the text that will be judged.
//   - content    : pasted straight in
//   - source_url : fetched server-side and turned into text (lib/arbiter/fetch-deliverable.ts)
// Whatever the route, the snapshot is frozen here. Editing the source afterwards changes
// nothing, which is the promise PRD F2 makes to the poster.
//
// A URL is fetched by the SERVER, so it is an SSRF surface; every check lives in
// fetch-deliverable.ts and the text it returns is still treated as untrusted data downstream.

import { NextRequest } from "next/server";
import { getBountyDetail, insertSubmission, updateBountyStatus } from "@/lib/arbiter/store";
import { requireWorker } from "@/lib/auth/require-role";
import { DeliverableFetchError, fetchDeliverable } from "@/lib/arbiter/fetch-deliverable";
import { submissionWindow } from "@/lib/arbiter/submission-window";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30; // a 10s fetch plus retries, with room to spare

export async function POST(req: NextRequest) {
  try {
    const { bounty_id, content, source_url } = await req.json();

    if (typeof bounty_id !== "string" || !bounty_id)
      return Response.json({ error: "bounty_id required" }, { status: 400 });

    // Only the worker assigned to this bounty may submit against it.
    const gate = await requireWorker(req, bounty_id);
    if (gate instanceof Response) return gate;

    const detail = await getBountyDetail(bounty_id);

    // A failing verdict is the start of a loop, not the end of the road: the worker reads what
    // was wrong and hands in a better attempt. One rule, shared with the UI, decides whether
    // this attempt is accepted — see lib/arbiter/submission-window.ts.
    const window = submissionWindow({
      status: detail.bounty.status,
      lastDecision: detail.verdict?.decision ?? null,
      deadline: detail.bounty.deadline,
      now: Date.now(),
    });
    if (!window.allowed) return Response.json({ error: window.reason }, { status: 409 });

    const url = typeof source_url === "string" && source_url.trim() ? source_url.trim() : null;
    const pasted = typeof content === "string" ? content.trim() : "";

    let snapshot: string;
    if (pasted) {
      snapshot = pasted;
    } else if (url) {
      try {
        const fetched = await fetchDeliverable(url);
        snapshot = fetched.text;
      } catch (err) {
        // A fetch failure is the submitter's problem to fix, not a 500, and never a reason
        // to judge an empty page.
        if (err instanceof DeliverableFetchError)
          return Response.json({ error: err.message }, { status: 400 });
        throw err;
      }
    } else {
      return Response.json(
        { error: "cần nội dung: dán thẳng bài, hoặc đưa link công khai để Arbiter tự đọc" },
        { status: 400 },
      );
    }

    if (snapshot.length < 10)
      return Response.json({ error: "nội dung quá ngắn để chấm (dưới 10 ký tự)" }, { status: 400 });

    const submission = await insertSubmission({
      bounty_id,
      content_snapshot: snapshot,
      source_url: url,
    });
    await updateBountyStatus(bounty_id, "SUBMITTED");
    // isRetry lets the UI say "bản nộp lại" rather than pretending this is a first attempt.
    return Response.json({ submission, isRetry: window.isRetry });
  } catch (err) {
    console.error("[API /submission]:", err);
    return Response.json({ error: err instanceof Error ? err.message : "unknown error" }, { status: 500 });
  }
}
