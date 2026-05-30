// =============================================================================
// cctp.ts — CCTP helper (primary bridge path)
// Uses Circle BridgeKit / CCTP contracts directly
//
// Activated when: BRIDGE_MODE=CCTP (Domain 7 smoke test PASS)
// Arc Testnet CCTP Domain ID: 7
// =============================================================================

import {
  createPublicClient,
  createWalletClient,
  http,
  decodeAbiParameters,
  keccak256,
  type Chain,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet, sepolia } from "viem/chains";
import { getArcChain } from "./chains";

// Circle CCTP MessageSent(bytes) topic0 — precomputed keccak256
// keccak256("MessageSent(bytes)") = 0x8c5261668696ce22758910d05bab8f186d6eb247ceac2af2e82c7dc17669b036
const MESSAGE_SENT_TOPIC =
  "0x8c5261668696ce22758910d05bab8f186d6eb247ceac2af2e82c7dc17669b036" as `0x${string}`;

// Circle Attestation API response shape
interface AttestationResponse {
  status: "complete" | "pending_confirmations";
  attestation: string | null;
}

// -------------------------------------------------------------------------
// extractMessageBytesFromReceipt (internal)
//
// Fetches BSC Testnet tx receipt and extracts the raw CCTP message bytes
// from the MessageSent(bytes) event log. Single RPC call — used by both
// extractMessageHash() and extractRawMessage() to avoid duplicate fetches.
// -------------------------------------------------------------------------
// Source-chain config — which chain the customer's burn tx happened on.
// v1 = BSC Testnet (existed but was dead code), v2 = Ethereum Sepolia.
export interface SourceChainConfig {
  chain: Chain;
  rpcUrl: string;
}

// Convenience builders for the two real source chains AIG knows about.
// Phase 03 adds Eth Sepolia for the v2 CCTP path; BSC stays for v1 compat.
export const V1_BSC_SOURCE: SourceChainConfig = {
  chain: bscTestnet,
  rpcUrl: process.env.BSC_TESTNET_RPC_URL ?? "",
};
export const V2_ETH_SEPOLIA_SOURCE: SourceChainConfig = {
  chain: sepolia,
  rpcUrl: process.env.ETHEREUM_SEPOLIA_RPC_URL ?? "",
};

async function extractMessageBytesFromReceipt(
  txHash: string,
  source: SourceChainConfig = V1_BSC_SOURCE,
): Promise<`0x${string}`> {
  const client = createPublicClient({
    chain: source.chain,
    transport: http(source.rpcUrl),
  });

  const receipt = await client.waitForTransactionReceipt({
    hash: txHash as `0x${string}`,
    timeout: 60_000,
  });

  const msgLog = receipt.logs.find(
    (l) => l.topics[0]?.toLowerCase() === MESSAGE_SENT_TOPIC.toLowerCase()
  );

  if (!msgLog) {
    throw new Error(`extractMessageBytes: MessageSent log not found in tx ${txHash}`);
  }

  // Log data is ABI-encoded: abi.encode(bytes message)
  const [messageBytes] = decodeAbiParameters([{ type: "bytes" }], msgLog.data);
  return messageBytes as `0x${string}`;
}

// -------------------------------------------------------------------------
// extractMessageHash / extractRawMessage
//
// Returns keccak256(messageBytes) and raw bytes respectively.
// Source defaults to V1 BSC Testnet for backward-compat with v1 callers;
// v2 callers pass V2_ETH_SEPOLIA_SOURCE (or any SourceChainConfig).
// -------------------------------------------------------------------------
export async function extractMessageHash(
  txHash: string,
  source: SourceChainConfig = V1_BSC_SOURCE,
): Promise<string> {
  const messageBytes = await extractMessageBytesFromReceipt(txHash, source);
  return keccak256(messageBytes);
}

export async function extractRawMessage(
  txHash: string,
  source: SourceChainConfig = V1_BSC_SOURCE,
): Promise<string> {
  return extractMessageBytesFromReceipt(txHash, source);
}

// -------------------------------------------------------------------------
// pollAttestation
//
// Polls Circle Attestation API until attestation is available or timeout.
// Called after depositForBurn() tx is confirmed on BSC Testnet.
// -------------------------------------------------------------------------
export async function pollAttestation(
  messageHash: string,
  timeoutMs = 120_000 // PRD F-002: 120s timeout before BRIDGE_DELAYED
): Promise<string> {
  const apiBase = process.env.CIRCLE_ATTESTATION_API;
  if (!apiBase) throw new Error("CIRCLE_ATTESTATION_API not set");

  const deadline = Date.now() + timeoutMs;
  const pollInterval = 5_000; // 5s between polls

  while (Date.now() < deadline) {
    const res = await fetch(`${apiBase}/${messageHash}`);
    if (res.ok) {
      const data: AttestationResponse = await res.json();
      if (data.status === "complete" && data.attestation) {
        return data.attestation;
      }
    }
    await new Promise((r) => setTimeout(r, pollInterval));
  }

  throw new Error(`pollAttestation: timeout after ${timeoutMs}ms for ${messageHash}`);
}

// -------------------------------------------------------------------------
// pollAttestationV2 (CCTPv2)
//
// Iris v2 indexes messages by (sourceDomain, transactionHash) — NOT by
// messageHash like v1. Single endpoint returns both the raw message bytes
// AND the attestation signature, so v2 callers skip the on-chain
// extractMessageHash/extractRawMessage step entirely.
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
// Calls MessageTransmitter.receiveMessage() on Arc Testnet to mint USDC.
// Called after attestation is confirmed via pollAttestation().
// -------------------------------------------------------------------------
export async function receiveMessage(
  message: string,
  attestation: string
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

  await publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 60_000 });
  return { txHash };
}
