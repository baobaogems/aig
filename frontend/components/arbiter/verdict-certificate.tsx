"use client";

// verdict-certificate.tsx — the verdict as a readable record, not a debug dump.
//
// This is what /arbiter exists to show: what the arbiter decided, how close it was to the
// gates that govern releasing money, which words in the deliverable it is citing, and the
// hash that proves the record was not rewritten afterwards. Everything here is display —
// the tier decision itself is computed server-side by lib/arbiter/tiers.ts.
//
// The gates are imported from that same module rather than retyped, so the page can never
// advertise a threshold different from the one actually gating the payout.

import { TierPill } from "@/components/ui/tier-pill";
import { PillButton } from "@/components/ui/pill-button";
import { ThresholdBar } from "@/components/ui/threshold-bar";
import { TIER_THRESHOLDS } from "@/lib/arbiter/tiers";

const EXPLORER_TX = "https://testnet.arcscan.app/tx/";

const TIER_COLOR: Record<string, string> = {
  RELEASE: "var(--color-tier-t1)",
  ESCALATE: "var(--color-tier-t2)",
  FAIL: "var(--color-tier-t3)",
  REFUSE: "var(--color-tier-t3)",
};

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
  const color = TIER_COLOR[verdict.decision] ?? "var(--color-tier-t3)";
  const { rubric_scores, confidence_reasoning, refusal_reason } = verdict.verdict_json;

  return (
    <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--color-ink)]/10 bg-white/70 p-5">
      <TierPill decision={verdict.decision} />

      {/* The two numbers that decide whether money moves, each against its own gate. */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <ThresholdBar
          label="score" tone="light" color={color}
          value={verdict.total_score} threshold={TIER_THRESHOLDS.autoReleaseScore}
        />
        <ThresholdBar
          label="confidence" tone="light" color={color}
          value={verdict.confidence} threshold={TIER_THRESHOLDS.autoReleaseConfidence}
        />
      </div>

      <p className="mt-3 text-xs leading-relaxed text-[var(--color-ink-muted)]">
        Both gates must be cleared for the arbiter to release on its own. {confidence_reasoning}
      </p>

      {refusal_reason && (
        <p
          className="mt-3 rounded-lg px-3 py-2 text-sm"
          style={{ color: "var(--color-ink-warn)", backgroundColor: "var(--color-chip-warn)" }}
        >
          Refused: {refusal_reason}
        </p>
      )}

      {/* Per-criterion scoring. The rubric text itself lives in another table and is not
          part of this payload, so criteria are numbered in order rather than showing the
          raw item_id. */}
      <div className="mt-5 space-y-4">
        <h4 className="text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">
          How it scored, criterion by criterion
        </h4>
        {rubric_scores.map((s, i) => (
          <div key={s.item_id} className="border-l-2 pl-3" style={{ borderColor: `color-mix(in srgb, ${color} 45%, transparent)` }}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-[var(--color-ink)]">
                Criterion {i + 1}
                <span className="ml-2 text-xs font-normal text-[var(--color-ink-muted)]">
                  counts for {s.weight}% of the score
                </span>
              </p>
              <p className="tnum font-[family-name:var(--font-jetbrains-mono)] text-sm text-[var(--color-ink)]">
                {s.score}<span className="text-[var(--color-ink-muted)]">/100</span>
              </p>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink-muted)]">{s.reasoning}</p>
            {/* Evidence is the whole claim of this product: the arbiter must point at the
                words it judged, not just assert a number. */}
            {s.evidence.filter(Boolean).map((quote, qi) => (
              <blockquote
                key={qi}
                className="mt-1.5 rounded border-l-2 border-[var(--color-ink)]/15 bg-[var(--color-surface-light)] px-3 py-1.5 text-xs italic leading-relaxed text-[var(--color-ink-muted)]"
              >
                &ldquo;{quote}&rdquo;
              </blockquote>
            ))}
          </div>
        ))}
      </div>

      {/* Proof. release_tx is a real transaction and gets a link; verdict_hash is a digest
          written into the Released event, not a transaction of its own — linking it to the
          explorer would 404, so it stays plain text. */}
      <div className="mt-5 rounded-lg bg-[var(--color-surface-dark)] px-3 py-2.5">
        <p className="break-all font-[family-name:var(--font-jetbrains-mono)] text-xs text-[var(--color-on-dark-muted)]">
          verdict hash <span className="text-[var(--color-on-dark)]">{verdict.verdict_hash}</span>
        </p>
        {verdict.release_tx && (
          <p className="mt-1.5 break-all font-[family-name:var(--font-jetbrains-mono)] text-xs text-[var(--color-on-dark-muted)]">
            release{" "}
            <a
              href={`${EXPLORER_TX}${verdict.release_tx}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-accent-bright)] underline decoration-[var(--color-accent-bright)]/30 underline-offset-4 hover:decoration-[var(--color-accent-bright)]"
            >
              {verdict.release_tx}
            </a>
          </p>
        )}
      </div>

      {bountyStatus === "JUDGED" && !escalation && (
        <div className="mt-5 border-t border-[var(--color-ink)]/10 pt-4">
          <p className="text-sm text-[var(--color-ink)]">
            The arbiter did not release on its own. Your decision is recorded and counts toward the
            public override rate.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <PillButton variant="primary" disabled={busy} onClick={() => onAct("APPROVE")}>
              Approve — pay the worker
            </PillButton>
            <PillButton variant="secondary" disabled={busy} onClick={() => onAct("REJECT")}>
              Reject — refund me
            </PillButton>
          </div>
        </div>
      )}
      {escalation && (
        <p className="mt-5 border-t border-[var(--color-ink)]/10 pt-4 text-sm text-[var(--color-ink)]">
          You{" "}
          <span className="font-semibold">
            {escalation.poster_action === "APPROVE" ? "approved — the worker was paid" : "rejected — the money was refunded"}
          </span>
          , overruling the arbiter.
        </p>
      )}
    </div>
  );
}
