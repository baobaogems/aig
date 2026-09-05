"use client";

// bounty-row.tsx — one line of the ledger, and the affordance that it opens.
//
// The row used to lead with a truncated uuid. Nobody remembers "4b2a2d92…", and on a page
// whose job is to convince a stranger, an anonymous case proves nothing. The brief leads
// now; the id survives as a dim monospace line underneath, since it is still what an
// operator pastes into the submit form.
//
// The whole of this layout depends on people opening rows, so the row has to look openable:
// a rotating chevron, a pointer cursor, a hover wash, and real button semantics for the
// keyboard.

import { BountyStatusBadge } from "@/components/arbiter/bounty-status-badge";

interface BountyRowData { id: string; status: string; amount_usdc: number; brief: string }

export function BountyRow({
  bounty, expanded, onToggle,
}: {
  bounty: BountyRowData;
  expanded: boolean;
  onToggle: () => void;
}) {
  // Below sm the status and amount drop onto their own line. Keeping all four columns side
  // by side at 375px squeezed the brief down to "Viết m…", which defeats the point of
  // leading with it.
  const meta = (
    <>
      <BountyStatusBadge status={bounty.status} />
      <span className="tnum shrink-0 text-right font-[family-name:var(--font-jetbrains-mono)] text-sm text-[var(--color-ink)] sm:w-20">
        {bounty.amount_usdc}
        <span className="ml-1 text-xs text-[var(--color-ink-muted)]">USDC</span>
      </span>
    </>
  );

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className="flex w-full cursor-pointer items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[var(--color-accent)]/[0.04] sm:items-center"
    >
      <span
        aria-hidden="true"
        className="shrink-0 text-[var(--color-ink-muted)] transition-transform duration-200"
        style={{ transform: expanded ? "rotate(90deg)" : "none" }}
      >
        ›
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-[var(--color-ink)]">
          {bounty.brief?.trim() || <span className="italic text-[var(--color-ink-muted)]">No brief recorded</span>}
        </span>
        <span className="mt-0.5 block truncate font-[family-name:var(--font-jetbrains-mono)] text-[11px] text-[var(--color-ink-muted)]">
          {bounty.id}
        </span>
        <span className="mt-2 flex items-center justify-between gap-3 sm:hidden">{meta}</span>
      </span>

      <span className="hidden shrink-0 items-center gap-3 sm:flex">{meta}</span>
    </button>
  );
}
