"use client";

// =============================================================================
// points-tier-card.tsx — Points & Tier card, Pencil design
// Shows total points, tier progress bar, multiplier, revenue share
// =============================================================================

interface PointsTierCardProps {
  totalPoints: number;
  tier: string;
}

// Tier thresholds for progress bar
const TIER_THRESHOLDS: Record<string, { current: number; next: number; nextName: string }> = {
  Builder: { current: 0, next: 500, nextName: "Architect" },
  Architect: { current: 500, next: 5000, nextName: "Sovereign" },
  Sovereign: { current: 5000, next: 5000, nextName: "Sovereign" },
};

// Tier perks
const TIER_PERKS: Record<string, { multiplier: string; revenueShare: string }> = {
  Builder: { multiplier: "1.0x", revenueShare: "+5% bonus" },
  Architect: { multiplier: "2.0x (Early Bird)", revenueShare: "+10% bonus" },
  Sovereign: { multiplier: "3.0x (Elite)", revenueShare: "+20% bonus" },
};

function TierBadge({ tier }: { tier: string }) {
  return (
    <span className="rounded-full bg-[var(--color-chip-neutral)] px-2 py-1 font-[family-name:var(--font-jetbrains-mono)] text-sm text-[var(--color-ink-warn)] leading-none">
      {tier}
    </span>
  );
}

export function PointsTierCard({ totalPoints, tier }: PointsTierCardProps) {
  const thresholds = TIER_THRESHOLDS[tier] ?? TIER_THRESHOLDS.Builder;
  const perks = TIER_PERKS[tier] ?? TIER_PERKS.Builder;
  const isSovereign = tier === "Sovereign";

  // Progress within current tier band
  const progressPct = isSovereign
    ? 100
    : Math.min(
        100,
        Math.round(
          ((totalPoints - thresholds.current) / (thresholds.next - thresholds.current)) * 100
        )
      );

  return (
    <div className="bg-white border border-[var(--color-border-light)] shadow-[0_1px_1.75px_0_#0000000d]">
      {/* Card header */}
      <div className="flex flex-row items-center justify-between px-6 py-4 border-b border-[var(--color-border-light)]">
        <span className="font-[family-name:var(--font-jetbrains-mono)] text-base font-semibold text-[var(--color-ink)]">
          Points &amp; Tier
        </span>
        <TierBadge tier={tier} />
      </div>

      {/* Card body */}
      <div className="px-6 py-6 flex flex-col gap-4">
        {/* Total Points row */}
        <div className="flex flex-row items-center justify-between">
          <span className="font-[family-name:var(--font-geist-sans)] text-[13px] text-[var(--color-ink-muted)]">
            Total Points
          </span>
          <span className="font-[family-name:var(--font-jetbrains-mono)] text-[13px] font-semibold text-[var(--color-ink)]">
            {totalPoints.toLocaleString("en-US")} pts
          </span>
        </div>

        {/* Progress section */}
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-row items-center justify-between">
            <span className="font-[family-name:var(--font-geist-sans)] text-[11px] text-[var(--color-ink-muted)]">
              {isSovereign ? "Max tier reached" : `Next: ${thresholds.nextName}`}
            </span>
            <span className="font-[family-name:var(--font-geist-sans)] text-[11px] text-[var(--color-ink-muted)]">
              {isSovereign ? "" : `${thresholds.next.toLocaleString("en-US")} pts`}
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-4 bg-[var(--color-surface-panel)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-accent-bright)] rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Multiplier row */}
        <div className="flex flex-row items-center justify-between">
          <span className="font-[family-name:var(--font-geist-sans)] text-[13px] text-[var(--color-ink-muted)]">
            Multiplier
          </span>
          <span className="font-[family-name:var(--font-jetbrains-mono)] text-[13px] font-semibold text-[var(--color-accent-bright)]">
            {perks.multiplier}
          </span>
        </div>

        {/* Revenue Share row */}
        <div className="flex flex-row items-center justify-between">
          <span className="font-[family-name:var(--font-geist-sans)] text-[13px] text-[var(--color-ink-muted)]">
            Revenue Share
          </span>
          <span className="font-[family-name:var(--font-jetbrains-mono)] text-[13px] font-medium text-[var(--color-ink-success)]">
            {perks.revenueShare}
          </span>
        </div>
      </div>
    </div>
  );
}
