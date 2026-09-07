"use client";

// bounty-row.tsx — one line of the ledger, and the affordance that it opens.
//
// The row led with a truncated uuid once; nobody remembers "4b2a2d92…", and on a page whose
// job is to convince a stranger, an anonymous case proves nothing. The brief leads instead.
//
// But briefs repeat. Five bounties in this pilot open with the same sentence and truncate at
// the same word, which reproduced the exact problem the uuid had: rows you cannot tell
// apart. So each row also carries the date and the worker it was assigned to — the two
// things that actually differ between otherwise identical cases.
//
// The id itself is behind a copy button. An operator still needs it for the submit form; a
// reader should not have to look at 36 characters of hex to serve that one person.
//
// The whole layout depends on people opening rows, so the row looks openable: rotating
// chevron, pointer cursor, hover wash, and real button semantics for the keyboard. The copy
// button sits outside that button — nesting one button inside another is invalid HTML and
// browsers resolve it unpredictably.

import { BountyStatusBadge } from "@/components/arbiter/bounty-status-badge";
import { CopyButton } from "@/components/ui/copy-button";

interface BountyRowData {
  id: string; status: string; amount_usdc: number; brief: string; worker_id: string; created_at?: string;
}

function shortAddress(addr: string): string {
  return addr && addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr || "unassigned";
}

// Time of day, not just the date. A pilot batch gets created in one sitting by one person:
// six rows came out reading "17 Aug · worker 0xf9bc6…45cf", which distinguished nothing and
// repeated the failure of the uuid column it replaced. The minute is what actually differs.
function shortDate(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function BountyRow({
  bounty, expanded, onToggle,
}: {
  bounty: BountyRowData;
  expanded: boolean;
  onToggle: () => void;
}) {
  const date = shortDate(bounty.created_at);

  // Below sm the status and amount drop onto their own line. Keeping all four columns side
  // by side at 375px squeezed the brief down to "Viết m…".
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
    <div className="flex items-start transition-colors hover:bg-[var(--color-accent)]/[0.04] sm:items-center">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 py-3.5 pl-4 text-left sm:items-center"
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
          <span className="mt-0.5 block truncate text-xs text-[var(--color-ink-muted)]">
            {date && <>{date} · </>}worker{" "}
            <span className="font-[family-name:var(--font-jetbrains-mono)]">{shortAddress(bounty.worker_id)}</span>
          </span>
          <span className="mt-2 flex items-center justify-between gap-3 sm:hidden">{meta}</span>
        </span>

        <span className="hidden shrink-0 items-center gap-3 sm:flex">{meta}</span>
      </button>

      <span className="shrink-0 self-center pr-3 pl-1">
        <CopyButton value={bounty.id} label="Copy bounty id" />
      </span>
    </div>
  );
}
