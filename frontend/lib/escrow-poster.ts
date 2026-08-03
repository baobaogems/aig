// =============================================================================
// escrow-poster.ts — the POSTER side of the escrow, signed by the AIG server wallet.
//
// Only for pilot seed bounties (Baobao posts, the server holds the key). Community posters
// sign createBounty from their own wallet in the UI using the same ABI — this module exists
// so the seed flow doesn't re-implement chain plumbing.
// =============================================================================

import "server-only";
import { arbiterEscrowAbi, erc20ApproveAbi } from "./escrow-abi";
import { arcPublicClient, awaitReceipt, escrowAddress, isDryRun, serverWallet, toBountyKey, usdcToUnits } from "./escrow";
import { withRpcRetry } from "./rpc-retry";

function usdcAddress(): `0x${string}` {
  const addr = process.env.USDC_ADDRESS_ARC_TESTNET;
  if (!addr || !addr.startsWith("0x") || addr.length !== 42) {
    throw new Error("USDC_ADDRESS_ARC_TESTNET missing or malformed");
  }
  return addr as `0x${string}`;
}

export async function usdcBalance(owner: `0x${string}`): Promise<bigint> {
  return withRpcRetry(
    () =>
      arcPublicClient().readContract({
        address: usdcAddress(),
        abi: erc20ApproveAbi,
        functionName: "balanceOf",
        args: [owner],
      }) as Promise<bigint>,
    { label: "usdcBalance" },
  );
}

export interface CreateBountyResult {
  bountyKey: `0x${string}`;
  approveTxHash?: `0x${string}`;
  createTxHash: `0x${string}`;
}

/**
 * Approve (only if needed) and lock USDC for a bounty.
 * @param deadlineUnix absolute unix seconds — must be in the future (contract enforces it too).
 */
export async function createSeedBounty(
  bountyId: string,
  worker: `0x${string}`,
  amountUsdc: number,
  deadlineUnix: number,
): Promise<CreateBountyResult> {
  if (isDryRun()) throw new Error("createSeedBounty called while DRY_RUN is on — refusing to move money");

  const wallet = serverWallet();
  const pub = arcPublicClient();
  const poster = wallet.account.address;
  const escrow = escrowAddress();
  const amount = usdcToUnits(amountUsdc);

  const balance = await usdcBalance(poster);
  if (balance < amount) {
    throw new Error(`createSeedBounty: poster ${poster} holds ${balance} USDC units, needs ${amount}`);
  }

  let approveTxHash: `0x${string}` | undefined;
  const allowance = await withRpcRetry(
    () =>
      pub.readContract({
        address: usdcAddress(),
        abi: erc20ApproveAbi,
        functionName: "allowance",
        args: [poster, escrow],
      }) as Promise<bigint>,
    { label: "allowance" },
  );

  if (allowance < amount) {
    // Approve the exact amount, not MaxUint256 — a bounded allowance is the whole point of a cap.
    approveTxHash = await withRpcRetry(
      () =>
        wallet.writeContract({
          address: usdcAddress(),
          abi: erc20ApproveAbi,
          functionName: "approve",
          args: [escrow, amount],
        }),
      { label: "approve" },
    );
    await awaitReceipt(approveTxHash, "approve receipt");
  }

  // Retry-safe: a duplicate createBounty for the same id reverts with BountyExists.
  const createTxHash = await withRpcRetry(
    () =>
      wallet.writeContract({
        address: escrow,
        abi: arbiterEscrowAbi,
        functionName: "createBounty",
        args: [toBountyKey(bountyId), worker, amount, BigInt(deadlineUnix)],
      }),
    { label: "createBounty" },
  );
  const receipt = await awaitReceipt(createTxHash, "createBounty receipt");
  if (receipt.status !== "success") throw new Error(`createSeedBounty: tx ${createTxHash} reverted`);

  return { bountyKey: toBountyKey(bountyId), approveTxHash, createTxHash };
}
