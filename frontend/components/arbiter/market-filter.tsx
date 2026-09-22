"use client";

import type { PrizeBand } from "@/lib/arbiter/prize-band";

export interface MarketFilterProps {
  status: "active" | "ended" | "all";
  onStatusChange: (v: "active" | "ended" | "all") => void;
  prize: PrizeBand;
  onPrizeChange: (v: PrizeBand) => void;
  prizeCounts: Record<PrizeBand, number>;
  resultCount: number;
}

export function MarketFilter({
  status,
  onStatusChange,
  prize,
  onPrizeChange,
  prizeCounts,
  resultCount,
}: MarketFilterProps) {
  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "ended", label: "Ended" },
    { value: "all", label: "All" },
  ] as const;

  const prizeOptions = [
    { value: "all", label: "Any" },
    { value: "under_1", label: "<1$" },
    { value: "1_to_5", label: "1–5$" },
    { value: "over_5", label: ">5$" },
  ] as const;

  return (
    <div
      className="flex flex-wrap items-center gap-x-8 gap-y-4 rounded-[var(--a-card)] px-4 py-3"
      style={{ background: "var(--a-bg-filter)", border: "none" }}
    >
      {/* STATUS GROUP */}
      <div className="flex flex-col gap-1.5">
        <span
          className="font-[family-name:var(--font-display)] text-[10px] font-bold uppercase tracking-[0.1em]"
          style={{ color: "var(--a-text-light-label)" }}
        >
          STATUS
        </span>
        <div role="radiogroup" aria-label="STATUS" className="flex flex-wrap gap-1.5">
          {statusOptions.map((o) => {
            const active = o.value === status;
            return (
              <button
                key={o.value}
                role="radio"
                aria-checked={active}
                onClick={() => onStatusChange(o.value)}
                className={
                  "flex items-center gap-1.5 rounded-[var(--a-pill)] px-3.5 py-1 text-sm transition-colors " +
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " +
                  "focus-visible:outline-[var(--a-acc)] " +
                  (active ? "font-semibold" : "font-normal hover:opacity-80")
                }
                style={{
                  color: active ? "var(--a-text-light-active)" : "var(--a-text-light-tab)",
                  background: "transparent",
                }}
              >
                {active && (
                  <span
                    className="block h-1.5 w-1.5 rounded-full"
                    style={{ background: "var(--a-text-light-active)" }}
                  />
                )}
                {o.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="hidden h-10 w-px md:block" style={{ background: "rgba(0,0,0,0.1)" }} />

      {/* BOUNTY PRIZE GROUP */}
      <div className="flex flex-col gap-1.5">
        <span
          className="font-[family-name:var(--font-display)] text-[10px] font-bold uppercase tracking-[0.1em]"
          style={{ color: "var(--a-text-light-label)" }}
        >
          BOUNTY PRIZE
        </span>
        <div role="radiogroup" aria-label="BOUNTY PRIZE" className="flex flex-wrap gap-1.5">
          {prizeOptions.map((o) => {
            const active = o.value === prize;
            const empty = prizeCounts[o.value] === 0;
            return (
              <button
                key={o.value}
                role="radio"
                aria-checked={active}
                onClick={() => onPrizeChange(o.value)}
                className={
                  "rounded-[var(--a-pill)] px-3.5 py-1 text-sm transition-colors " +
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " +
                  "focus-visible:outline-[var(--a-acc)] " +
                  (active ? "font-semibold" : "font-normal hover:opacity-80") +
                  (empty && !active ? " opacity-50" : "")
                }
                style={{
                  color: active ? "var(--a-text-light-active)" : "var(--a-text-light-tab)",
                  background: "transparent",
                }}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </div>

      <span
        className="ml-auto self-end font-[family-name:var(--font-display)] text-[11px] font-bold uppercase tracking-[0.05em]"
        style={{ color: "var(--a-text-light-label)" }}
      >
        {resultCount} {resultCount === 1 ? "result" : "results"}
      </span>
    </div>
  );
}
