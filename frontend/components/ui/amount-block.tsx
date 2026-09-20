// =============================================================================
// amount-block.tsx — the visual anchor. ONE formula, used everywhere money appears.
//
// The old board rendered the amount as small mono text at the right edge, in the same
// material as everything else and directly competing with a "copy id" link — the most
// important number on the screen had the least weight (catalog E1, missing material contrast).
//
// The fix is not a bigger font, it is a different MATERIAL: a tinted panel that sits DARKER
// than the white card it lives on. Darker matters — a second bright area would fight the card
// for attention (B2). This recedes and holds, the way a plaque does.
//
// Used identically on the board card and at the top of the detail page, so a bounty looks
// like the same object in both places.
// =============================================================================

export function AmountBlock({
  amountUsdc,
  label = "Tiền treo",
  size = "md",
}: {
  amountUsdc: number;
  label?: string;
  size?: "md" | "lg";
}) {
  const number = size === "lg" ? "text-4xl" : "text-2xl";

  return (
    <div
      className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-light-2)]
                 px-4 py-3"
    >
      <p className="text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">{label}</p>
      <p className="mt-0.5 flex items-baseline gap-1.5">
        {/* tnum keeps columns of amounts aligned down the grid — proportional digits make a
            list of numbers look ragged even when every value is correct. */}
        <span
          className={`tnum font-[family-name:var(--font-heading)] font-semibold text-[var(--color-ink)] ${number}`}
        >
          {amountUsdc}
        </span>
        <span className="text-sm font-medium text-[var(--color-ink-muted)]">USDC</span>
      </p>
    </div>
  );
}
