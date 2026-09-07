// bounty-status-badge.tsx — the lifecycle status as something a stranger can read.
//
// The ledger used to print the raw enum: DRAFT, JUDGED, RELEASED, REFUNDED. Two of those
// are opposite outcomes — the worker was paid, or the money went back to the poster — and
// they looked identical: same weight, same colour, same shouting caps. On an evidence page
// that is the single most important distinction on screen.
//
// Colour alone would not fix it, so each terminal outcome also carries its own glyph:
// legible when printed, projected, or seen by someone who cannot separate red from green.

export type BountyStatus = "DRAFT" | "OPEN" | "SUBMITTED" | "JUDGED" | "RELEASED" | "REFUNDED";

interface Look {
  label: string;
  glyph: string;
  /** Hue for the border and fill — the 3:1 non-text rule applies here. */
  color: string;
  /** Colour for the label itself. Small text needs 4.5:1, which the bright cyan (2.88:1)
     and amber (2.22:1) both failed on this light surface. Same hue, darkened. */
  ink?: string;
  /** Terminal outcomes are filled; states still in motion are outlined. */
  filled: boolean;
}

const LOOK: Record<string, Look> = {
  DRAFT: { label: "Draft", glyph: "○", color: "var(--color-ink-muted)", filled: false },
  OPEN: { label: "Open for work", glyph: "○", color: "var(--color-ink-muted)", filled: false },
  SUBMITTED: { label: "Awaiting judgment", glyph: "◔", color: "var(--color-tier-t1)", ink: "var(--color-tier-t1-ink)", filled: false },
  JUDGED: { label: "Needs your call", glyph: "⚖", color: "var(--color-tier-t2)", ink: "var(--color-tier-t2-ink)", filled: false },
  RELEASED: { label: "Paid out", glyph: "↑", color: "var(--color-ink-success)", filled: true },
  REFUNDED: { label: "Refunded", glyph: "↩", color: "var(--color-tier-t3)", filled: true },
};

export function BountyStatusBadge({ status }: { status: string }) {
  const look = LOOK[status] ?? {
    label: status.toLowerCase(),
    glyph: "•",
    color: "var(--color-ink-muted)",
    filled: false,
  };

  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium"
      style={{
        color: look.ink ?? look.color,
        backgroundColor: look.filled
          ? `color-mix(in srgb, ${look.color} 14%, transparent)`
          : "transparent",
        border: `1px solid color-mix(in srgb, ${look.color} ${look.filled ? 40 : 25}%, transparent)`,
      }}
    >
      <span aria-hidden="true">{look.glyph}</span>
      {look.label}
    </span>
  );
}
