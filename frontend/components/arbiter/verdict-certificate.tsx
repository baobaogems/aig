"use client";

// verdict-certificate.tsx — reskin: the verdict view as a premium "certificate".
// Extracted from bounty-list.tsx (F3/F4 display only — zero logic, pure presentation)
// to keep that file under the 200-line modularization guideline.

import { GlassPanel } from "@/components/ui/glass-panel";
import { TierPill } from "@/components/ui/tier-pill";
import { PillButton } from "@/components/ui/pill-button";

interface RubricScore { item_id: string; weight: number; score: number; evidence: string[]; reasoning: string }
interface Verdict {
  id: string; decision: string; total_score: number; confidence: number; verdict_hash: string; release_tx: string | null;
  verdict_json: { rubric_scores: RubricScore[]; confidence_reasoning: string; refusal_reason: string | null };
}

export function VerdictCertificate({
  verdict, bountyStatus, escalation, busy, onAct,
}: {
  verdict: Verdict;
  bountyStatus: string;
  escalation: null | { poster_action: string };
  busy: boolean;
  onAct: (action: "APPROVE" | "REJECT") => void;
}) {
  return (
    <GlassPanel tone="light" className="mt-3 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TierPill decision={verdict.decision} />
        <p className="font-[family-name:var(--font-jetbrains-mono)] text-sm text-[var(--color-ink-muted)]">
          score <span className="font-semibold text-[var(--color-ink)]">{verdict.total_score}</span> · confidence{" "}
          <span className="font-semibold text-[var(--color-ink)]">{verdict.confidence}</span>
        </p>
      </div>

      <p className="mt-3 break-all rounded-lg bg-[var(--color-surface-dark)] px-3 py-2 font-[family-name:var(--font-jetbrains-mono)] text-xs text-[var(--color-accent-bright)]">
        verdictHash {verdict.verdict_hash}
        {verdict.release_tx && <><br />release {verdict.release_tx}</>}
      </p>

      <div className="mt-4 space-y-3">
        {verdict.verdict_json.rubric_scores.map((s) => (
          <div key={s.item_id} className="border-l-2 border-[var(--color-accent)]/30 pl-3">
            <p className="text-sm text-[var(--color-ink)]">
              <span className="font-[family-name:var(--font-jetbrains-mono)] text-[var(--color-ink-muted)]">{s.item_id} [w{s.weight}]</span>{" "}
              {s.score}/100 — {s.reasoning}
            </p>
            <p className="mt-1 rounded bg-[var(--color-surface-light-2)]/60 px-2 py-1 font-[family-name:var(--font-jetbrains-mono)] text-xs italic text-[var(--color-ink-muted)]">
              &ldquo;{s.evidence[0]}&rdquo;
            </p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-[var(--color-ink-muted)]">
        confidence reasoning: {verdict.verdict_json.confidence_reasoning}
      </p>

      {bountyStatus === "JUDGED" && !escalation && (
        <div className="mt-4 flex gap-3">
          <PillButton variant="primary" disabled={busy} onClick={() => onAct("APPROVE")}>APPROVE — release</PillButton>
          <PillButton variant="secondary" disabled={busy} onClick={() => onAct("REJECT")}>REJECT</PillButton>
        </div>
      )}
      {escalation && (
        <p className="mt-4 text-sm text-[var(--color-ink)]">
          poster action: <span className="font-semibold">{escalation.poster_action}</span>
        </p>
      )}
    </GlassPanel>
  );
}
