// =============================================================================
// escrow.ts — the money layer for AIG v4. Chain I/O only; no judging logic here.
//
// SAFETY: every write path in this file refuses to run while DRY_RUN !== "false".
// The judging pipeline (lib/arbiter/*) is money-independent by design; this module is
// the single door between a verdict and a USDC transfer.
// =============================================================================

import "server-only";
import { createPublicClient, createWalletClient, http, keccak256, toBytes, parseUnits, formatUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { getArcChain } from "./chains";
import { arbiterEscrowAbi } from "./escrow-abi";
import { withRpcRetry } from "./rpc-retry";

/** USDC has 6 decimals on Arc. */
export const USDC_DECIMALS = 6;

export function usdcToUnits(amountUsdc: number): bigint {
  return parseUnits(amountUsdc.toString(), USDC_DECIMALS);
}

export function unitsToUsdc(units: bigint): number {
  return Number(formatUnits(units, USDC_DECIMALS));
}

/**
 * Off-chain bounty ids are UUIDs; on-chain keys are bytes32.
 * keccak256 of the UUID string — deterministic, collision-free for our purposes.
 */
export function toBountyKey(bountyId: string): `0x${string}` {
  return keccak256(toBytes(bountyId));
}

export function isDryRun(): boolean {
  // Money only connects when DRY_RUN is explicitly "false" (mirrors lib/arbiter/run.ts).
  return process.env.DRY_RUN !== "false";
}

export function escrowAddress(): `0x${string}` {
  const addr = process.env.ARBITER_ESCROW_ADDRESS;
  if (!addr || !addr.startsWith("0x") || addr.length !== 42) {
    throw new Error("ARBITER_ESCROW_ADDRESS missing or malformed (deploy the contract first)");
  }
  return addr as `0x${string}`;
}

export function arcPublicClient() {
  return createPublicClient({ chain: getArcChain(), transport: http(process.env.ARC_TESTNET_RPC_URL) });
}

/**
 * The AIG server wallet. On-chain it is the `arbiter` — the only key the contract accepts for
 * release(). In the pilot it ALSO posts the seed bounties (see escrow-poster.ts), so the same
 * key wears two hats; community posters sign createBounty from their own wallets.
 */
export function serverWallet() {
  const pk = process.env.AIG_ADMIN_WALLET_PRIVATE_KEY;
  if (!pk || !pk.startsWith("0x") || pk.length !== 66) {
    throw new Error("AIG_ADMIN_WALLET_PRIVATE_KEY missing or malformed");
  }
  const account = privateKeyToAccount(pk as `0x${string}`);
  return createWalletClient({ account, chain: getArcChain(), transport: http(process.env.ARC_TESTNET_RPC_URL) });
}

export interface OnChainBounty {
  poster: `0x${string}`;
  worker: `0x${string}`;
  amount: bigint;
  deadline: bigint;
  /** 0 = nobody has taken the job. */
  claimedAt: bigint;
  /** 0 = nothing handed in. Non-zero shuts the poster's unilateral refund. */
  submittedAt: bigint;
  settled: boolean;
  refunded: boolean;
}

/** Read the escrow record. Returns null when the bounty was never created on-chain. */
export async function getBounty(bountyId: string): Promise<OnChainBounty | null> {
  const b = await withRpcRetry(
    () =>
      arcPublicClient().readContract({
        address: escrowAddress(),
        abi: arbiterEscrowAbi,
        functionName: "getBounty",
        args: [toBountyKey(bountyId)],
      }) as Promise<OnChainBounty>,
    { label: "getBounty" },
  );
  return b.poster === "0x0000000000000000000000000000000000000000" ? null : b;
}

/** Wait for a receipt, tolerating the RPC dropping requests mid-poll. */
export async function awaitReceipt(hash: `0x${string}`, label: string) {
  return withRpcRetry(() => arcPublicClient().waitForTransactionReceipt({ hash, timeout: 120_000 }), { label });
}

/**
 * Record on-chain that a deliverable exists. This is what shuts the poster's unilateral
 * refund and starts the settlement clock.
 *
 * Call it ONLY for work the verdict found plausible (T1/T2). Marking junk would lock an
 * escrow the poster is entitled to get back, which is the mirror image of the abuse v3
 * exists to stop.
 */
export async function markSubmittedOnChain(bountyId: string): Promise<{ txHash: `0x${string}` }> {
  if (isDryRun()) throw new Error("markSubmittedOnChain called while DRY_RUN is on");

  const onChain = await getBounty(bountyId);
  if (!onChain) throw new Error(`markSubmitted: bounty ${bountyId} not found on-chain`);
  if (onChain.settled || onChain.refunded) throw new Error(`markSubmitted: bounty ${bountyId} already settled`);
  // Already marked is not an error: the clock is running, which is all the caller wanted.
  if (onChain.submittedAt > 0n) return { txHash: "0x" as `0x${string}` };

  const txHash = await withRpcRetry(
    () =>
      serverWallet().writeContract({
        address: escrowAddress(),
        abi: arbiterEscrowAbi,
        functionName: "markSubmitted",
        args: [toBountyKey(bountyId)],
      }),
    { label: "markSubmitted" },
  );
  const receipt = await awaitReceipt(txHash, "markSubmitted receipt");
  if (receipt.status !== "success") throw new Error(`markSubmitted: tx ${txHash} reverted on-chain`);
  return { txHash };
}

export interface SettleResultOnChain {
  txHash: `0x${string}`;
  worker: `0x${string}`;
  /** What the worker actually received — not what the verdict wished for. */
  amountUsdc: number;
  /** What went back to the poster. Non-zero whenever workerBps < 10000. */
  posterAmountUsdc: number;
  workerBps: number;
}

/**
 * Settle the escrow, splitting it between worker and poster.
 *
 * Pre-flight checks are deliberately redundant with the contract's own reverts: a clear
 * server-side error is cheaper to debug than a reverted transaction, and a refused
 * settlement must never look like a successful one.
 */
export async function settleEscrow(
  bountyId: string,
  verdictHash: `0x${string}`,
  workerBps: number,
): Promise<SettleResultOnChain> {
  if (isDryRun()) throw new Error("settleEscrow called while DRY_RUN is on — refusing to move money");
  if (!verdictHash || verdictHash === "0x" || /^0x0+$/.test(verdictHash)) {
    throw new Error("settleEscrow: empty verdictHash — a settlement must carry an auditable verdict");
  }
  if (!Number.isInteger(workerBps) || workerBps < 0 || workerBps > 10_000) {
    throw new Error(`settleEscrow: workerBps ${workerBps} outside 0..10000`);
  }

  const onChain = await getBounty(bountyId);
  if (!onChain) throw new Error(`settleEscrow: bounty ${bountyId} not found on-chain`);
  if (onChain.settled) throw new Error(`settleEscrow: bounty ${bountyId} already settled`);
  if (onChain.refunded) throw new Error(`settleEscrow: bounty ${bountyId} already refunded`);
  if (onChain.submittedAt === 0n) {
    throw new Error(`settleEscrow: bounty ${bountyId} has no submission on-chain — markSubmitted first`);
  }

  // Retrying the send is safe: the contract allows one settlement per bounty, ever, so a
  // duplicate submission reverts instead of paying twice.
  const txHash = await withRpcRetry(
    () =>
      serverWallet().writeContract({
        address: escrowAddress(),
        abi: arbiterEscrowAbi,
        functionName: "settle",
        args: [toBountyKey(bountyId), verdictHash, workerBps],
      }),
    { label: "settle" },
  );

  const receipt = await awaitReceipt(txHash, "settle receipt");
  if (receipt.status !== "success") throw new Error(`settleEscrow: tx ${txHash} reverted on-chain`);

  const total = unitsToUsdc(onChain.amount);
  const workerAmount = unitsToUsdc((onChain.amount * BigInt(workerBps)) / 10_000n);
  return {
    txHash,
    worker: onChain.worker,
    amountUsdc: workerAmount,
    // The remainder, exactly as the contract computes it — never recomputed from bps.
    posterAmountUsdc: Math.round((total - workerAmount) * 1e6) / 1e6,
    workerBps,
  };
}

/**
 * Refund the poster after the deadline.
 * NOTE: the contract requires msg.sender == poster, so this server path only works for
 * bounties posted BY the admin wallet (the pilot's seed bounties). Community posters
 * refund from their own wallet in the UI using the same ABI.
 */
export async function refundEscrow(bountyId: string): Promise<{ txHash: `0x${string}` }> {
  if (isDryRun()) throw new Error("refundEscrow called while DRY_RUN is on — refusing to move money");

  const onChain = await getBounty(bountyId);
  if (!onChain) throw new Error(`refundEscrow: bounty ${bountyId} not found on-chain`);

  const wallet = serverWallet();
  if (onChain.poster.toLowerCase() !== wallet.account.address.toLowerCase()) {
    throw new Error(`refundEscrow: admin wallet is not the poster of ${bountyId} — refund must be signed by ${onChain.poster}`);
  }

  const txHash = await withRpcRetry(
    () =>
      wallet.writeContract({
        address: escrowAddress(),
        abi: arbiterEscrowAbi,
        functionName: "refund",
        args: [toBountyKey(bountyId)],
      }),
    { label: "refund" },
  );
  await awaitReceipt(txHash, "refund receipt");
  return { txHash };
}
