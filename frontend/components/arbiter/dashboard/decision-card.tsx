"use client";

import { useSettlement } from "@/components/arbiter/use-settlement";
import { killFeeBps, workerAmountUsdc, posterAmountUsdc } from "@/lib/arbiter/kill-fee";
import { decideTier } from "@/lib/arbiter/tiers";
import { shortCode } from "@/lib/arbiter/bounty-display";
import type { BountyCardData } from "@/components/arbiter/bounty-card";
import type { SettlementVerdict } from "@/components/arbiter/settlement-panel";
import { displayBrief } from "@/lib/arbiter/legacy-vietnamese-copy";

export function DecisionCard({
  bounty,
  verdict,
  onChanged,
}: {
  bounty: BountyCardData;
  verdict: SettlementVerdict;
  onChanged: () => Promise<void> | void;
}) {
  const { busy, note, setNote, error, approve, reject, objectT1 } = useSettlement(bounty.id, onChanged);

  const tier = decideTier({
    totalScore: verdict.total_score,
    confidence: verdict.confidence,
    outOfScope: verdict.decision === "REFUSE",
  }).tier;

  const isT1 = tier === "T1";
  const feeBps = killFeeBps({ totalScore: verdict.total_score, tier: tier ?? "T3" });
  const workerGets = workerAmountUsdc(bounty.amount_usdc, feeBps);
  const posterGets = posterAmountUsdc(bounty.amount_usdc, feeBps);

  const scoreClass =
    tier === "T1" ? "text-[var(--a-ok)] border-[var(--a-ok)]" :
    tier === "T2" ? "text-[var(--a-warn)] border-[var(--a-warn)]" :
    "text-[var(--a-bad)] border-[var(--a-bad)]";

  const colorClass =
    tier === "T1" ? "ok" :
    tier === "T2" ? "warn" : "bad";

  return (
    <article className="a-card overflow-hidden" style={{ border: "1px solid rgba(var(--a-acc-rgb),.42)", boxShadow: "0 0 0 3px rgba(var(--a-acc-rgb),.07),0 6px 22px -16px rgba(var(--a-acc-rgb),.7)" }}>
      <div className="grid gap-[18px] p-[16px_18px] sm:grid-cols-[auto_1fr_auto]">
        
        {/* Score box */}
        <div className={`a-cut-sm flex items-center gap-3 border bg-[rgba(17,17,17,.035)] p-[10px_12px] sm:col-auto col-span-full ${scoreClass}`}>
          <span className={`a-tnum font-[family-name:var(--font-jetbrains-mono)] text-[27px] font-extrabold leading-none ${colorClass === 'ok' ? 'text-[var(--a-ok)]' : colorClass === 'warn' ? 'text-[var(--a-warn)]' : 'text-[var(--a-bad)]'}`}>
            {verdict.total_score}
          </span>
          <div>
            <div className="font-[family-name:var(--font-jetbrains-mono)] text-[8.5px] uppercase tracking-[0.14em]" style={{ color: "var(--a-muted)" }}>SCORE</div>
            <div className={`mt-1 text-xs font-semibold ${colorClass === 'ok' ? 'text-[var(--a-ok)]' : colorClass === 'warn' ? 'text-[var(--a-warn)]' : 'text-[var(--a-bad)]'}`}>
              {verdict.total_score >= 100 ? "Pass" : "Failed"}
            </div>
          </div>
        </div>

        {/* Main brief */}
        <div className="sm:col-auto col-span-full">
          <p className="m-0 mb-[7px] text-[14px] font-bold leading-[1.35] text-[var(--a-text)]">
            {displayBrief(bounty.brief)}
          </p>
          <p className="m-0 text-[12.5px] leading-[1.55] text-[var(--a-muted)]">
            Arbiter graded it <b className="text-[var(--a-text)] font-bold">{tier === "T1" ? "a pass" : "a fail / low confidence"}</b> — your confirmation is needed.
            The worker submitted under code {shortCode(bounty.id)}.
          </p>
        </div>

        {/* Money */}
        <div className="sm:text-right sm:col-auto col-span-full font-[family-name:var(--font-jetbrains-mono)] whitespace-nowrap">
          <span className="a-tnum text-[22px] font-extrabold leading-none text-[var(--a-acc)]">{bounty.amount_usdc} USDC</span>
          <span className="mt-[6px] block text-[9px] uppercase tracking-[0.13em] text-[var(--a-muted)]">IN ESCROW</span>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-[8px] border-t p-[12px_18px] bg-[rgba(17,17,17,.035)]" style={{ borderColor: "var(--a-line-dim)" }}>
        <span className="mr-auto font-[family-name:var(--font-jetbrains-mono)] text-[10px] uppercase tracking-[0.06em] text-[var(--a-subtle)]">
          On-chain · irreversible
        </span>
        
        {tier !== "T1" && (
          <label className="sr-only">Reason for refusing (at least 10 characters)</label>
        )}
        {(tier === "T1" || tier === "T2") && (
          <input 
            type="text" 
            placeholder={isT1 ? "Reason for the objection…" : "Reason for refusing (10+ characters)…"}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="a-cut-sm flex-1 sm:flex-none border border-[var(--a-line-dim)] bg-white px-3 py-[6px] text-[12px] text-[var(--a-text)] outline-none focus:border-[var(--a-acc)]"
          />
        )}
        
        <button
          disabled={busy || (note.trim().length < 10 && tier !== "T1")}
          className="a-cut-sm px-4 py-2 font-[family-name:var(--font-display)] text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--a-text)] disabled:opacity-50"
          style={{ background: "rgba(17,17,17,.04)" }}
          onClick={() => isT1 ? objectT1() : reject(verdict.id)}
        >
          {isT1 ? "Object" : feeBps > 0 ? `Partial · ${workerGets}$ / ${posterGets}$` : `Reject · refund ${posterGets}$`}
        </button>

        {tier !== "T3" && (
          <button
            disabled={busy}
            className="a-cut-sm px-4 py-2 font-[family-name:var(--font-display)] text-[11px] font-bold uppercase tracking-[0.06em] text-white disabled:opacity-50"
            style={{ background: "var(--a-acc)" }}
            onClick={() => approve(verdict.id)}
          >
            Pay full {bounty.amount_usdc}$
          </button>
        )}
      </div>
      {error && <p className="px-[18px] pb-3 m-0 text-xs text-[var(--a-bad)]">{error}</p>}
    </article>
  );
}
