"use client";

import Link from "next/link";
import { type BountyState, bountyState, isUrgent, stripLabel } from "@/lib/arbiter/bounty-display";
import type { BountyCardData } from "@/components/arbiter/bounty-card";
import { useCountdown } from "@/components/arbiter/use-countdown";

export function CompactRow({
  bounty,
  role,
}: {
  bounty: BountyCardData;
  role: "poster" | "worker";
}) {
  const now = useCountdown();
  const state = bountyState(bounty.worker_id, bounty.status, bounty.deadline, now);
  
  const closed = state === "closed" || state === "expired";
  const urgent = isUrgent(bounty.deadline, now);

  const isPoster = role === "poster";
  const icon = closed ? "✓" : isPoster ? "◷" : "✎";
  const label = stripLabel(state, bounty.status, bounty.deadline, now);

  return (
    <div className={`a-qrow flex flex-col gap-[14px] items-start sm:flex-row sm:items-center p-[12px_15px] transition-[0.15s] ${closed ? "paid" : ""}`} style={{ border: "1px solid var(--a-line-dim)", background: "var(--a-card)" }}>
      <span className="a-cut-sm hidden sm:grid h-8 w-8 flex-none place-items-center text-[13px]" style={{ border: "1px solid var(--a-line-dim)", background: "rgba(17,17,17,.04)", color: "var(--a-muted)" }}>
        {icon}
      </span>
      <div className="flex-1">
        <p className="m-0 text-[13px] font-semibold leading-[1.4] text-[var(--a-text)]">
          {bounty.brief}
        </p>
        <p className="m-0 mt-1 font-[family-name:var(--font-jetbrains-mono)] text-[10px] uppercase tracking-[0.06em]" style={{ color: urgent && !closed ? "var(--a-acc)" : "var(--a-subtle)" }}>
          {label} · {bounty.worker_id ? `${bounty.worker_id.slice(0, 6)}…${bounty.worker_id.slice(-4)}` : "UNCLAIMED"}
        </p>
      </div>
      <div className="flex w-full items-center justify-between sm:w-auto sm:flex-col sm:items-end gap-[5px]">
        <span className="a-tnum font-[family-name:var(--font-jetbrains-mono)] text-[15px] font-extrabold" style={{ color: closed ? "var(--a-text)" : "var(--a-text)" }}>
          {bounty.amount_usdc}$
        </span>
        <Link
          href={`/arbiter/bounty/${bounty.id}`}
          className="a-cut-sm px-3 py-[4px] font-[family-name:var(--font-display)] text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--a-subtle)] hover:text-[var(--a-text)]"
          style={{ background: "rgba(17,17,17,.04)" }}
        >
          View
        </Link>
      </div>
    </div>
  );
}
