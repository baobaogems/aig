"use client";

// =============================================================================
// bounty-card.tsx — one bounty as an object you can scan, not a line in a ledger.
//
// What the old row got wrong, and what each part here answers:
//
//   E1  the amount was small mono text at the right edge, competing with "copy id".
//       → AmountBlock: a different material, the card's visual anchor.
//   H1  "8 Sept, 21:19 · worker 0x4354…e3A9" glued a timestamp to an identity with a middot.
//       → the two live in different places now: time on the status strip, worker in its own row.
//   —   five rows showed the same truncated sentence, so the eye had nothing to grab.
//       → the anchor is the NUMBER, which differs per bounty even when the briefs repeat.
//
// The bottom strip carries state + countdown, borrowed from how ticket boards mark a live
// listing: it reads as a status light on an otherwise static card.
// =============================================================================

import Link from "next/link";
import { AmountBlock } from "@/components/ui/amount-block";
import {
  STATE_LABEL,
  type BountyState,
  bountyState,
  isClaimable,
  isUrgent,
  shortCode,
  stripLabel,
} from "@/lib/arbiter/bounty-display";

export interface BountyCardData {
  id: string;
  brief: string;
  amount_usdc: number;
  deadline: string;
  status: string;
  worker_id: string | null;
  rubric_count?: number;
}

/** Only the live state gets a coloured dot; everything else is a quiet grey. */
const DOT: Record<BountyState, string> = {
  unclaimed: "bg-[var(--color-accent)]",
  "in-progress": "bg-[var(--color-ink-muted)]",
  submitted: "bg-[var(--color-ink-muted)]",
  expired: "bg-[var(--color-border-light)]",
  closed: "bg-[var(--color-border-light)]",
};

export function BountyCard({
  bounty,
  now,
  action,
}: {
  bounty: BountyCardData;
  /** Passed in so every card on the board ticks off one clock (use-countdown.ts). */
  now: number;
  /** Claim button, slotted by the board — the card itself knows nothing about sessions. */
  action?: React.ReactNode;
}) {
  const state = bountyState(bounty.worker_id, bounty.status, bounty.deadline, now);
  const urgent = isUrgent(bounty.deadline, now);

  return (
    <article
      className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)]
                 border border-[var(--color-border-light)] bg-white/70
                 transition-colors hover:border-[var(--color-ink)]/30"
    >
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-[family-name:var(--font-jetbrains-mono)] text-xs text-[var(--color-ink-muted)]">
            {shortCode(bounty.id)}
          </span>
          <span className="text-xs text-[var(--color-ink-muted)]">{STATE_LABEL[state]}</span>
        </div>

        <AmountBlock amountUsdc={bounty.amount_usdc} />

        {/* Two lines: enough to decide whether to open it, not enough to become a wall. */}
        <p className="line-clamp-2 text-sm leading-relaxed text-[var(--color-ink)]">
          {bounty.brief}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          {typeof bounty.rubric_count === "number" && bounty.rubric_count > 0 ? (
            <span className="text-xs text-[var(--color-ink-muted)]">
              {bounty.rubric_count} tiêu chí chấm
            </span>
          ) : (
            <span />
          )}
          <Link
            href={`/arbiter/bounty/${bounty.id}`}
            className="rounded-[var(--radius-pill)] border border-[var(--color-ink)]/15 px-3.5 py-1.5
                       text-sm text-[var(--color-ink)] transition-colors
                       hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]
                       focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
                       focus-visible:outline-[var(--color-accent)]"
          >
            Xem chi tiết
          </Link>
        </div>

        {action && isClaimable(state) && <div className="pt-1">{action}</div>}
      </div>

      {/* Status strip: a hairline above it, no second background — the divider does the work. */}
      <div className="flex items-center gap-2 border-t border-[var(--color-border-light)] px-4 py-2">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT[state]}`} aria-hidden="true" />
        <span
          className={`tnum text-xs ${
            urgent ? "text-[var(--color-accent)]" : "text-[var(--color-ink-muted)]"
          }`}
        >
          {stripLabel(state, bounty.status, bounty.deadline, now)}
        </span>
      </div>
    </article>
  );
}
