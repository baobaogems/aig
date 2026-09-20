"use client";

// =============================================================================
// marketplace-board.tsx — the job board. Bounties that are funded, open, and unclaimed.
//
// This is the piece that turns /arbiter from "Baobao's control panel" into something two
// strangers can use: the poster no longer needs to know who will do the work.
//
// Every row here is already paid for — the USDC is in escrow before the bounty is listed.
// That is the claim worth making on this screen, so the amount and the deadline lead.
// =============================================================================

import { ClaimButton } from "@/components/arbiter/claim-button";

export interface OpenBounty {
  id: string;
  brief: string;
  amount_usdc: number;
  deadline: string;
  created_at: string;
}

/** "còn 3 ngày" / "còn 5 giờ" / "còn 12 phút" — precision that matches how much time is left. */
export function timeLeft(deadline: string): string {
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return "đã quá hạn";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `còn ${mins} phút`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `còn ${hours} giờ`;
  return `còn ${Math.floor(hours / 24)} ngày`;
}

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
      {bounties.map((b) => (
        <li
          key={b.id}
          className="rounded-xl border border-[var(--color-ink)]/10 bg-white/70 px-5 py-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-3">
                <span className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--color-ink)]">
                  {b.amount_usdc} USDC
                </span>
                <span className="text-xs text-[var(--color-ink-muted)]">{timeLeft(b.deadline)}</span>
              </div>
              <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-[var(--color-ink-muted)]">
                {b.brief}
              </p>
            </div>

            {signedIn ? (
              <ClaimButton bountyId={b.id} onClaimed={onChanged} />
            ) : (
              <p className="text-xs text-[var(--color-ink-muted)]">Kết nối ví để nhận việc</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
