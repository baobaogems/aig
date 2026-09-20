// =============================================================================
// settle-bounty.ts — the ONE place money leaves the escrow.
//
// Three routes can end a bounty (the poster approving, the poster objecting or rejecting at
// a price, and the clock running out). Writing the payout three times would give us three
// slightly different payout rules within a month, and the difference would only surface as
// somebody not getting paid. So it is written once, here.
//
// Order is deliberate and must not be rearranged:
//   1. chain first — until USDC has actually moved, nothing is true
//   2. record the split + tx, so the spend ledger and stats can never under-count it
//   3. status
//   4. points last — the least important of the four, and the only one safe to lose
// =============================================================================

import "server-only";
import { isDryRun, releaseEscrowV2, settleEscrow } from "../escrow";
import { isCurrentVersion } from "../escrow-version";
import { awardBountyPoints } from "../points";
import { liveCaps } from "./spend-ledger";
import { setVerdictSettlement, updateBountyStatus, type BountyDetail } from "./store";

export class SpendCapReached extends Error {}

export interface SettleOutcome {
  releaseTx: string | null;
  workerBps: number;
  workerAmountUsdc: number;
  posterAmountUsdc: number;
  note?: string;
}

/**
 * Pay out `workerBps` of the escrow to the worker and the remainder to the poster.
 *
 * @param reason free text for the log — which of the three doors this came through.
 * @param enforceDayCap true for a payout the arbiter chose (an autonomous or timed one);
 *   false when a human explicitly asked for it. The cap exists to bound what the SYSTEM
 *   spends on its own initiative, and refusing a poster who is deliberately paying for work
 *   they accepted would be the cap protecting nobody from anything.
 * @throws SpendCapReached before anything is written, when the cap would be exceeded.
 */
export async function settleBounty(
  detail: BountyDetail,
  workerBps: number,
  reason: string,
  enforceDayCap = false,
): Promise<SettleOutcome> {
  const { bounty, verdict } = detail;
  if (!verdict) throw new Error("settleBounty: no verdict to settle against");

  const total = Number(bounty.amount_usdc);

  if (isDryRun()) {
    // Deliberately not a silent success: a dry run that looked like a payment is how a
    // demo turns into a false claim about money having moved.
    return {
      releaseTx: null,
      workerBps,
      workerAmountUsdc: 0,
      posterAmountUsdc: 0,
      note: `DRY_RUN — ${reason} recorded, no USDC moved`,
    };
  }

  // Re-checked HERE rather than at judge time: judging takes ~20s and a settlement can now
  // sit in an objection window for two days, so any cap checked earlier is long stale.
  if (enforceDayCap) {
    const spend = (await liveCaps()).daySpend;
    const wouldSpend = (total * workerBps) / 10_000;
    if (wouldSpend > spend.remainingUsdc) {
      throw new SpendCapReached(
        `day cap reached (${spend.spentUsdc}/${spend.capUsdc} USDC` +
          `${spend.degraded ? ", ledger unreadable — failing closed" : ""}) — needs the poster to settle it`,
      );
    }
  }

  // A bounty opened on v2 finishes under v2's rules: pay in full or not at all, because that
  // contract has no split. Refusing a partial here rather than rounding it to something v2
  // can express — silently paying 100% or 0% of what a person was promised is not a fallback,
  // it is a different decision made on their behalf.
  if (!isCurrentVersion(bounty.escrow_version)) {
    if (workerBps !== 10_000 && workerBps !== 0) {
      throw new Error(
        `bounty này ở escrow v${bounty.escrow_version}, không chia tỉ lệ được — chỉ trả đủ hoặc để hoàn sau hạn`,
      );
    }
    if (workerBps === 0) {
      // v2's only way back to the poster is their own refund after the deadline.
      return {
        releaseTx: null, workerBps: 0, workerAmountUsdc: 0, posterAmountUsdc: 0,
        note: "escrow v2 — không trả cho người làm; người đăng tự hoàn tiền sau hạn",
      };
    }
    const legacy = await releaseEscrowV2(bounty.id, verdict.verdict_hash as `0x${string}`);
    await setVerdictSettlement(verdict.id, legacy.txHash, 10_000);
    await updateBountyStatus(bounty.id, "RELEASED");
    if (bounty.worker_id) await awardBountyPoints(bounty.worker_id, bounty.id, total);
    return {
      releaseTx: legacy.txHash, workerBps: 10_000, workerAmountUsdc: total, posterAmountUsdc: 0,
      note: "escrow v2 — trả đủ theo luật cũ",
    };
  }

  const settled = await settleEscrow(bounty.id, verdict.verdict_hash as `0x${string}`, workerBps);

  await setVerdictSettlement(verdict.id, settled.txHash, workerBps);
  // RELEASED means "this escrow is finished", not "the worker got everything". How much they
  // got is verdicts.worker_bps — one status instead of a family of near-identical ones.
  await updateBountyStatus(bounty.id, "RELEASED");

  if (settled.amountUsdc > 0) {
    if (bounty.worker_id) {
      await awardBountyPoints(bounty.worker_id, bounty.id, settled.amountUsdc);
    } else {
      console.error(`[points] settled ${bounty.id} but worker_id is null — DB out of step with chain`);
    }
  }

  console.info(
    `[settle] ${bounty.id} ${reason}: worker ${settled.amountUsdc}/${total} USDC (${workerBps}bps), tx ${settled.txHash}`,
  );

  return {
    releaseTx: settled.txHash,
    workerBps,
    workerAmountUsdc: settled.amountUsdc,
    posterAmountUsdc: settled.posterAmountUsdc,
  };
}
