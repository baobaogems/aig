"use client";

// =============================================================================
// providers.tsx — Client-side providers (Wagmi + TanStack Query)
// Extracted from layout.tsx to keep root layout as a server component,
// preventing hydration mismatches with wagmi state.
//
// Arc testnet is the chain that matters now: posters sign createBounty and workers sign
// claim() from their own wallets (plan 260920-0835). Sepolia stays only because the v2 CCTP
// source chain lives there; do NOT remove wagmi when the merchant cluster is deleted —
// see the cross-plan note in plans/260904-1442-arbiter-pivot-cleanup/plan.md.
// =============================================================================

import { type ReactNode, useState } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { injected } from "wagmi/connectors";
import { ARC_RPC_URL, arcChain } from "@/lib/arc-chain-client";

const sepoliaRpc =
  process.env.NEXT_PUBLIC_ETHEREUM_SEPOLIA_RPC_URL ||
  "https://ethereum-sepolia-rpc.publicnode.com";

export function Providers({ children }: { children: ReactNode }) {
  const [wagmiConfig] = useState(() => {
    const arc = arcChain();
    return createConfig({
      chains: [arc, sepolia],
      connectors: [injected()],
      transports: {
        [arc.id]: http(ARC_RPC_URL),
        [sepolia.id]: http(sepoliaRpc),
      },
      ssr: true,
    });
  });
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
