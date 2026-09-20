"use client";

// =============================================================================
// settlement-panel.tsx — every action that ends a bounty, with its price shown first.
//
// THE RULE OF THIS FILE: a button that moves money says how much, in numbers, before it is
// pressed. A bare "Từ chối" that quietly costs 30% deters nobody and ambushes the honest.
//
// Nothing here computes a fee or a deadline of its own. The numbers come from kill-fee.ts
// and settlement-clock.ts, the same modules the server settles with, because a rule written
// twice becomes two rules that disagree — and the disagreement always surfaces as somebody
// not getting paid.
// =============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { useWriteContract, useConfig } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { keccak256, toBytes } from "viem";
import { PillButton } from "@/components/ui/pill-button";
import { arbiterEscrowAbi } from "@/lib/escrow-abi";
import { escrowAddressClient } from "@/lib/arc-addresses-client";
import { killFeeBps, posterAmountUsdc, workerAmountUsdc } from "@/lib/arbiter/kill-fee";
import { settlementState } from "@/lib/arbiter/settlement-clock";
import { decideTier } from "@/lib/arbiter/tiers";
import { useCountdown } from "@/components/arbiter/use-countdown";

export interface SettlementVerdict {
  id: string;
  decision: string;
  total_score: number;
  confidence: number;
  release_tx: string | null;
}

interface Props {
  bountyId: string;
  amountUsdc: number;
  submittedAt: string | null;
  status: string;
  verdict: SettlementVerdict | null;
  isPoster: boolean;
  isWorker: boolean;
  onChanged: () => Promise<void> | void;
}

const usdc = (n: number) => `${Number(n.toFixed(6))} USDC`;

function hoursLeft(seconds: number): string {
  if (seconds >= 3600) return `${Math.floor(seconds / 3600)} giờ ${Math.floor((seconds % 3600) / 60)} phút`;
  if (seconds >= 60) return `${Math.floor(seconds / 60)} phút`;
  return `${seconds} giây`;
}

