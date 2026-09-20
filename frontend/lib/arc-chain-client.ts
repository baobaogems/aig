// =============================================================================
// arc-chain-client.ts — Arc testnet as the BROWSER sees it.
//
// Separate from lib/chains.ts on purpose: that one reads ARC_CHAIN_ID / ARC_TESTNET_RPC_URL,
// which are server-only and resolve to undefined in a client bundle. This one reads the
// NEXT_PUBLIC_* pair.
//
// NEXT_PUBLIC_* values are inlined at BUILD time. A variable that is set-but-empty ships an
// empty string into the bundle and no runtime fix can rescue it — this repo has already been
// burned by that (empty NEXT_PUBLIC_CCTP_* shipped SOURCE_CHAIN_ID = Number("") = 0).
// Hence `||` everywhere below, plus a loud throw instead of a silent zero.
// =============================================================================

import { defineChain } from "viem";

export const ARC_CHAIN_ID = Number.parseInt(process.env.NEXT_PUBLIC_ARC_CHAIN_ID || "0", 10);

const ARC_RPC =
  process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.testnet.arc.network";

/** Throws loudly at module load if the build shipped an empty chain id. */
export function arcChain() {
  if (!Number.isFinite(ARC_CHAIN_ID) || ARC_CHAIN_ID <= 0) {
    throw new Error(
      "NEXT_PUBLIC_ARC_CHAIN_ID is missing or empty in this build — rebuild with the env var set",
    );
  }
  return defineChain({
    id: ARC_CHAIN_ID,
    name: "Arc Testnet",
    nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
    rpcUrls: { default: { http: [ARC_RPC] } },
    testnet: true,
  });
}

export const ARC_RPC_URL = ARC_RPC;
