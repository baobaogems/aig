// =============================================================================
// chains.ts — Custom viem chain definitions
// Used by cctp.ts (v2 receiveMessage on Arc)
// =============================================================================

import { defineChain } from "viem";

/**
 * Returns the Arc Testnet viem chain object.
 * Arc is not in viem's built-in chains — defined from env vars.
 * Required env vars: ARC_CHAIN_ID, ARC_TESTNET_RPC_URL
 */
export function getArcChain() {
  const chainId = parseInt(process.env.ARC_CHAIN_ID ?? "0", 10);
  if (!chainId) throw new Error("ARC_CHAIN_ID env var not set");

  return defineChain({
    id: chainId,
    name: "Arc Testnet",
    nativeCurrency: { name: "Arc", symbol: "ARC", decimals: 18 },
    rpcUrls: {
      default: { http: [process.env.ARC_TESTNET_RPC_URL!] },
    },
  });
}
