// =============================================================================
// cctp.ts — CCTPv2 helpers (Sepolia → Arc)
//
// v2 active path. Iris v2 returns BOTH raw message + attestation by
// (sourceDomain, txHash) lookup, so no on-chain extraction is needed.
// =============================================================================

import {
  createPublicClient,
  createWalletClient,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { getArcChain } from "./chains";

// -------------------------------------------------------------------------
// pollAttestationV2 (CCTPv2)
//
// Iris v2 indexes messages by (sourceDomain, transactionHash). Single
// endpoint returns both the raw message bytes AND the attestation signature.
// Sandbox base for testnet; swap to https://iris-api.circle.com/v2 for mainnet.
// -------------------------------------------------------------------------
const IRIS_V2_BASE =
  process.env.CIRCLE_IRIS_API_V2 ?? "https://iris-api-sandbox.circle.com/v2";

interface IrisV2Message {
  status: string;
  message: string;
  attestation: string;
}

export async function pollAttestationV2(
  txHash: string,
  sourceDomain: number,
  timeoutMs = 180_000,
): Promise<{ message: `0x${string}`; attestation: `0x${string}` }> {
  const url = `${IRIS_V2_BASE}/messages/${sourceDomain}?transactionHash=${txHash}`;
  const deadline = Date.now() + timeoutMs;
  const pollInterval = 5_000;

  while (Date.now() < deadline) {
    const res = await fetch(url);
    if (res.ok) {
      const data = (await res.json()) as { messages?: IrisV2Message[] };
      const m = data.messages?.[0];
      if (m && m.status === "complete" && m.attestation && m.message) {
        return {
          message: m.message as `0x${string}`,
          attestation: m.attestation as `0x${string}`,
        };
      }
    }
    await new Promise((r) => setTimeout(r, pollInterval));
  }
  throw new Error(`pollAttestationV2: timeout after ${timeoutMs}ms for ${txHash}`);
}

// -------------------------------------------------------------------------
// receiveMessage
//
// Admin wallet calls MessageTransmitter.receiveMessage on Arc to mint USDC.
// Returns Arc txHash as soon as writeContract resolves; waitForTransactionReceipt
// fires detached so the SSE response can close inside Vercel's function window.
// -------------------------------------------------------------------------
export async function receiveMessage(
  message: string,
  attestation: string,
): Promise<{ txHash: string }> {
  const pk = process.env.AIG_ADMIN_WALLET_PRIVATE_KEY;
  if (!pk || !pk.startsWith("0x") || pk.length !== 66) {
    throw new Error("receiveMessage: AIG_ADMIN_WALLET_PRIVATE_KEY missing or malformed");
  }
  const account = privateKeyToAccount(pk as `0x${string}`);
  const arcChain = getArcChain();

  const walletClient = createWalletClient({
    account,
    chain: arcChain,
    transport: http(process.env.ARC_TESTNET_RPC_URL),
  });
  const publicClient = createPublicClient({
    chain: arcChain,
    transport: http(process.env.ARC_TESTNET_RPC_URL),
  });

  const messageTransmitterAbi = [
    {
      name: "receiveMessage",
      type: "function",
      stateMutability: "nonpayable",
      inputs: [
        { name: "message", type: "bytes" },
        { name: "attestation", type: "bytes" },
      ],
      outputs: [{ name: "success", type: "bool" }],
    },
  ] as const;

  const txHash = await walletClient.writeContract({
    address: process.env.CCTP_MESSAGE_TRANSMITTER_ARC as `0x${string}`,
    abi: messageTransmitterAbi,
    functionName: "receiveMessage",
    args: [message as `0x${string}`, attestation as `0x${string}`],
  });

  // Don't block on Arc receipt — tx is in mempool, will mine independently.
  // Returning immediately lets the SSE response complete inside Vercel's
  // serverless function window. Best-effort receipt wait runs detached.
  publicClient
    .waitForTransactionReceipt({ hash: txHash, timeout: 60_000 })
    .catch(() => {});
  return { txHash };
}
