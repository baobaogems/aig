"use client";

// judging-progress.tsx — the fifteen seconds while the arbiter is deciding.
//
// WHAT THIS DELIBERATELY DOES NOT DO: pretend to know which criterion is being graded.
// /api/judge emits three events — judging at the start, verdict when the whole grade call
// has already finished, done at the end (route.ts). The 15–25s in between is one awaited
// call with no progress reporting, so any per-criterion stepper here would be invented.
// Instead the grading phase is honestly indeterminate: it shows the real criteria the
// arbiter is working against, and how long this normally takes.
//
// The expected duration is not decoration either — an indeterminate wait with no stated
// length is the thing people read as "it has hung".

import { useEffect, useState } from "react";
import { TierPill } from "@/components/ui/tier-pill";
import { ThresholdBar } from "@/components/ui/threshold-bar";
import { TIER_THRESHOLDS } from "@/lib/arbiter/tiers";

const EXPLORER_TX = "https://testnet.arcscan.app/tx/";
// route.ts: maxDuration 60 — "one grade call (~15-25s) + optional on-chain release (~20s)".
const SLOW_AFTER_SECONDS = 45;

const TIER_COLOR: Record<string, string> = {
  RELEASE: "var(--color-tier-t1)", ESCALATE: "var(--color-tier-t2)",
  FAIL: "var(--color-tier-t3)", REFUSE: "var(--color-tier-t3)",
};

export interface JudgeVerdict {
  decision: string; total_score: number; confidence: number;
  verdict_hash: string; release_tx: string | null; settlement_note: string | null;
}
export type JudgeStage =
  | { kind: "grading"; startedAt: number; criteria: string[] }
  | { kind: "verdict"; verdict: JudgeVerdict }
  | { kind: "done"; verdict: JudgeVerdict | null; status: string }
  | { kind: "error"; message: string; afterVerdict: boolean };

function Elapsed({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const s = Math.max(0, Math.round((now - startedAt) / 1000));
  return (
    <>
      <span className="tnum font-[family-name:var(--font-jetbrains-mono)]">{s}s</span>
      {s >= SLOW_AFTER_SECONDS && (
        <span className="ml-2" style={{ color: "var(--color-ink-warn)" }}>
          — longer than usual. It has not failed; the request runs up to 60 seconds.
        </span>
      )}
    </>
  );
}

/** Gates climb from zero once mounted, so the numbers can be watched arriving. */
function VerdictGates({ verdict }: { verdict: JudgeVerdict }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShown(true), 40);
    return () => clearTimeout(t);
  }, []);
  const color = TIER_COLOR[verdict.decision] ?? "var(--color-tier-t3)";
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <ThresholdBar label="score" tone="light" color={color}
        value={shown ? verdict.total_score : 0} threshold={TIER_THRESHOLDS.autoReleaseScore} />
      <ThresholdBar label="confidence" tone="light" color={color}
        value={shown ? verdict.confidence : 0} threshold={TIER_THRESHOLDS.autoReleaseConfidence} />
    </div>
  );
}

export function JudgingProgress({ stage }: { stage: JudgeStage }) {
  if (stage.kind === "grading") {
    return (
      <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--color-ink)]/10 bg-white/70 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-medium text-[var(--color-ink)]">
            <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full align-middle"
              style={{ backgroundColor: "var(--color-tier-t1)" }} aria-hidden="true" />
            Reading the deliverable
          </p>
          <p className="text-xs text-[var(--color-ink-muted)]"><Elapsed startedAt={stage.startedAt} /></p>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-muted)]">
          It is scoring the submission against {stage.criteria.length} frozen criteria and citing the
          words behind each score. This normally takes 15–25 seconds, and the criteria are graded in
          one pass — so there is no per-criterion progress to show, only the result.
        </p>
        <ul className="mt-3 space-y-1.5" aria-busy="true">
          {stage.criteria.map((c, i) => (
            <li key={i} className="flex gap-2 text-sm leading-relaxed text-[var(--color-ink)]">
              <span aria-hidden="true" className="text-[var(--color-ink-muted)]">·</span>
              {c}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (stage.kind === "error") {
    return (
      <div className="mt-4 rounded-[var(--radius-card)] p-4"
        style={{ backgroundColor: "var(--color-chip-danger)", border: "1px solid var(--color-ink-danger)" }}>
        <p className="text-sm font-medium" style={{ color: "var(--color-ink-danger)" }}>
          {stage.afterVerdict ? "The verdict was reached, but the connection dropped" : "Judging stopped"}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink)]">{stage.message}</p>
        <p className="mt-2 text-xs leading-relaxed text-[var(--color-ink-muted)]">
          {stage.afterVerdict
            ? "The verdict is written to the record before anything is streamed back, so nothing was lost. Close and reopen this row to read it."
            : "Nothing was charged and no money moved. Close and reopen this row to check the current state before trying again."}
        </p>
      </div>
    );
  }

  const { verdict } = stage;
  const settled = stage.kind === "done";
  return (
    <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--color-ink)]/10 bg-white/70 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {verdict ? <TierPill decision={verdict.decision} /> : <span />}
        <p className="text-xs text-[var(--color-ink-muted)]">
          {settled ? "Recorded" : "Verdict in — settling"}
        </p>
      </div>

      {verdict && <VerdictGates verdict={verdict} />}

      {verdict?.settlement_note && (
        <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-muted)]">{verdict.settlement_note}</p>
      )}

      {settled && (
        <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink)]">
          {stage.status === "RELEASED"
            ? "Both gates cleared. The USDC has been released to the worker."
            : stage.status === "REFUSED"
            ? "The arbiter declined to judge this one at all, so no money moved."
            : verdict?.decision === "FAIL"
            ? "It is confident this did not meet the rubric. It still cannot withhold or reclaim on its own, so the call is yours below."
            : "It was not confident enough to decide alone, so it stopped and asked you below."}
        </p>
      )}

      {/* release_tx is a real transaction; verdict_hash stays plain text — it is a digest
          inside the Released event, and a link there would 404. */}
      {verdict?.release_tx && (
        <p className="mt-3 break-all rounded-lg bg-[var(--color-surface-dark)] px-3 py-2 font-[family-name:var(--font-jetbrains-mono)] text-xs text-[var(--color-on-dark-muted)]">
          release{" "}
          <a href={`${EXPLORER_TX}${verdict.release_tx}`} target="_blank" rel="noopener noreferrer"
            className="text-[var(--color-accent-bright)] underline decoration-[var(--color-accent-bright)]/30 underline-offset-4 hover:decoration-[var(--color-accent-bright)]">
            {verdict.release_tx}
          </a>
        </p>
      )}
    </div>
  );
}