export function SettlementPanel(props: Props) {
  const { bountyId, amountUsdc: amount, submittedAt, status, verdict, isPoster, isWorker, onChanged } = props;
  const now = useCountdown();
  const config = useConfig();
  const { writeContractAsync } = useWriteContract();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const call = useCallback(
    async (path: string, body: object) => {
      setBusy(true);
      setError("");
      try {
        const res = await fetch(path, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error ?? "không thực hiện được");
        await onChanged();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    },
    [onChanged],
  );

  const settled = status === "RELEASED" || status === "REFUNDED" || Boolean(verdict?.release_tx);
  const tier = verdict
    ? decideTier({
        totalScore: verdict.total_score,
        confidence: verdict.confidence,
        outOfScope: verdict.decision === "REFUSE",
      }).tier
    : null;

  const clock = settlementState({
    tier,
    submittedAtMs: submittedAt ? new Date(submittedAt).getTime() : null,
    resolved: settled,
    nowMs: now,
  });

  // The clock ran out while somebody had the page open. Finishing it is open to any caller,
  // so the page just does it — waiting for the right person to visit would leave the worker
  // unpaid for no reason. Once per mount, so a failure cannot become a loop.
  const finalized = useRef(false);
  useEffect(() => {
    if (finalized.current || busy || clock.phase !== "auto-release-due") return;
    finalized.current = true;
    void call("/api/settlement/finalize", { bounty_id: bountyId });
  }, [clock.phase, busy, bountyId, call]);

  /** Worker's way out when this platform is not answering: their own signature, no server. */
  async function selfRelease() {
    setBusy(true);
    setError("");
    try {
      const tx = await writeContractAsync({
        address: escrowAddressClient(),
        abi: arbiterEscrowAbi,
        functionName: "timeoutRelease",
        args: [keccak256(toBytes(bountyId))],
      });
      await waitForTransactionReceipt(config, { hash: tx });
      // The chain is the truth; the database catches up by reading it, never by being told.
      await fetch("/api/settlement/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bounty_id: bountyId }),
      });
      await onChanged();
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      setError(/user rejected|denied/i.test(raw) ? "Bạn đã từ chối ký." : raw);
    } finally {
      setBusy(false);
    }
  }

  if (!verdict || clock.phase === "closed") return null;

  const feeBps = tier === "T1" ? killFeeBps({ totalScore: verdict.total_score, tier: "T1" })
    : killFeeBps({ totalScore: verdict.total_score, tier: tier ?? "T3" });
  const workerGets = workerAmountUsdc(amount, feeBps);
  const posterGets = posterAmountUsdc(amount, feeBps);

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border-light)] bg-white/50 px-5 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-[family-name:var(--font-heading)] text-base font-semibold text-[var(--color-ink)]">
          {tier === "T1" ? "Máy đã quyết trả tiền" : "Đang chờ người đăng quyết"}
        </h3>
        <span className="text-xs text-[var(--color-ink-muted)]">
          Còn {hoursLeft(clock.secondsLeft)}
        </span>
      </div>

      {/* The default, stated plainly. This sentence is the mechanism. */}
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink)]">
        Không làm gì thì hết giờ người làm nhận đủ <span className="font-semibold">{usdc(amount)}</span>.
      </p>

      {isPoster && (
        <>
          <label className="mt-3 block text-xs text-[var(--color-ink-muted)]">
            {tier === "T1" ? "Lý do phản đối" : "Lý do từ chối"} — nêu rõ tiêu chí nào hụt
            <textarea
              className="mt-1 w-full rounded-md border border-[var(--color-border-light)] bg-white px-3 py-2 text-sm text-[var(--color-ink)]"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: tiêu chí 2 yêu cầu so sánh giá, bài không có phần này."
            />
          </label>

          <div className="mt-3 flex flex-wrap gap-3">
            {tier === "T2" && (
              <PillButton
                variant="primary"
                disabled={busy}
                onClick={() =>
                  call("/api/escalation", {
                    bounty_id: bountyId, verdict_id: verdict.id, poster_action: "APPROVE",
                  })
                }
              >
                Duyệt — trả đủ {usdc(amount)}
              </PillButton>
            )}
            <PillButton
              variant="secondary"
              disabled={busy || note.trim().length < 10}
              onClick={() =>
                tier === "T1"
                  ? call("/api/settlement/object", { bounty_id: bountyId, note })
                  : call("/api/escalation", {
                      bounty_id: bountyId, verdict_id: verdict.id, poster_action: "REJECT", note,
                    })
              }
            >
              {tier === "T1" ? "Phản đối" : "Từ chối"} — người làm nhận {usdc(workerGets)}, bạn nhận lại {usdc(posterGets)}
            </PillButton>
          </div>
          {note.trim().length < 10 && (
            <p className="mt-1.5 text-xs text-[var(--color-ink-muted)]">
              Cần viết lý do (ít nhất 10 ký tự) thì mới bấm được — bài đã nằm trong tay bạn rồi,
              nên một lời từ chối không giải thích được là thứ cơ chế này không nhận.
            </p>
          )}
        </>
      )}

      {isWorker && (
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-muted)]">
          Người đăng có thể {tier === "T1" ? "phản đối" : "từ chối"} trong thời gian này; nếu vậy bạn
          vẫn nhận {usdc(workerGets)}. Hết giờ mà họ không làm gì, bạn nhận đủ.
        </p>
      )}

      {isWorker && clock.phase === "auto-release-due" && (
        <div className="mt-3">
          <PillButton variant="primary" disabled={busy} onClick={selfRelease}>
            Tự nhận tiền bằng ví của bạn
          </PillButton>
          <p className="mt-1.5 text-xs text-[var(--color-ink-muted)]">
            Ký thẳng lên hợp đồng, không cần máy chủ này còn sống.
          </p>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-[var(--color-danger,#b00)]">{error}</p>}
    </div>
  );
}
