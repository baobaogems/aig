"use client";

// =============================================================================
// settlement-panel.tsx — every action that ends a bounty, with its price shown first.
//
// TWO RULES OF THIS FILE.
//
// 1. A button that moves money says how much, in numbers, before it is pressed. A bare
//    "Từ chối" that quietly costs 30% deters nobody and ambushes the honest.
//
// 2. Deciding whether to pay is the POSTER's, never the worker's. The old verdict card
//    rendered "Approve — pay the worker" to whoever was looking and merely made it a no-op
//    for anyone else; the server refused them, so no money could move, but showing a worker
//    a button to approve their own work is its own kind of wrong. Every control below is
//    behind `isPoster`. The worker is told what is happening and what they are owed —
//    which is information, not authority.
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
  /** 2 = opened on the frozen v2 escrow, which has no clock and no kill fee. */
  escrowVersion: number;
  verdict: SettlementVerdict | null;
  isPoster: boolean;
  isWorker: boolean;
  onChanged: () => Promise<void> | void;
}

/**
 * Anchor so a link can drop someone straight onto the decision.
 *
 * The browser's own #hash scroll fires before this panel exists — the page is server-rendered
 * and the panel only appears once the bounty has been fetched — so the scroll is redone here
 * on mount. Without that, the link looks broken in exactly the case it was made for.
 */
export const SETTLEMENT_ANCHOR = "quyet-dinh";

const usdc = (n: number) => `${Number(n.toFixed(6))} USDC`;

function hoursLeft(seconds: number): string {
  if (seconds >= 3600) return `${Math.floor(seconds / 3600)} giờ ${Math.floor((seconds % 3600) / 60)} phút`;
  if (seconds >= 60) return `${Math.floor(seconds / 60)} phút`;
  return `${seconds} giây`;
}

export function SettlementPanel(props: Props) {
  const {
    bountyId, amountUsdc: amount, submittedAt, status, escrowVersion, verdict, isPoster, isWorker, onChanged,
  } = props;
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

  // Re-run the #hash scroll once this panel is actually in the DOM.
  //
  // Two things fight this. The panel does not exist when the browser handles the hash — the
  // page is server-rendered and the panel appears only after the bounty is fetched — and the
  // router puts the window back at the top during hydration, which swallows a single early
  // scroll. So it keeps trying briefly until the element holds its place, then stops.
  const scrolledToAnchor = useRef(false);
  useEffect(() => {
    if (scrolledToAnchor.current) return;
    if (typeof window === "undefined" || window.location.hash !== `#${SETTLEMENT_ANCHOR}`) return;

    let tries = 0;
    const id = window.setInterval(() => {
      const el = document.getElementById(SETTLEMENT_ANCHOR);
      if (el) {
        const { top } = el.getBoundingClientRect();
        // "auto", not "smooth": a smooth scroll still in flight is trivially cancelled by
        // the router's own reset, and then nothing visible happens at all.
        if (top < 0 || top > window.innerHeight * 0.75) {
          el.scrollIntoView({ block: "center", behavior: "auto" });
        } else {
          scrolledToAnchor.current = true;
          window.clearInterval(id);
          return;
        }
      }
      if (++tries > 20) window.clearInterval(id); // ~3s, then give up quietly
    }, 150);
    return () => window.clearInterval(id);
  }, []);

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

  // A v2 bounty never gets a settlement clock — that concept arrived with v3. Without this
  // branch the panel returned null for them, which left the POSTER of a judged v2 bounty with
  // no way to pay at all. One such bounty was live, holding real money, when this was found.
  const legacyAwaitingPoster =
    escrowVersion !== 3 && !settled && status === "JUDGED" && Boolean(verdict);

  if (legacyAwaitingPoster && verdict) {
    if (!isPoster) {
      return (
        <div id={SETTLEMENT_ANCHOR} className="rounded-[var(--radius-card)] border border-[var(--color-border-light)] bg-white/50 px-5 py-4">
          <p className="text-sm leading-relaxed text-[var(--color-ink-muted)]">
            Việc này mở từ trước khi có luật mới, nên nó kết thúc theo luật cũ: quyền quyết trả
            tiền thuộc về người đăng. Nếu họ không xử trước hạn, tiền quay về ví họ.
          </p>
        </div>
      );
    }
    return (
      <div id={SETTLEMENT_ANCHOR} className="rounded-[var(--radius-card)] border border-[var(--color-border-light)] bg-white/50 px-5 py-4">
        <h3 className="font-[family-name:var(--font-heading)] text-base font-semibold text-[var(--color-ink)]">
          Việc cũ — quyết định của bạn
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink)]">
          Việc này khoá tiền trên hợp đồng đời trước, nên không chia phần được: trả đủ
          <span className="font-semibold"> {usdc(amount)}</span>, hoặc không trả và tự đòi lại
          tiền sau hạn.
        </p>
        <label className="mt-3 block text-xs text-[var(--color-ink-muted)]">
          Lý do (bắt buộc nếu từ chối)
          <textarea
            className="mt-1 w-full rounded-md border border-[var(--color-border-light)] bg-white px-3 py-2 text-sm text-[var(--color-ink)]"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-3">
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
          <PillButton
            variant="secondary"
            disabled={busy || note.trim().length < 10}
            onClick={() =>
              call("/api/escalation", {
                bounty_id: bountyId, verdict_id: verdict.id, poster_action: "REJECT", note,
              })
            }
          >
            Từ chối — không trả, đòi lại sau hạn
          </PillButton>
        </div>
        {error && <p className="mt-2 text-xs text-[var(--color-accent)]">{error}</p>}
      </div>
    );
  }

  if (!verdict || clock.phase === "closed") return null;

  const feeBps = tier === "T1" ? killFeeBps({ totalScore: verdict.total_score, tier: "T1" })
    : killFeeBps({ totalScore: verdict.total_score, tier: tier ?? "T3" });
  const workerGets = workerAmountUsdc(amount, feeBps);
  const posterGets = posterAmountUsdc(amount, feeBps);

  return (
    <div id={SETTLEMENT_ANCHOR} className="rounded-[var(--radius-card)] border border-[var(--color-border-light)] bg-white/50 px-5 py-4">
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

      {/* The worker gets the facts and no controls: whether to pay is not their call. */}
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
