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
    return <p className="text-sm text-[var(--a-muted)]">Loading…</p>;
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
      
      {bounties.length === 0 && (
        <>
          <li>
            <article
              className="a-card flex h-full flex-col place-items-center justify-center gap-2.5 p-6 text-center"
              style={{
                border: "1px dashed var(--a-line)",
                background: "transparent",
              }}
            >
              <div
                className="font-[family-name:var(--font-display)] text-[13px] font-extrabold tracking-[0.06em]"
                style={{ color: "var(--a-muted)" }}
              >
                SLOT OPEN
              </div>
              <p className="m-0 text-[12.5px] leading-relaxed" style={{ color: "var(--a-subtle)" }}>
                Your bounty shows up here the moment the USDC is locked in escrow.
              </p>
              <button
                className="a-cut-sm mt-1 px-4 py-2 font-[family-name:var(--font-display)] text-[11px] font-bold tracking-[0.06em] uppercase"
                style={{ background: "rgba(17,17,17,.04)", color: "var(--a-subtle)" }}
                onClick={() => {
                  const event = new CustomEvent("arbiter:drawer", { detail: "create" });
                  window.dispatchEvent(event);
                }}
              >
                + Post bounty
              </button>
            </article>
          </li>
          <li>
            <article
              className="a-card flex h-full flex-col place-items-center justify-center gap-2.5 p-6 text-center"
              style={{
                border: "1px dashed var(--a-line)",
                background: "transparent",
              }}
            >
              <div
                className="font-[family-name:var(--font-display)] text-[13px] font-extrabold tracking-[0.06em]"
                style={{ color: "var(--a-muted)" }}
              >
                WANT TO WORK?
              </div>
              <p className="m-0 text-[12.5px] leading-relaxed" style={{ color: "var(--a-subtle)" }}>
                No login needed to read the grading criteria. A wallet is only needed to submit.
              </p>
            </article>
          </li>
        </>
      )}
    </ul>
  );
}
