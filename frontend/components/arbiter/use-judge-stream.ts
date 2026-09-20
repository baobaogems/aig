"use client";

// =============================================================================
// use-judge-stream.ts — drive one judging run and report its phases honestly.
//
// Lifted out of bounty-list.tsx during the board redesign so the judge action could move to
// the bounty's own page without the logic being copied. Copying it would have been the worse
// kind of duplication: the broken-stream branch below is subtle, easy to drop in a rewrite,
// and its absence only shows up when a connection dies mid-run.
//
// The phases map to the three events /api/judge actually emits. Nothing is inferred in
// between — a progress bar that invents intermediate steps is lying about a single model call.
// =============================================================================

import { useState } from "react";
import type { JudgeStage, JudgeVerdict } from "@/components/arbiter/judging-progress";

export function useJudgeStream(onSettled: () => void | Promise<void>) {
  const [stage, setStage] = useState<JudgeStage | null>(null);
  const [busy, setBusy] = useState(false);

  async function judge(bountyId: string, criteria: string[]) {
    setBusy(true);
    setStage({ kind: "grading", startedAt: Date.now(), criteria });

    let verdict: JudgeVerdict | null = null;
    let sawDone = false;

    try {
      const res = await fetch("/api/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bounty_id: bountyId }),
      });
      if (!res.ok || !res.body) {
        throw new Error((await res.json().catch(() => null))?.error ?? `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const events = buf.split("\n\n");
        buf = events.pop() ?? "";
        for (const ev of events) {
          const type = ev.match(/^event: (.+)$/m)?.[1];
          const data = ev.match(/^data: (.+)$/m)?.[1];
          if (!type || !data) continue;
          const payload = JSON.parse(data);
          if (type === "verdict") {
            verdict = payload as JudgeVerdict;
            setStage({ kind: "verdict", verdict });
          }
          if (type === "done") {
            sawDone = true;
            setStage({ kind: "done", verdict, status: payload.status });
          }
          if (type === "error") throw new Error(payload.message);
        }
      }

      // A stream can end without `done` if the connection is cut. Saying so beats leaving the
      // panel frozen mid-phase looking like it is still working — and `afterVerdict` matters:
      // the verdict row is written before anything is streamed, so a break after the verdict
      // arrived is safe, while a break before it means nothing happened at all.
      if (!sawDone) {
        setStage({
          kind: "error",
          afterVerdict: verdict !== null,
          message: "Kết nối đóng trước khi lượt chấm báo hoàn tất.",
        });
      }

      await onSettled();
    } catch (e) {
      setStage({
        kind: "error",
        afterVerdict: verdict !== null,
        message: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBusy(false);
    }
  }

  return { stage, setStage, busy, setBusy, judge };
}
