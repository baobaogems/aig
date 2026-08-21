"use client";

// =============================================================================
// dashboard-stat-cards.tsx — 4 metric cards row matching Pencil design
// Labels: Total USDC Settled, Payments Today, Bridge Speed, Points Balance
// =============================================================================

interface StatCardsProps {
  totalRevenue: number;
  transactionCount: number;
  pointsBalance: number;
  tier: string;
  loading: boolean;
}

// Card base styling shared across all 4 cards
const cardClass =
  "bg-white border border-[var(--color-border-light)] shadow-[0_1px_1.75px_0_rgb(0_0_0/0.051)] flex-1 flex flex-col";

// Tier badge for Points card
function TierBadge({ tier }: { tier: string }) {
  return (
    <span className="rounded-full bg-[var(--color-chip-neutral)] px-2 py-1 font-[family-name:var(--font-jetbrains-mono)] text-sm text-[var(--color-ink-warn)] leading-none">
      {tier}
    </span>
  );
}

export function DashboardStatCards({
  totalRevenue,
  transactionCount,
  pointsBalance,
  tier,
  loading,
}: StatCardsProps) {
  const dash = loading ? "—" : null;

  return (
    <div className="flex flex-row gap-4">
      {/* Card 1: Total USDC Settled */}
      <div className={cardClass}>
        <div className="px-6 py-5 flex flex-col gap-1">
          <p className="font-[family-name:var(--font-geist-sans)] text-xs font-medium text-[var(--color-ink-muted)] tracking-wider uppercase">
            Total USDC Settled
          </p>
          <p className="font-[family-name:var(--font-jetbrains-mono)] text-[32px] font-semibold text-[var(--color-ink)] tracking-tighter leading-none mt-1">
            {dash ?? `$${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </p>
        </div>
      </div>

      {/* Card 2: Payments Today */}
      <div className={cardClass}>
        <div className="px-6 py-5 flex flex-col gap-1">
          <p className="font-[family-name:var(--font-geist-sans)] text-xs font-medium text-[var(--color-ink-muted)] tracking-wider uppercase">
            Payments Today
          </p>
          <p className="font-[family-name:var(--font-jetbrains-mono)] text-[32px] font-semibold text-[var(--color-ink)] tracking-tighter leading-none mt-1">
            {dash ?? transactionCount}
          </p>
        </div>
      </div>

      {/* Card 3: Bridge Speed */}
      <div className={cardClass}>
        <div className="px-6 py-5 flex flex-col gap-1">
          <p className="font-[family-name:var(--font-geist-sans)] text-xs font-medium text-[var(--color-ink-muted)] tracking-wider uppercase">
            Bridge Speed (Avg)
          </p>
          <p className="font-[family-name:var(--font-jetbrains-mono)] text-[32px] font-semibold text-[var(--color-ink)] tracking-tighter leading-none mt-1">
            12s
          </p>
        </div>
      </div>

      {/* Card 4: Points Balance */}
      <div className={cardClass}>
        <div className="px-6 py-5 flex flex-col gap-1">
          <p className="font-[family-name:var(--font-geist-sans)] text-xs font-medium text-[var(--color-ink-muted)] tracking-wider uppercase">
            Points Balance
          </p>
          <div className="flex flex-row items-center gap-3 mt-1">
            <p className="font-[family-name:var(--font-jetbrains-mono)] text-[32px] font-semibold text-[var(--color-ink)] tracking-tighter leading-none">
              {dash ?? pointsBalance.toLocaleString("en-US")}
            </p>
            {!loading && <TierBadge tier={tier} />}
          </div>
        </div>
      </div>
    </div>
  );
}
