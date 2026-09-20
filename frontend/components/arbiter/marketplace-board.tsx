"use client";

// =============================================================================
// marketplace-board.tsx — the job board. Funded work, still in time.
//
// This is the screen that turns /arbiter from one person's control panel into something two
// strangers can use. Every row here is already paid for — the USDC sits in escrow before the
// bounty is listed — so the amount leads, and the deadline is second.
//
// Claimed bounties stay on the board. Hiding them made it look emptiest exactly when the
// community was busiest, and removed the only signal a newcomer has that the thing is used.
// What changes is the action: you can read any of them, you can only take an unclaimed one.
// =============================================================================

import Link from "next/link";
import { ClaimButton } from "@/components/arbiter/claim-button";
import { useCountdown } from "@/components/arbiter/use-countdown";
import {
  STATE_LABEL,
  type BountyState,
  bountyState,
  isClaimable,
  isUrgent,
  shortCode,
  timeLeft,
} from "@/lib/arbiter/bounty-display";

export interface OpenBounty {
  id: string;
  brief: string;
  amount_usdc: number;
  deadline: string;
  status: string;
  worker_id: string | null;
  created_at: string;
}

const STATE_CHIP: Record<BountyState, string> = {
  unclaimed: "border-[var(--color-accent)]/40 text-[var(--color-accent)]",
  "in-progress": "border-[var(--color-ink)]/25 text-[var(--color-ink-muted)]",
  submitted: "border-[var(--color-ink)]/25 text-[var(--color-ink-muted)]",
  expired: "border-[var(--color-ink)]/15 text-[var(--color-ink-muted)]",
  closed: "border-[var(--color-ink)]/15 text-[var(--color-ink-muted)]",
};

export function MarketplaceBoard({
  bounties,
  loading,
  signedIn,
  onChanged,
}: {
  bounties: OpenBounty[];
  loading: boolean;
  signedIn: boolean;
  onChanged: () => void;
}) {
  // One clock for every row on the board.
  const now = useCountdown();

  if (loading) {
    return <p className="text-sm text-[var(--color-ink-muted)]">Đang tải chợ việc…</p>;
  }

  if (bounties.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--color-ink)]/10 bg-white/60 px-5 py-8 text-center">
        <p className="text-sm text-[var(--color-ink)]">Chưa có việc nào đang mở.</p>
        <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
          Việc chỉ hiện ở đây sau khi người đăng đã khoá USDC vào escrow.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid gap-3">
      {bounties.map((b) => {
        const state = bountyState(b.worker_id, b.status, b.deadline, now);
        const urgent = isUrgent(b.deadline, now);

        return (
          <li key={b.id}>
            <div
              className="rounded-xl border border-[var(--color-ink)]/10 bg-white/70 px-5 py-4
                         transition-colors hover:border-[var(--color-accent)]/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-[family-name:var(--font-jetbrains-mono)] text-xs text-[var(--color-ink-muted)]">
                      {shortCode(b.id)}
                    </span>
                    <span
                      className={`rounded-[var(--radius-pill)] border px-2 py-0.5 text-xs ${STATE_CHIP[state]}`}
                    >
                      {STATE_LABEL[state]}
                    </span>
                  </div>

                  <div className="mt-1.5 flex items-baseline gap-3">
                    <span className="font-[family-name:var(--font-heading)] text-xl font-semibold text-[var(--color-ink)]">
                      {b.amount_usdc} USDC
                    </span>
                    <span
                      className={`tnum text-xs ${
                        urgent ? "text-[var(--color-accent)]" : "text-[var(--color-ink-muted)]"
                      }`}
                    >
                      {timeLeft(b.deadline, now)}
                    </span>
                  </div>

                  {/* The brief is the pitch. Three lines is enough to decide whether to open it. */}
                  <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-[var(--color-ink-muted)]">
                    {b.brief}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  <Link
                    href={`/arbiter/bounty/${b.id}`}
                    className="rounded-[var(--radius-pill)] border border-[var(--color-ink)]/15 px-4 py-2 text-sm
                               text-[var(--color-ink)] transition-colors
                               hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                  >
                    Xem chi tiết
                  </Link>

                  {isClaimable(state) &&
                    (signedIn ? (
                      <ClaimButton bountyId={b.id} onClaimed={onChanged} />
                    ) : (
                      <p className="text-xs text-[var(--color-ink-muted)]">Kết nối ví để nhận việc</p>
                    ))}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
