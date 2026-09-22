"use client";

// =============================================================================
// bounty-card.tsx — one bounty as an object you can scan, not a line in a ledger.
//
// What the old row got wrong, and what each part here answers:
//
//   E1  the amount was small mono text at the right edge, competing with "copy id".
//       → AmountBlock: a different material, the card's visual anchor.
//   H1  "8 Sept, 21:19 · worker 0x4354…e3A9" glued a timestamp to an identity with a middot.
//       → the two live in different places now: time on the status strip, worker in its own row.
//   —   five rows showed the same truncated sentence, so the eye had nothing to grab.
//       → the anchor is the NUMBER, which differs per bounty even when the briefs repeat.
//
// The bottom strip carries state + countdown, borrowed from how ticket boards mark a live
// listing: it reads as a status light on an otherwise static card.
// =============================================================================

import Link from "next/link";
import { AMoney } from "@/components/arbiter/ui/a-money";
import { AChip } from "@/components/arbiter/ui/a-chip";
import { Serration } from "@/components/arbiter/ui/serration";
import {
  type BountyState,
  bountyState,
  isClaimable,
  isUrgent,
  shortCode,
  stripLabel,
} from "@/lib/arbiter/bounty-display";
import { displayBrief } from "@/lib/arbiter/legacy-vietnamese-copy";

export interface BountyCardData {
  id: string;
  brief: string;
  amount_usdc: number;
  deadline: string;
  status: string;
  worker_id: string | null;
  rubric_count?: number;
}

export function BountyCard({
  bounty,
  now,
  action,
}: {
  bounty: BountyCardData;
  now: number;
  action?: React.ReactNode;
}) {
  const state = bountyState(bounty.worker_id, bounty.status, bounty.deadline, now);
  const urgent = isUrgent(bounty.deadline, now);
  const closed = state === "closed" || state === "expired";

  const formattedDeadline = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(bounty.deadline));

  return (
    <article
      className={`a-card flex h-full flex-col ${closed ? "done" : ""}`}
      style={{
        background: "var(--a-card)",
        border: "1px solid var(--a-line-dim)",
        position: "relative",
        transition: "0.16s",
      }}
    >
      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Header */}
        <div className="flex gap-3">
          <div
            className="a-cut-sm grid h-10 w-10 flex-none place-items-center font-[family-name:var(--font-display)] text-sm font-bold"
            style={{ background: "rgba(17,17,17,.04)", color: "var(--a-subtle)" }}
            aria-hidden="true"
          >
            AI
          </div>
          <div>
            <h3
              className="line-clamp-1 font-[family-name:var(--font-display)] text-[14px] font-bold"
              style={{ color: "var(--a-text)" }}
            >
              {displayBrief(bounty.brief).split(".")[0] || "Bounty"}
            </h3>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <AChip variant="accent">AI JUDGED</AChip>
              {typeof bounty.rubric_count === "number" && bounty.rubric_count > 0 && (
                <AChip>{bounty.rubric_count} CRITERIA</AChip>
              )}
            </div>
          </div>
        </div>

        {/* Money Block */}
        <AMoney amountUsdc={bounty.amount_usdc} label="BOUNTY PRIZE" dim={closed} />

        {/* Brief */}
        <p
          className="line-clamp-2 text-[12.5px] leading-relaxed"
          style={{ color: "var(--a-text)" }}
        >
          {displayBrief(bounty.brief)}
        </p>

        {/* Meta / Claim */}
        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="font-[family-name:var(--font-jetbrains-mono)] text-[11px]" style={{ color: "var(--a-muted)" }}>
            Deadline: {formattedDeadline.replace(",", "")} GMT+7
          </span>
          {action && isClaimable(state) ? (
            action
          ) : (
            <Link
              href={`/arbiter/bounty/${bounty.id}`}
              className="font-[family-name:var(--font-display)] text-[11px] font-bold tracking-[0.06em] uppercase transition-colors hover:opacity-70"
              style={{ color: "var(--a-acc)" }}
            >
              + DETAILS ›
            </Link>
          )}
        </div>
      </div>

      {/* Strip */}
      <div
        className="flex items-center gap-2 border-t px-4 py-2"
        style={{
          borderColor: "var(--a-line-dim)",
          background: "rgba(17,17,17,.035)",
        }}
      >
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
            state === "unclaimed" ? "animate-pulse" : ""
          }`}
          style={{
            background: state === "unclaimed" ? "var(--a-acc)" : "var(--a-subtle)",
          }}
          aria-hidden="true"
        />
        <span
          className={`a-tnum font-[family-name:var(--font-jetbrains-mono)] text-[10px] tracking-[0.08em]`}
          style={{ color: urgent && !closed ? "var(--a-acc)" : "var(--a-muted)" }}
        >
          {state === "unclaimed" ? "LIVE · " : ""}
          {stripLabel(state, bounty.status, bounty.deadline, now)}
        </span>
        <span
          className="ml-auto font-[family-name:var(--font-jetbrains-mono)] text-[10px] tracking-[0.08em]"
          style={{ color: "var(--a-subtle)" }}
        >
          {shortCode(bounty.id)}
        </span>
      </div>

      <Serration dim={closed} />
    </article>
  );
}
