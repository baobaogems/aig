// settlement-doubles.ts — the chain stand-in for the routes that move money.
//
// Separate from route-doubles.ts because it doubles a different thing: not the database, but
// the escrow contract. Kept honest in the one way that matters — it refuses a second
// settlement, so a test cannot pass while the code pays twice.

import { state } from "./route-doubles";

export const settled: Array<{ bountyId: string; verdictHash: string; workerBps: number }> = [];

export function resetChain(): void {
  settled.length = 0;
}

export const escrowDouble = {
  isDryRun: () => false,

  async settleEscrow(bountyId: string, verdictHash: `0x${string}`, workerBps: number) {
    if (settled.some((s) => s.bountyId === bountyId)) {
      throw new Error(`settleEscrow: bounty ${bountyId} already settled`);
    }
    if (!Number.isInteger(workerBps) || workerBps < 0 || workerBps > 10_000) {
      throw new Error(`settleEscrow: workerBps ${workerBps} outside 0..10000`);
    }
    settled.push({ bountyId, verdictHash, workerBps });

    const total = Number(state.bounties.get(bountyId)?.amount_usdc ?? 0);
    const workerAmount = Math.floor((Math.round(total * 1e6) * workerBps) / 10_000) / 1e6;
    return {
      txHash: `0xtx-${bountyId}` as `0x${string}`,
      worker: (state.bounties.get(bountyId)?.worker_id ?? "0x0") as `0x${string}`,
      amountUsdc: workerAmount,
      posterAmountUsdc: Math.round((total - workerAmount) * 1e6) / 1e6,
      workerBps,
    };
  },

  async markSubmittedOnChain() {
    return { txHash: "0xmark" as `0x${string}` };
  },

  /** The frozen v2 path: full payment or nothing, because that contract cannot split. */
  async releaseEscrowV2(bountyId: string) {
    if (settled.some((s) => s.bountyId === bountyId)) {
      throw new Error(`releaseEscrowV2: bounty ${bountyId} already settled`);
    }
    settled.push({ bountyId, verdictHash: "0xv2", workerBps: 10_000 });
    return { txHash: `0xv2-${bountyId}` as `0x${string}` };
  },
};

/** Day-cap ledger with room by default; a test tightens it to check the fail-closed path. */
export const ledgerDouble = {
  remainingUsdc: 1_000,
  degraded: false,
  async liveCaps() {
    return {
      perBountyUsdc: 50,
      perDayRemainingUsdc: ledgerDouble.remainingUsdc,
      daySpend: {
        spentUsdc: 0,
        remainingUsdc: ledgerDouble.remainingUsdc,
        capUsdc: 150,
        degraded: ledgerDouble.degraded,
      },
    };
  },
};
