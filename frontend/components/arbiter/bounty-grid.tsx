"use client";

// =============================================================================
// bounty-grid.tsx — the cards, laid out, with the empty state they deserve.
//
// Separate from the page so both sections (open work, finished work) get the same grid and
// the same gaps. Two sections that lay out their cards slightly differently read as two
// different products bolted together.
//
// The per-second clock lives HERE, not on the page. On the page it re-rendered the drawers
// once a second, which interrupted IME composition mid-character: typing "đá" in Vietnamese
// came out "dá". Nothing in this subtree takes text input, so ticking here is free.
// =============================================================================

import { BountyCard, type BountyCardData } from "@/components/arbiter/bounty-card";
import { useCountdown } from "@/components/arbiter/use-countdown";
import { ClaimButton } from "@/components/arbiter/claim-button";
import { isClaimable, bountyState } from "@/lib/arbiter/bounty-display";

export function BountyGrid({
  bounties,
  loading,
  emptyTitle,
  emptyHint,
  signedIn = false,
  onChanged,
}: {
  bounties: BountyCardData[];
  loading?: boolean;
  emptyTitle: string;
  emptyHint: string;
  /** When true, claimable cards get a claim button. Finished work never does. */
  signedIn?: boolean;
  onChanged?: () => void;
}) {
  const now = useCountdown();

  if (loading) {
    return <p className="text-sm text-[var(--color-ink-muted)]">Đang tải…</p>;
  }

  if (bounties.length === 0) {
    return (
      <div
        className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-border-light)]
                   bg-white/40 px-5 py-10 text-center"
      >
        <p className="text-sm text-[var(--color-ink)]">{emptyTitle}</p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--color-ink-muted)]">{emptyHint}</p>
      </div>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {bounties.map((b) => {
        const claimable =
          signedIn && isClaimable(bountyState(b.worker_id, b.status, b.deadline, now));
        return (
          <li key={b.id}>
            <BountyCard
              bounty={b}
              now={now}
              action={
                claimable && onChanged ? (
                  <ClaimButton bountyId={b.id} onClaimed={onChanged} />
                ) : undefined
              }
            />
          </li>
        );
      })}
    </ul>
  );
}
